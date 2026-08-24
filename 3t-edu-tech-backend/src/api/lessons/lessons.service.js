const httpStatus = require('http-status').status;
const axios = require('axios');
const lessonRepository = require('./lessons.repository');
const courseRepository = require('../courses/courses.repository');
const sectionRepository = require('../sections/sections.repository');
const { checkCourseAccess } = require('../sections/sections.service');
const ApiError = require('../../core/errors/ApiError');
const LessonType = require('../../core/enums/LessonType');
const logger = require('../../utils/logger');
const { getConnection, sql } = require('../../database/connection');
const cloudinaryUtil = require('../../utils/cloudinary.util');
const lessonAttachmentRepository = require('./lessonAttachment.repository');
const subtitleRepository = require('./subtitle.repository');
const { extractYoutubeId, extractVimeoId } = require('../../utils/video.util');
const authRepository = require('../auth/auth.repository');
const enrollmentService = require('../enrollments/enrollments.service');
const Roles = require('../../core/enums/Roles');
const { youtubeApiKey } = require('../../config');
const {
  toCamelCaseObject,
  toPascalCaseObject,
} = require('../../utils/caseConverter');
const aiClient = require('../../services/aiClient');
const aiSyncService = require('../../services/aiSync.service');

const parseISO8601Duration = (duration) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

const getYoutubeVideoDuration = async (videoId) => {
  /* ========================================================================
     [SỬA 17/08/2026 — LEVEL 3] GỠ KHÓA API GOOGLE HARDCODE

     Dòng cũ:  const apiKey = 'AIzaSy...';  (khóa thật đã được gỡ khỏi mã nguồn)

     File này ĐÃ import sẵn `youtubeApiKey` từ config ở đầu file (dòng 18),
     nhưng lại khai báo một biến cục bộ trùng ý nghĩa che mất nó — nên biến môi
     trường YOUTUBE_API_KEY chưa bao giờ được dùng tới.

     Vì sao phải sửa dù đây là mã CHẠY TRÊN MÁY CHỦ (khác với hai khóa ở
     ai.service.ts vốn bị đóng gói xuống trình duyệt):
       • Khóa đã nằm trong lịch sử Git. Ai có quyền đọc repo — hoặc repo lỡ để
         public một lần — là đọc được, và xóa dòng code KHÔNG xóa được nó khỏi
         lịch sử commit.
       • Không xoay vòng được: muốn đổi khóa phải sửa mã và triển khai lại,
         thay vì chỉ đổi một biến môi trường.

     👉 VIỆC CẦN LÀM THÊM (không phải việc của code): vào Google Cloud Console
        THU HỒI khóa YouTube cũ (xem lịch sử Git) và tạo khóa mới thay thế.
     ======================================================================== */
  if (!youtubeApiKey) {
    // Không có khóa thì báo lỗi rõ ràng ngay, thay vì để Google trả về 403 với
    // thông điệp khó hiểu và giảng viên tưởng video của mình bị lỗi.
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Chưa cấu hình YOUTUBE_API_KEY nên không lấy được thời lượng video YouTube.'
    );
  }
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${youtubeApiKey}`;
  try {
    const response = await axios.get(url);
    const video = response.data.items[0];
    if (!video) {
      throw new Error('Không tìm thấy video trên YouTube.');
    }
    const durationISO = video.contentDetails.duration;
    const durationSeconds = parseISO8601Duration(durationISO);
    return durationSeconds;
  } catch (error) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Không thể lấy thông tin video từ YouTube.'
    );
  }
};

/**
 * Tạo lesson mới cho section.
 * @param {number} sectionId
 * @param {object} lessonData - Dữ liệu lesson.
 * @param {object} user - Người dùng tạo.
 * @returns {Promise<object>} - Lesson mới.
 */
const createLesson = async (sectionId, lessonData, user) => {
  const section = await sectionRepository.findSectionById(sectionId);
  if (!section) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chương không tồn tại.');
  }
  await checkCourseAccess(section.CourseID, user, 'tạo bài học');
  const { lessonType, videoSourceType, externalVideoInput, ...restData } =
    lessonData;
  let { textContent } = lessonData;
  let resolvedVideoSourceType = null;
  let resolvedExternalVideoID = null;
  let resolvedVideoDuration = null;
  if (lessonType === LessonType.VIDEO) {
    if (
      !videoSourceType ||
      (videoSourceType !== 'CLOUDINARY' && !externalVideoInput)
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Vui lòng chọn nguồn video (YouTube/Vimeo/Cloudinary) và cung cấp thông tin.'
      );
    }
    if (videoSourceType === 'YOUTUBE') {
      const videoId =
        extractYoutubeId(externalVideoInput) || externalVideoInput;
      if (!videoId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'URL YouTube không hợp lệ.');
      }
      resolvedVideoSourceType = 'YOUTUBE';
      resolvedExternalVideoID = videoId;
      resolvedVideoDuration = await getYoutubeVideoDuration(videoId);
    } else if (videoSourceType === 'VIMEO') {
      const videoId = extractVimeoId(externalVideoInput) || externalVideoInput;
      if (!videoId)
        throw new ApiError(httpStatus.BAD_REQUEST, 'URL Vimeo không hợp lệ.');
      resolvedVideoSourceType = 'VIMEO';
      resolvedExternalVideoID = videoId;
    } else if (videoSourceType === 'CLOUDINARY') {
      resolvedVideoSourceType = 'CLOUDINARY';
      resolvedExternalVideoID = null;
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Loại nguồn video không được hỗ trợ.'
      );
    }
    textContent = null;
  } else if (lessonType === LessonType.TEXT) {
    if (!textContent)
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cần cung cấp nội dung text.');
    resolvedVideoSourceType = null;
    resolvedExternalVideoID = null;
    resolvedVideoDuration = null;
  } else if (lessonType === LessonType.QUIZ) {
    resolvedVideoSourceType = null;
    resolvedExternalVideoID = null;
    resolvedVideoDuration = null;
    textContent = null;
  }
  const maxOrder = await lessonRepository.getMaxLessonOrder(sectionId);
  const newOrder = maxOrder + 1;
  const newLessonData = {
    ...restData,
    LessonName: lessonData.lessonName,
    Description: lessonData.description,
    IsFreePreview: lessonData.isFreePreview,
    SectionID: sectionId,
    LessonOrder: newOrder,
    LessonType: lessonType,
    VideoSourceType: resolvedVideoSourceType,
    ExternalVideoID: resolvedExternalVideoID,
    TextContent: textContent,
    VideoDurationSeconds: resolvedVideoDuration,
    ...(lessonType !== LessonType.VIDEO && {
      ThumbnailUrl: null,
      VideoDurationSeconds: null,
    }),
  };
  const result = await lessonRepository.createLesson(newLessonData);
  return toCamelCaseObject(result);
};

/**
 * Lấy tất cả lessons của một section.
 * @param {number} sectionId
 * @param {object} user - Người dùng (để kiểm tra quyền xem free preview).
 * @returns {Promise<object[]>}
 */
/**
 * [THÊM 19/08/2026] Che nội dung trả phí với người không có quyền.
 *
 * Trước đây hai hàm đọc bài học nhận tham số `user` nhưng không hề dùng tới,
 * nên bất kỳ ai gọi thẳng GET /v1/lessons/:id đều đọc trọn `textContent` của
 * khóa học trả phí -- đi vòng qua toàn bộ lớp kiểm soát ở tầng khóa học.
 *
 * Thứ tự cho phép: bài đánh dấu xem thử -> quản trị viên -> giảng viên sở hữu
 * -> học viên đã ghi danh. Không thuộc nhóm nào thì vẫn trả về cấu trúc bài
 * học (tên, thứ tự, loại) nhưng nội dung bị thay bằng thông báo.
 */
const redactLessonIfNotAllowed = async (lesson, user) => {
  if (!lesson) return lesson;
  if (lesson.IsFreePreview) return lesson;

  const isAdmin =
    user && (user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN);
  const isOwnerInstructor =
    user && user.role === Roles.INSTRUCTOR && lesson.InstructorID === user.id;
  if (isAdmin || isOwnerInstructor) return lesson;

  let isEnrolled = false;
  if (user && lesson.CourseID) {
    try {
      isEnrolled = await enrollmentService.isUserEnrolled(
        user.id,
        lesson.CourseID
      );
    } catch (e) {
      isEnrolled = false;
    }
  }
  if (isEnrolled) return lesson;

  return {
    ...lesson,
    TextContent: '*** Nội dung chỉ dành cho học viên đã đăng ký khóa học ***',
    ExternalVideoID: null,
    VideoSourceType: null,
  };
};

const getLessonsBySection = async (sectionId, user) => {
  const section = await sectionRepository.findSectionById(sectionId);
  if (!section) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chương không tồn tại.');
  }
  const lessons = await lessonRepository.findLessonsBySectionId(sectionId);

  const isAdmin =
    user && (user.role === Roles.ADMIN || user.role === Roles.SUPERADMIN);
  const isOwnerInstructor =
    user &&
    user.role === Roles.INSTRUCTOR &&
    section.InstructorID === user.id;

  let isEnrolled = false;
  if (user && !isAdmin && !isOwnerInstructor && section.CourseID) {
    try {
      isEnrolled = await enrollmentService.isUserEnrolled(
        user.id,
        section.CourseID
      );
    } catch (e) {
      isEnrolled = false;
    }
  }
  const canViewFull = isAdmin || isOwnerInstructor || isEnrolled;
  if (canViewFull) return lessons;

  return lessons.map((l) =>
    l.IsFreePreview
      ? l
      : {
          ...l,
          TextContent:
            '*** Nội dung chỉ dành cho học viên đã đăng ký khóa học ***',
          ExternalVideoID: null,
          VideoSourceType: null,
        }
  );
};

/**
 * Lấy chi tiết một bài học.
 * @param {number} lessonId
 * @param {object} user - Người dùng (để kiểm tra quyền xem free preview).
 * @returns {Promise<object>}
 */
const getLesson = async (lessonId, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  const safeLesson = await redactLessonIfNotAllowed(lesson, user);
  return toCamelCaseObject(safeLesson);
};

/**
 * Cập nhật lesson, xử lý chuyển đổi type, dọn dẹp dữ liệu cũ,
 * và bỏ qua thay đổi nguồn thành Cloudinary qua API này.
 * @param {number} lessonId
 * @param {object} updateBody - Dữ liệu cập nhật từ request.
 * @param {object} user - Người dùng cập nhật.
 * @returns {Promise<object>} - Lesson đã cập nhật.
 */
const updateLesson = async (lessonId, updateBody, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  await checkCourseAccess(lesson.CourseID, user, 'cập nhật bài học');
  const dataToUpdate = { ...updateBody };
  delete dataToUpdate.lessonOrder;
  const newExternalInput = dataToUpdate.externalVideoInput;
  delete dataToUpdate.externalVideoInput;
  const requestedSourceType = dataToUpdate.videoSourceType;
  delete dataToUpdate.videoSourceType;
  const newType = dataToUpdate.lessonType || lesson.LessonType;
  const oldType = lesson.LessonType;
  const typeChanged = dataToUpdate.lessonType && newType !== oldType;
  if (typeChanged) {
    logger.info(
      `Lesson ${lessonId} type changing from ${oldType} to ${newType}. Cleaning up old data.`
    );
    if (
      oldType === LessonType.VIDEO &&
      lesson.VideoSourceType === 'CLOUDINARY' &&
      lesson.ExternalVideoID
    ) {
      cloudinaryUtil
        .deleteAsset(lesson.ExternalVideoID, {
          resource_type: 'video',
          type: 'private',
        })
        .catch((err) =>
          logger.error(
            `Failed to delete old Cloudinary video ${lesson.ExternalVideoID} during type change:`,
            err
          )
        );
    }
    if (oldType === LessonType.VIDEO) {
      dataToUpdate.VideoSourceType = null;
      dataToUpdate.ExternalVideoID = null;
      dataToUpdate.VideoDurationSeconds = null;
      dataToUpdate.ThumbnailUrl = null;
    }
    if (oldType === LessonType.TEXT) {
      dataToUpdate.TextContent = null;
    }
    if (oldType === LessonType.QUIZ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Vui lòng xóa các dữ liệu quiz liên quan trước khi chuyển đổi loại bài học.'
      );
    }
  }
  if (newType === LessonType.VIDEO) {
    if (newExternalInput !== undefined) {
      if (!requestedSourceType)
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Cần cung cấp loại nguồn video (videoSourceType) khi cập nhật thông tin video.'
        );
      if (
        requestedSourceType === 'YOUTUBE' ||
        requestedSourceType === 'VIMEO'
      ) {
        const videoId =
          (requestedSourceType === 'YOUTUBE'
            ? extractYoutubeId(newExternalInput)
            : extractVimeoId(newExternalInput)) || newExternalInput;
        if (!videoId)
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `URL ${requestedSourceType} không hợp lệ.`
          );
        if (
          lesson.VideoSourceType === 'CLOUDINARY' &&
          lesson.ExternalVideoID &&
          requestedSourceType !== 'CLOUDINARY'
        ) {
          cloudinaryUtil
            .deleteAsset(lesson.ExternalVideoID, {
              resource_type: 'video',
              type: 'private',
            })
            .catch((err) =>
              logger.error(
                `Failed to delete old Cloudinary video ${lesson.ExternalVideoID} during video source update:`,
                err
              )
            );
        }
        dataToUpdate.VideoSourceType = requestedSourceType;
        dataToUpdate.ExternalVideoID = videoId;
        dataToUpdate.TextContent = null;
      } else if (requestedSourceType === 'CLOUDINARY') {
        logger.warn(
          `Attempt to change video source to CLOUDINARY via general update API for lesson ${lessonId} was ignored. Use the dedicated video upload API.`
        );
        dataToUpdate.TextContent = null;
      } else {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Loại nguồn video không được hỗ trợ.'
        );
      }
    } else {
      if (typeChanged && oldType !== LessonType.VIDEO) {
        if (!lesson.VideoSourceType && !lesson.ExternalVideoID) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Vui lòng cung cấp nguồn video (upload hoặc link ngoài) khi chuyển sang loại VIDEO.'
          );
        }
      }
      dataToUpdate.TextContent = null;
    }
  } else if (newType === LessonType.TEXT) {
    if (dataToUpdate.textContent === undefined && typeChanged) {
      dataToUpdate.TextContent = null;
    } else if (dataToUpdate.textContent === undefined && !typeChanged) {
      delete dataToUpdate.textContent;
    }
    dataToUpdate.VideoSourceType = null;
    dataToUpdate.ExternalVideoID = null;
    dataToUpdate.VideoDurationSeconds = null;
  } else if (newType === LessonType.QUIZ) {
    dataToUpdate.VideoSourceType = null;
    dataToUpdate.ExternalVideoID = null;
    dataToUpdate.VideoDurationSeconds = null;
    dataToUpdate.TextContent = null;
  }
  if (!typeChanged) {
    delete dataToUpdate.lessonType;
  }
  if (newExternalInput === undefined) {
    delete dataToUpdate.videoSourceType;
  }
  const finalSourceType =
    dataToUpdate.VideoSourceType || lesson.VideoSourceType;
  if (
    dataToUpdate.videoDurationSeconds !== undefined &&
    finalSourceType !== 'CLOUDINARY'
  ) {
    delete dataToUpdate.videoDurationSeconds;
  }
  const finalUpdateData = Object.entries(dataToUpdate).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );
  if (Object.keys(finalUpdateData).length === 0) {
    logger.warn(`Update lesson ${lessonId} called with no actual changes.`);
    return lesson;
  }
  const updatedLessonRaw = await lessonRepository.updateLessonById(
    lessonId,
    finalUpdateData
  );
  if (!updatedLessonRaw) {
    logger.error(
      `Failed to update lesson ${lessonId} in DB, repository returned null.`
    );
    const latestLesson = await lessonRepository.findLessonById(lessonId);
    return latestLesson || lesson;
  }
  return toCamelCaseObject(updatedLessonRaw);
};

/**
 * Xóa lesson.
 * @param {number} lessonId
 * @param {object} user - Người dùng xóa.
 * @returns {Promise<void>}
 */
const deleteLesson = async (lessonId, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  await checkCourseAccess(lesson.CourseID, user, 'xóa bài học');
  if (lesson.ExternalVideoID && lesson.VideoSourceType === 'CLOUDINARY') {
    try {
      await cloudinaryUtil.deleteAsset(lesson.ExternalVideoID, {
        resource_type: 'video',
        type: 'private',
      });
      logger.info(
        `Lesson video deleted from Cloudinary: ${lesson.ExternalVideoID} (during lesson delete)`
      );
    } catch (error) {
      logger.error(
        `Failed to delete lesson video ${lesson.ExternalVideoID} (during lesson delete):`,
        error
      );
    }
  }
  const attachments =
    await lessonAttachmentRepository.findAttachmentsByLessonId(lesson.LessonID);
  for (const attachment of attachments) {
    if (attachment.CloudStorageID) {
      try {
        await cloudinaryUtil.deleteAsset(attachment.CloudStorageID, {
          resource_type: 'raw',
        });
        logger.info(
          `Lesson attachment deleted from Cloudinary: ${attachment.CloudStorageID} (during lesson delete)`
        );
      } catch (error) {
        logger.error(
          `Failed to delete lesson attachment ${attachment.CloudStorageID} (during lesson delete):`,
          error
        );
      }
    }
  }
  // Dọn sạch phụ đề .srt thuộc về bài học này khỏi Cloudinary
  try {
    const subtitles = await subtitleRepository.findSubtitlesByLessonId(lesson.LessonID);
    for (const sub of subtitles) {
      if (sub.SubtitleUrl) {
        const publicId = cloudinaryUtil.extractPublicIdFromUrl(sub.SubtitleUrl);
        if (publicId) {
          await cloudinaryUtil.deleteAsset(publicId, { resource_type: 'raw' }).catch((e) => {
            logger.warn(`Failed to clean up subtitle asset ${publicId}:`, e);
          });
          logger.info(`Lesson subtitle deleted from Cloudinary: ${publicId} (during lesson delete)`);
        }
      }
    }
  } catch (subError) {
    logger.error(`Error while cleaning up subtitles during lesson delete for ${lesson.LessonID}:`, subError);
  }
  await lessonRepository.deleteLessonById(lessonId);
  logger.info(`Lesson ${lessonId} deleted from DB by user ${user.id}`);
  
  // Real-time RAG removal
  await aiSyncService.removeLessonFromAi(lesson.LessonName);
};

/**
 * Cập nhật thứ tự các lessons của một section.
 * @param {number} sectionId
 * @param {Array<{id: number, order: number}>} lessonOrders - Mảng lesson và thứ tự mới.
 * @param {object} user - Người dùng thực hiện.
 * @returns {Promise<void>}
 */
const updateLessonsOrder = async (sectionId, lessonOrders, user) => {
  const section = await sectionRepository.findSectionById(sectionId);
  if (!section) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chương không tồn tại.');
  }
  await checkCourseAccess(section.CourseID, user, 'sắp xếp bài học');
  const currentLessons =
    await lessonRepository.findLessonsBySectionId(sectionId);
  const currentLessonIds = currentLessons.map((l) => l.LessonID);
  const requestLessonIds = lessonOrders.map((l) => l.id);
  const requestOrders = lessonOrders.map((l) => l.order);
  if (
    !requestLessonIds.every((id) => currentLessonIds.includes(id)) ||
    requestLessonIds.length !== currentLessonIds.length ||
    !currentLessonIds.every((id) => requestLessonIds.includes(id))
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Danh sách bài học không hợp lệ cho chương này.'
    );
  }
  if (new Set(requestOrders).size !== requestOrders.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Thứ tự bài học không được trùng lặp.'
    );
  }
  const sortedOrders = [...requestOrders].sort((a, b) => a - b);
  if (
    sortedOrders[0] !== 0 ||
    !sortedOrders.every((order, index) => order === index)
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Thứ tự bài học phải liên tục và bắt đầu từ 0.'
    );
  }
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    await lessonRepository.updateLessonsOrder(lessonOrders, transaction);
    await transaction.commit();
    logger.info(
      `Lessons order updated for section ${sectionId} by user ${user.id}`
    );
  } catch (error) {
    logger.error(
      `Error updating lessons order for section ${sectionId}:`,
      error
    );
    await transaction.rollback();
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Cập nhật thứ tự bài học thất bại.'
    );
  }
};

/**
 * Cập nhật video cho bài học qua server buffer (legacy/multer).
 * @param {number} lessonId
 * @param {object} file - File object từ multer (req.file).
 * @param {object} user - Người dùng thực hiện.
 * @returns {Promise<object>} - Bài học với video đã cập nhật.
 */
const updateLessonVideo = async (lessonId, file, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  if (lesson.LessonType !== LessonType.VIDEO) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Bài học này không phải loại VIDEO.'
    );
  }
  await checkCourseAccess(lesson.CourseID, user, 'cập nhật video bài học');
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vui lòng chọn file video.');
  }
  if (lesson.VideoSourceType === 'CLOUDINARY' && lesson.ExternalVideoID) {
    try {
      await cloudinaryUtil.deleteAsset(lesson.ExternalVideoID, {
        resource_type: 'video',
        type: 'private',
      });
      logger.info(`Old Cloudinary video deleted: ${lesson.ExternalVideoID}`);
    } catch (deleteError) {
      logger.error(
        `Failed to delete old video ${lesson.ExternalVideoID}:`,
        deleteError
      );
    }
  }
  const uploadResult = await cloudinaryUtil.uploadStream(file.buffer, {
    folder: `courses/${lesson.CourseID}/lessons/${lessonId}/videos_private`,
    resource_type: 'video',
    type: 'private',
  });
  const updateData = {
    VideoSourceType: 'CLOUDINARY',
    ExternalVideoID: uploadResult.public_id,
    VideoDurationSeconds: Math.round(uploadResult.duration || 0),
    TextContent: null,
  };
  const updatedLesson = await lessonRepository.updateLessonById(
    lessonId,
    updateData
  );
  if (!updatedLesson) {
    logger.error(
      `Failed to update lesson ${lessonId} in DB after video upload. Uploaded public_id: ${uploadResult.public_id}`
    );
    try {
      await cloudinaryUtil.deleteAsset(uploadResult.public_id, {
        resource_type: 'video',
        type: 'private',
      });
      logger.warn(
        `Rolled back Cloudinary upload due to DB update failure: ${uploadResult.public_id}`
      );
    } catch (rollbackError) {
      logger.error(
        `Failed to rollback Cloudinary upload ${uploadResult.public_id}:`,
        rollbackError
      );
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Lỗi khi cập nhật database, đã rollback upload.'
    );
  }

  // [ON-DEMAND AI SUBTITLE]: Không tự động kích hoạt AI dịch video sang srt để tiết kiệm tài nguyên máy chủ.
  // Giảng viên có quyền chủ động ấn nút "Tạo phụ đề bằng AI" trên giao diện nếu thực sự mong muốn.
  logger.info(`✨ [On-Demand Policy] Đã tải video thành công cho bài học ${lessonId}. Việc tự động tạo phụ đề AI được bỏ qua theo chế độ On-Demand.`);

  return toCamelCaseObject(updatedLesson);
};

/**
 * Cấp chữ ký bảo mật (token) để Client trực tiếp upload video lên Cloudinary (Không qua RAM máy chủ)
 * @param {number} lessonId
 * @param {object} user - Giảng viên thực hiện
 */
const generateVideoUploadToken = async (lessonId, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  if (lesson.LessonType !== LessonType.VIDEO) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Bài học này không phải loại VIDEO.');
  }
  await checkCourseAccess(lesson.CourseID, user, 'tải video bài học');
  const folder = `courses/${lesson.CourseID}/lessons/${lessonId}/videos_private`;
  const tokenData = cloudinaryUtil.generateUploadSignature({
    folder,
    resource_type: 'video',
    type: 'private',
    overwrite: true,
  });
  return tokenData;
};

/**
 * Xác nhận sau khi Client đã upload trực tiếp thành công video lên Cloudinary
 * @param {number} lessonId
 * @param {object} body - { publicId, duration }
 * @param {object} user - Giảng viên thực hiện
 */
const confirmLessonVideoUpload = async (lessonId, body, user) => {
  const { publicId, duration } = body;
  if (!publicId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Thiếu thông tin publicId từ Cloudinary.');
  }
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  await checkCourseAccess(lesson.CourseID, user, 'xác nhận video bài học');

  // Nếu đã có video cũ, tiêu hủy trên Cloudinary với chế độ type: private
  if (lesson.VideoSourceType === 'CLOUDINARY' && lesson.ExternalVideoID && lesson.ExternalVideoID !== publicId) {
    try {
      await cloudinaryUtil.deleteAsset(lesson.ExternalVideoID, {
        resource_type: 'video',
        type: 'private',
      });
      logger.info(`Old Cloudinary private video deleted during confirm: ${lesson.ExternalVideoID}`);
    } catch (deleteError) {
      logger.error(`Failed to delete old video ${lesson.ExternalVideoID}:`, deleteError);
    }
  }

  const updateData = {
    VideoSourceType: 'CLOUDINARY',
    ExternalVideoID: publicId,
    VideoDurationSeconds: Math.round(Number(duration) || 0),
    TextContent: null,
  };
  const updatedLesson = await lessonRepository.updateLessonById(lessonId, updateData);
  if (!updatedLesson) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Lỗi cập nhật database sau khi upload video.');
  }

  // [ON-DEMAND AI SUBTITLE]: Bỏ qua tự động gọi AI trong luồng Direct Upload để tối ưu hóa hiệu năng máy chủ.
  logger.info(`✨ [On-Demand Policy] Xác nhận Direct Upload video cho bài học ${lessonId} thành công. Chờ Giảng viên bấm nút tạo SRT nếu cần.`);

  return toCamelCaseObject(updatedLesson);
};

/**
 * Thêm file đính kèm cho bài học.
 * @param {number} lessonId
 * @param {object} file - File object từ multer (req.file).
 * @param {object} user - Người dùng thực hiện.
 * @returns {Promise<object>} - File đính kèm đã tạo.
 */
const addLessonAttachment = async (lessonId, file, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  await checkCourseAccess(lesson.CourseID, user, 'thêm file đính kèm');
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Vui lòng chọn file đính kèm.');
  }
  let uploadResult;
  try {
    const options = {
      folder: `courses/${lesson.CourseID}/lessons/${lessonId}/attachments`,
      resource_type: 'raw',
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };
    uploadResult = await cloudinaryUtil.uploadStream(file.buffer, options);
  } catch (uploadError) {
    if (uploadError.http_code === 409) {
      const decodedName = Buffer.from(file.originalname || '', 'latin1').toString('utf8');
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `File với tên '${decodedName}' đã tồn tại.`
      );
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Upload file đính kèm thất bại.'
    );
  }
  const decodedName = Buffer.from(file.originalname || '', 'latin1').toString('utf8');
  const attachmentData = {
    LessonID: lessonId,
    FileName: decodedName,
    FileURL: uploadResult.secure_url,
    FileType: file.mimetype,
    FileSize: file.size,
    CloudStorageID: uploadResult.public_id,
  };
  const newAttachment =
    await lessonAttachmentRepository.createAttachment(attachmentData);
  return toCamelCaseObject(newAttachment);
};

/**
 * Xóa file đính kèm.
 * @param {number} lessonId - (Optional, để kiểm tra lesson tồn tại).
 * @param {number} attachmentId
 * @param {object} user - Người dùng thực hiện.
 * @returns {Promise<void>}
 */
const deleteLessonAttachment = async (lessonId, attachmentId, user) => {
  const attachment =
    await lessonAttachmentRepository.findAttachmentById(attachmentId);
  if (!attachment || attachment.LessonID !== lessonId) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'File đính kèm không tồn tại hoặc không thuộc bài học này.'
    );
  }
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    logger.error(
      `Lesson ${lessonId} not found while deleting attachment ${attachmentId}.`
    );
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Bài học chứa file đính kèm không tồn tại.'
    );
  }
  await checkCourseAccess(lesson.CourseID, user, 'xóa file đính kèm');
  if (attachment.CloudStorageID) {
    try {
      await cloudinaryUtil.deleteAsset(attachment.CloudStorageID, {
        resource_type: 'raw',
      });
      logger.info(
        `Attachment deleted from Cloudinary: ${attachment.CloudStorageID}`
      );
    } catch (deleteError) {
      logger.error(
        `Failed to delete attachment ${attachment.CloudStorageID} from Cloudinary:`,
        deleteError
      );
    }
  } else {
    logger.warn(
      `Attachment ${attachmentId} has no CloudStorageID. Cannot delete from Cloudinary.`
    );
  }
  await lessonAttachmentRepository.deleteAttachmentById(attachmentId);
  logger.info(`Attachment ${attachmentId} deleted from DB by user ${user.id}`);
};

/**
 * Lấy Signed URL để xem video private của bài học.
 * @param {number} accountId - ID người dùng yêu cầu.
 * @param {number} lessonId - ID bài học.
 * @returns {Promise<{ signedUrl: string }>} - Object chứa URL có chữ ký.
 */
const getLessonVideoUrl = async (accountId, lessonId) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bài học không tồn tại.');
  }
  if (lesson.LessonType !== LessonType.VIDEO) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Bài học này không chứa video.');
  }
  if (
    lesson.VideoSourceType === 'YOUTUBE' ||
    lesson.VideoSourceType === 'VIMEO'
  ) {
    if (lesson.VideoSourceType === 'YOUTUBE') {
      return {
        publicEmbedUrl: `https://www.youtube.com/embed/${lesson.ExternalVideoID}`,
      };
    }
    return {
      publicEmbedUrl: `https://player.vimeo.com/video/${lesson.ExternalVideoID}`,
    };
  }
  if (lesson.IsFreePreview && lesson.VideoSourceType === 'EXTERNAL_URL') {
    return { publicUrl: lesson.ExternalVideoID };
  }
  if (lesson.VideoSourceType !== 'CLOUDINARY') {
    if (!lesson.IsFreePreview) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Không tìm thấy video Cloudinary cho bài học này.'
      );
    }
  }
  const publicId = lesson.ExternalVideoID;
  if (!publicId) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Không tìm thấy thông tin video Cloudinary.'
    );
  }
  let canAccessPrivateVideo = lesson.IsFreePreview;
  if (!canAccessPrivateVideo) {
    const user = await authRepository.findAccountById(accountId);
    if (!user)
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Người dùng không hợp lệ.');
    const isAdmin =
      user.RoleID === Roles.ADMIN || user.RoleID === Roles.SUPERADMIN;
    const isOwnerInstructor =
      user.RoleID === Roles.INSTRUCTOR &&
      lesson.InstructorID === user.AccountID;
    let isEnrolled = false;
    if (!isAdmin && !isOwnerInstructor) {
      isEnrolled = await enrollmentService.isUserEnrolled(
        accountId,
        lesson.CourseID
      );
    }
    canAccessPrivateVideo = isAdmin || isOwnerInstructor || isEnrolled;
  }
  if (!canAccessPrivateVideo) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Bạn không có quyền xem video này.'
    );
  }
  try {
    const signedUrl = cloudinaryUtil.generateSignedUrl(publicId, {
      resource_type: 'video',
      type: 'private',
      expires_in: 3600,
      sign_url: true,
    });
    return {
      signedUrl,
    };
  } catch (error) {
    logger.error(
      `Failed to generate signed URL for lesson ${lessonId}, publicId ${lesson.VideoPublicId}:`,
      error
    );
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Không thể tạo đường dẫn xem video.'
    );
  }
};

/**
 * Sinh câu hỏi trắc nghiệm bằng AI cho một bài học
 */
const generateLessonQuiz = async (lessonId, questionsPerLesson = 3, difficulty = 'mixed', user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy bài học.');
  }

  await checkCourseAccess(lesson.CourseID, user, 'tạo câu hỏi bằng AI');

  // Kiểm tra textContent
  if (!lesson.TextContent || lesson.TextContent.trim() === '') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Bài học này không có nội dung văn bản. Tính năng sinh câu hỏi AI yêu cầu nội dung văn bản để phân tích.'
    );
  }

  const course = await courseRepository.findCourseById(lesson.CourseID);

  const payloadLessons = [{
    key: `l${lesson.LessonID}`,
    name: lesson.LessonName || 'Bài học',
    excerpt: lesson.TextContent.slice(0, 8000) // ai-service quiz route excerpt limit is 8000, max used is 1200
  }];

  let aiResponse;
  try {
    aiResponse = await aiClient.post(
      '/api/generate/quiz',
      {
        course_name: course.CourseName || 'Khóa học',
        lessons: payloadLessons,
        questions_per_lesson: questionsPerLesson,
        difficulty: difficulty
      },
      180000 // 3 phút timeout
    );
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 503) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        detail || 'AI hiện không hoạt động. Bạn vẫn có thể tự soạn câu hỏi.'
      );
    }
    if (status === 422) {
        throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, detail || 'AI không tạo được câu hỏi từ nội dung này.');
    }
    logger.error('Lỗi khi gọi ai-service generateLessonQuiz:', error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Không thể sinh câu hỏi lúc này.');
  }

  const generatedLessons = aiResponse.data?.lessons || [];
  if (generatedLessons.length === 0) {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'AI không thể tạo câu hỏi nào đạt yêu cầu từ nội dung bài học này.');
  }

  const questions = generatedLessons[0].questions || [];
  if (questions.length === 0) {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'AI không thể tạo câu hỏi nào đạt yêu cầu từ nội dung bài học này.');
  }

  // Lưu các câu hỏi vào Database
  const savedQuestions = [];
  for (const q of questions) {
    const newQuestion = await quizRepository.createQuestion({
      LessonID: lessonId,
      QuestionText: q.question,
      Explanation: q.explanation || null
    });

    const optionsData = q.options.map((opt, idx) => ({
      QuestionID: newQuestion.QuestionID,
      OptionText: opt,
      IsCorrectAnswer: idx === q.correct_index ? true : false,
      OrderIndex: idx
    }));

    await quizRepository.createOptions(optionsData);
    savedQuestions.push(newQuestion);
  }
  
  return {
    message: `Đã tạo thành công ${savedQuestions.length} câu hỏi.`,
    totalQuestions: savedQuestions.length,
    warnings: aiResponse.data?.warnings || []
  };
};

module.exports = {
  createLesson,
  getLessonsBySection,
  getLesson,
  updateLesson,
  deleteLesson,
  updateLessonsOrder,
  updateLessonVideo,
  generateVideoUploadToken,
  confirmLessonVideoUpload,
  addLessonAttachment,
  deleteLessonAttachment,
  getLessonVideoUrl,
  generateLessonQuiz,
};
