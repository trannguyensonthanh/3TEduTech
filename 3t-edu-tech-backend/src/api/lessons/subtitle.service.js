const httpStatus = require('http-status').status;
const subtitleRepository = require('./subtitle.repository');
const lessonRepository = require('./lessons.repository');
const courseRepository = require('../courses/courses.repository');
const { checkCourseAccess } = require('../sections/sections.service');
const ApiError = require('../../core/errors/ApiError');
const logger = require('../../utils/logger');
const { getConnection, sql } = require('../../database/connection');
const { toCamelCaseObject } = require('../../utils/caseConverter');
const languageRepository = require('../languages/languages.repository');
const cloudinaryUtil = require('../../utils/cloudinary.util');
const config = require('../../config');
const { getAiServiceUrl } = require('../../services/aiSync.service');
/* [SỬA 19/08/2026] Gọi AI Service qua aiClient để luôn có khóa nội bộ và thời
   gian chờ. Trước đây dùng axios trần nên khi bật khóa nội bộ, AI Service trả
   401 còn giao diện vẫn báo với giảng viên là "đã gửi lệnh, quay lại sau 1-3
   phút" -- phụ đề không bao giờ tới mà không ai biết vì sao. */
const aiClient = require('../../services/aiClient');

/**
 * Lấy danh sách phụ đề cho một bài học.
 * @param {number} lessonId
 * @param {object} user - User hiện tại (để check quyền xem lesson).
 * @returns {Promise<Array<object>>}
 */
const getSubtitles = async (lessonId, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson)
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');

  const result = await subtitleRepository.findSubtitlesByLessonId(lessonId);
  return toCamelCaseObject(result);
};

/**
 * Instructor thêm phụ đề mới.
 * @param {number} lessonId
 * @param {object} subtitleData - { languageCode, subtitleUrl, isDefault }
 * @param {object} user - Instructor/Admin.
 * @returns {Promise<object>} - Phụ đề mới.
 */
const addSubtitle = async (lessonId, subtitleData, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson)
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  await checkCourseAccess(lesson.CourseID, user, 'thêm phụ đề');

  const { languageCode, subtitleUrl, isDefault } = subtitleData;

  const langRecord = await languageRepository.findLanguageByCode(
    languageCode.toLowerCase()
  );
  if (!langRecord || !langRecord.IsActive) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Mã ngôn ngữ '${languageCode}' không hợp lệ hoặc không được kích hoạt.`
    );
  }
  const languageName = langRecord.LanguageName;

  const dataToSave = {
    LessonID: lessonId,
    LanguageCode: languageCode.toLowerCase(),
    LanguageName: languageName,
    SubtitleUrl: subtitleUrl,
    IsDefault: !!isDefault,
  };

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    // [ƯU TIÊN USER]: Trước khi nạp phụ đề do người dùng tự import, kiểm tra xem đã có sẵn bản phụ đề (đặc biệt là do AI tự động tạo trước đó) hay chưa
    const existingSubtitles = await subtitleRepository.findSubtitlesByLessonId(lessonId);
    const oldSub = existingSubtitles.find(
      (s) => s.LanguageCode && s.LanguageCode.toLowerCase() === dataToSave.LanguageCode
    );
    if (oldSub) {
      // Dọn dẹp file .SRT cũ trên Cloudinary (nhất là tệp do AI từng tạo ra)
      if (oldSub.SubtitleUrl) {
        const oldPublicId = cloudinaryUtil.extractPublicIdFromUrl(oldSub.SubtitleUrl);
        if (oldPublicId) {
          try {
            await cloudinaryUtil.deleteAsset(oldPublicId, { resource_type: 'raw' });
            logger.info(`[User-Priority] Đã tiêu hủy tệp srt cũ/AI (${oldPublicId}) trên Cloudinary để nhường chỗ cho srt mới do Giảng viên import.`);
          } catch (err) {
            logger.error(`[User-Priority] Lỗi dọn srt cũ trên Cloudinary:`, err);
          }
        }
      }
      // Xóa bản ghi cũ trong DB để nhường ngôi cho bản import từ Người dùng
      await subtitleRepository.deleteSubtitleById(oldSub.SubtitleID, transaction);
      logger.info(`[User-Priority] Đã tháo dỡ bản ghi phụ đề cũ '${dataToSave.LanguageCode}' thuộc bài học #${lessonId} để thế chỗ bản mới nhất do Giảng viên tự upload.`);
    }

    if (dataToSave.IsDefault) {
      await subtitleRepository.setPrimarySubtitle(lessonId, 0, transaction);
    }

    const newSubtitle = await subtitleRepository.addSubtitle(
      dataToSave,
      transaction
    );

    const subtitlesCount = await subtitleRepository.countSubtitlesByLessonId(
      lessonId,
      transaction
    );

    if (subtitlesCount === 1) {
      await subtitleRepository.setPrimarySubtitle(
        lessonId,
        newSubtitle.SubtitleID,
        transaction
      );
      newSubtitle.IsDefault = true;
    }

    if (dataToSave.IsDefault) {
      await subtitleRepository.setPrimarySubtitle(
        lessonId,
        newSubtitle.SubtitleID,
        transaction
      );
      newSubtitle.IsDefault = true;
    }

    await transaction.commit();
    return toCamelCaseObject(newSubtitle);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error adding subtitle for lesson ${lessonId}:`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Thêm phụ đề thất bại.'
    );
  }
};

/**
 * Instructor đặt phụ đề làm mặc định.
 * @param {number} lessonId
 * @param {number} subtitleId
 * @param {object} user
 * @returns {Promise<object>} - Phụ đề đã được cập nhật.
 */
const setPrimarySubtitle = async (lessonId, subtitleId, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  await checkCourseAccess(lesson.CourseID, user, 'cập nhật phụ đề');

  const subtitle = await subtitleRepository.findSubtitleById(subtitleId);

  if (!subtitle || Number(subtitle.LessonID) !== lessonId) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Phụ đề không tồn tại hoặc không thuộc bài học này.'
    );
  }

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await subtitleRepository.setPrimarySubtitle(lessonId, 0, transaction);

    const updatedSubtitle = await subtitleRepository.setPrimarySubtitle(
      lessonId,
      subtitleId,
      transaction
    );

    await transaction.commit();

    logger.info(`Subtitle ${subtitleId} set as primary for lesson ${lessonId}`);
    return toCamelCaseObject(updatedSubtitle);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error setting primary subtitle ${subtitleId}:`, error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Đặt phụ đề chính thất bại.'
    );
  }
};

/**
 * Instructor xóa phụ đề.
 * @param {number} lessonId
 * @param {number} subtitleId
 * @param {object} user
 * @returns {Promise<void>}
 */
const deleteSubtitle = async (lessonId, subtitleId, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson)
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  await checkCourseAccess(lesson.CourseID, user, 'xóa phụ đề');

  const subtitle = await subtitleRepository.findSubtitleById(subtitleId);
  if (!subtitle || Number(subtitle.LessonID) !== lessonId) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Phụ đề không tồn tại hoặc không thuộc bài học này.'
    );
  }

  if (subtitle.SubtitleUrl) {
    const publicId = cloudinaryUtil.extractPublicIdFromUrl(subtitle.SubtitleUrl);
    if (publicId) {
      try {
        await cloudinaryUtil.deleteAsset(publicId, { resource_type: 'raw' });
        logger.info(`Deleted subtitle asset from Cloudinary: ${publicId}`);
      } catch (err) {
        logger.error(`Failed to delete subtitle asset ${publicId} from Cloudinary:`, err);
      }
    }
  }

  const deletedCount = await subtitleRepository.deleteSubtitleById(subtitleId);
  if (deletedCount === 0) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Xóa phụ đề thất bại.'
    );
  }
  logger.info(`Subtitle ${subtitleId} deleted for lesson ${lessonId}`);
};

/**
 * Lưu tệp phụ đề .SRT do AI tự động tạo và tải lên Cloudinary.
 */
const saveAiGeneratedSubtitle = async (lessonId, { srtContent, languageCode }) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    logger.warn(`🤖 [AI Subtitle Webhook] Lesson ${lessonId} không tồn tại.`);
    return;
  }
  const code = (languageCode || 'vi').toLowerCase();

  // [BẢO VỆ ƯU TIÊN USER - AI LÀ THẾ VAI]: Kiểm tra xem người dùng ĐÃ chủ động import tệp srt chưa
  const existingSubtitles = await subtitleRepository.findSubtitlesByLessonId(lessonId);
  const existingForLang = existingSubtitles.find(s => s.LanguageCode && s.LanguageCode.toLowerCase() === code);
  if (existingForLang) {
    // NẾU ĐÃ CÓ PHỤ ĐỀ TRONG HỆ THỐNG => Có nghĩa là Giảng viên đã chủ động import SRT.
    // Thực thi chính sách BẢO VỆ SRT NGƯỜI DÙNG: Từ chối cho phép AI tự động nạp đè hay hủy hoại file srt của Giảng viên!
    logger.info(`🤖🛡️ [User-SRT Priority] Bài học #${lessonId} (ngôn ngữ '${code}') ĐÃ CÓ SẴN phụ đề do giảng viên tự import (${existingForLang.SubtitleUrl}). AI lập tức nhường ưu tiên, hủy nạp đè kết quả tự dịch!`);
    return { status: 'skipped_due_to_user_priority', existingSubtitle: toCamelCaseObject(existingForLang) };
  }
  
  try {
    const buffer = Buffer.from(srtContent, 'utf-8');
    const publicId = `lesson_${lessonId}_${code}_${Date.now()}.srt`;
    const uploadResult = await cloudinaryUtil.uploadStream(buffer, {
      folder: `courses/${lesson.CourseID}/lessons/${lessonId}/subtitles`,
      resource_type: 'raw',
      public_id: publicId
    });

    const subtitleUrl = uploadResult.secure_url || uploadResult.url;
    
    const dataToSave = {
      LessonID: lessonId,
      LanguageCode: code,
      LanguageName: 'Vietnamese',
      SubtitleUrl: subtitleUrl,
      IsDefault: 1,
    };

    const newSubtitle = await subtitleRepository.addSubtitle(dataToSave);
    logger.info(`✅ [AI Subtitle] Đã lưu thành công phụ đề tự động .SRT cho lesson #${lessonId} tại: ${subtitleUrl} (do giảng viên chưa import tay)`);
    return toCamelCaseObject(newSubtitle);
  } catch (error) {
    logger.error(`🤖 [AI Subtitle] Lỗi khi tải lên và lưu phụ đề .SRT cho lesson #${lessonId}: ${error.message}`);
    throw error;
  }
};

/**
 * Kích hoạt tạo phụ đề AI theo yêu cầu chủ động từ Giảng viên (Nút bấm On-Demand)
 * @param {number} lessonId
 * @param {object} user - Giảng viên thực hiện
 */
const generateAiSubtitleOnDemand = async (lessonId, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  await checkCourseAccess(lesson.CourseID, user, 'kích hoạt AI tạo phụ đề');

  if (!lesson.ExternalVideoID && !lesson.VideoUrl && lesson.VideoSourceType !== 'CLOUDINARY') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Bài học này chưa có tệp video nào. Vui lòng tải lên video trước khi sử dụng AI.'
    );
  }

  // Chống hao tốn chi phí và bảo vệ file tay: Kiểm tra xem bài học đã có phụ đề nào chưa
  const existingSubtitles = await subtitleRepository.findSubtitlesByLessonId(lessonId);
  if (existingSubtitles && existingSubtitles.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Bài học này đã có sẵn phụ đề (do bạn hoặc AI từng import trước đó). Nếu bạn muốn dùng AI dịch và tạo mới lại, vui lòng xóa tệp phụ đề hiện tại trước khi ấn nút kịch hoạt!'
    );
  }

  try {
    const course = await courseRepository.findCourseById(lesson.CourseID);
    const courseName = course ? course.CourseName : 'Unknown Course';
    const lessonName = lesson.LessonName;

    let signedUrl = lesson.VideoUrl || lesson.ExternalVideoID;
    if (lesson.VideoSourceType === 'CLOUDINARY' && lesson.ExternalVideoID) {
      signedUrl = cloudinaryUtil.generateSignedUrl(lesson.ExternalVideoID, {
        resource_type: 'video',
        type: 'private',
      });
    }


    // Webhook URL: AI Service sẽ gọi về Backend qua SERVER_URL (public URL)
    const serverBaseUrl = config.serverUrl || `http://127.0.0.1:${config.port}`;
    const webhookUrl = `${serverBaseUrl}/v1/lessons/${lessonId}/subtitles/auto-webhook`;

    aiClient
      .post(
        '/api/ingest/transcribe',
        {
          video_url: signedUrl,
          course_name: courseName,
          lesson_name: lessonName,
          lesson_id: Number(lessonId),
          webhook_url: webhookUrl,
        },
        30000
      )
      .then(() => {
        logger.info(`✨ [AI On-Demand] Giảng viên đã kích hoạt AI dịch video cho bài học #${lessonId}`);
      })
      .catch((err) => {
        logger.error(`❌ [AI On-Demand] Lỗi gọi sang AI Service cho bài học #${lessonId}:`, err.message);
      });
  } catch (error) {
    logger.error(`❌ [AI On-Demand] Lỗi khởi tạo luồng dịch cho bài học #${lessonId}:`, error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể kết nối tới máy chủ AI Transcribing lúc này.');
  }

  return { message: 'Đã gửi lệnh cho máy chủ AI tiến hành dịch và tạo phụ đề! Vui lòng quay lại kiểm tra sau 1-3 phút.' };
};

module.exports = {
  getSubtitles,
  addSubtitle,
  setPrimarySubtitle,
  deleteSubtitle,
  saveAiGeneratedSubtitle,
  generateAiSubtitleOnDemand,
};
