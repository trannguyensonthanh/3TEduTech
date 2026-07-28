const httpStatus = require('http-status').status;
const subtitleRepository = require('./subtitle.repository');
const lessonRepository = require('./lessons.repository');
const { checkCourseAccess } = require('../sections/sections.service');
const ApiError = require('../../core/errors/ApiError');
const logger = require('../../utils/logger');
const { getConnection, sql } = require('../../database/connection');
const { toCamelCaseObject } = require('../../utils/caseConverter');
const languageRepository = require('../languages/languages.repository');
const cloudinaryUtil = require('../../utils/cloudinary.util');

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
  
  try {
    const buffer = Buffer.from(srtContent, 'utf-8');
    const publicId = `lesson_${lessonId}_${code}_${Date.now()}.srt`;
    const uploadResult = await cloudinaryUtil.uploadStream(buffer, {
      folder: 'edutech/subtitles',
      resource_type: 'raw',
      public_id: publicId
    });

    const subtitleUrl = uploadResult.secure_url || uploadResult.url;
    
    // Kiểm tra xem đã có phụ đề ngôn ngữ này chưa
    const existingSubtitles = await subtitleRepository.findSubtitlesByLessonId(lessonId);
    const existingForLang = existingSubtitles.find(s => s.LanguageCode && s.LanguageCode.toLowerCase() === code);
    if (existingForLang) {
      await subtitleRepository.deleteSubtitleById(existingForLang.SubtitleID);
      logger.info(`🤖 [AI Subtitle] Đã thay thế phụ đề cũ ngôn ngữ '${code}' của lesson #${lessonId}`);
    }

    const dataToSave = {
      LessonID: lessonId,
      LanguageCode: code,
      LanguageName: 'Vietnamese',
      SubtitleUrl: subtitleUrl,
      IsDefault: 1,
    };

    const newSubtitle = await subtitleRepository.addSubtitle(dataToSave);
    logger.info(`✅ [AI Subtitle] Đã lưu thành công phụ đề tự động .SRT cho lesson #${lessonId} tại: ${subtitleUrl}`);
    return toCamelCaseObject(newSubtitle);
  } catch (error) {
    logger.error(`🤖 [AI Subtitle] Lỗi khi tải lên và lưu phụ đề .SRT cho lesson #${lessonId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getSubtitles,
  addSubtitle,
  setPrimarySubtitle,
  deleteSubtitle,
  saveAiGeneratedSubtitle,
};
