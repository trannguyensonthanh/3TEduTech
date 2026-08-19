const cloudinary = require('../config/cloudinary');
const logger = require('./logger');

/**
 * Tạo Signed URL cho tài nguyên video private trên Cloudinary.
 * @param {string} publicId - Public ID của video.
 * * @param {object} options - Tùy chọn bổ sung.
 * @param {number} options.expiresIn - Thời gian hết hạn của URL tính bằng giây (ví dụ: 3600 cho 1 giờ). Mặc định 1 giờ.
 * @returns {string} - Signed URL hoặc ném lỗi nếu thất bại.
 */
const generateSignedVideoUrl = (publicId, options = {}) => {
  try {
    const expiresIn = options.expiresIn || 3600;
    const expirationTimestamp = Math.floor(Date.now() / 1000) + expiresIn;

    const signedUrl = cloudinary.video(publicId, {
      resource_type: 'video',
      type: 'private',
      sign_url: true,
      expires_at: expirationTimestamp,
    });

    if (!signedUrl) {
      throw new Error('Failed to generate signed URL from Cloudinary SDK.');
    }

    logger.info(
      `Generated signed URL for ${publicId} expiring at ${new Date(expirationTimestamp * 1000)}`
    );
    return signedUrl;
  } catch (error) {
    logger.error(`Error generating signed URL for ${publicId}:`, error);
    throw new Error('Không thể tạo đường dẫn xem video.');
  }
};

/**
 * Tạo URL đã ký (signed URL) cho tài nguyên Cloudinary, đặc biệt hữu ích cho các tài nguyên private.
 * URL này phù hợp để nhúng vào thẻ <video>, <img> hoặc truy cập trực tiếp trong thời gian giới hạn.
 *
 * @param {string} publicId Public ID của tài nguyên trên Cloudinary.
 * @param {GenerateSignedUrlOptions} options Các tùy chọn để tạo URL.
 * @returns {string} Signed URL.
 * @throws {Error} Nếu thiếu API secret hoặc có lỗi trong quá trình tạo URL.
 */
const generateSignedUrl = (publicId, options = {}) => {
  const apiSecret = cloudinary.config().api_secret;
  if (!apiSecret) {
    logger.error(
      'Cloudinary API secret is missing. Cannot generate signed URL.'
    );
    throw new Error('Cloudinary configuration error: API secret is required.');
  }

  if (!publicId) {
    logger.error('Public ID is required to generate signed URL.');
    throw new Error('Public ID cannot be empty.');
  }

  const resourceType = options.resource_type || 'video';
  const deliveryType = options.type || 'private';
  const expiresIn = options.expires_in || 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  const signOptions = {
    resource_type: resourceType,
    type: deliveryType,
    expires_at: expiresAt,
    secure: true,
    sign_url: true,
    transformation: options.transformation || [
      { fetch_format: 'auto', quality: 'auto' },
      { video_codec: 'auto' },
    ],
  };

  if (resourceType === 'raw') {
    delete signOptions.transformation;
  }

  try {
    const signedUrl = cloudinary.utils.url(publicId, signOptions);

    logger.info(
      `Generated signed URL for public_id="${publicId}", resource_type="${resourceType}", type="${deliveryType}". Expires: ${new Date(expiresAt * 1000).toISOString()}`
    );
    return signedUrl;
  } catch (error) {
    logger.error(
      `Error generating signed URL for public_id="${publicId}":`,
      error
    );
    throw new Error(`Could not generate signed URL: ${error.message || error}`);
  }
};

/**
 * Upload file lên Cloudinary từ buffer.
 * @param {Buffer} buffer - Buffer của file.
 * @param {object} options - Các tùy chọn cho Cloudinary (folder, public_id, resource_type,...).
 * @returns {Promise<object>} - Kết quả từ Cloudinary (bao gồm secure_url, public_id,...).
 */
const uploadStream = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: options.resource_type || 'auto',
      folder: options.folder,
      public_id: options.public_id,
      overwrite: options.overwrite !== undefined ? options.overwrite : true,
      type: options.type || 'upload',
    };

    Object.keys(uploadOptions).forEach(
      (key) => uploadOptions[key] === undefined && delete uploadOptions[key]
    );

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          return reject(error);
        }
        if (result) {
          logger.info(`Cloudinary upload successful: ${result.public_id}`);
          resolve(result);
        } else {
          logger.error('Cloudinary upload did not return a result.');
          reject(new Error('Cloudinary upload failed without specific error.'));
        }
      }
    );
    stream.end(buffer);
  });
};

/**
 * Xóa asset khỏi Cloudinary bằng public_id.
 * Sử dụng async/await để code sạch hơn.
 *
 * @param {string} publicId - Public ID của asset cần xóa.
 * @param {DeleteAssetOptions} options - Các tùy chọn (chỉ cần resource_type).
 * @returns {Promise<object>} - Kết quả từ Cloudinary API (ví dụ: { result: 'ok' }).
 * @throws {Error} Nếu có lỗi trong quá trình xóa.
 */
const deleteAsset = async (publicId, options = {}) => {
  if (!cloudinary.config().api_secret || !cloudinary.config().api_key) {
    logger.error(
      'Cloudinary API key or secret is missing. Cannot delete asset.'
    );
    throw new Error(
      'Cloudinary configuration error: API key and secret are required.'
    );
  }
  if (!publicId) {
    logger.error('Public ID is required to delete asset.');
    throw new Error('Public ID cannot be empty.');
  }

  const resourceType = options.resource_type || 'image';
  const deliveryType = options.type || 'upload';

  try {
    logger.info(
      `Attempting to delete Cloudinary asset: public_id="${publicId}", resource_type="${resourceType}", type="${deliveryType}"`
    );

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: deliveryType,
      invalidate: true,
    });

    logger.info(
      `Cloudinary delete result for public_id="${publicId}" (${resourceType}/${deliveryType}):`,
      result
    );

    if (result?.result !== 'ok' && result?.result !== 'not found') {
      logger.warn(
        `Cloudinary delete for ${publicId} returned unexpected result:`,
        result
      );
    }

    return result;
  } catch (error) {
    logger.error(
      `Cloudinary delete error for public_id="${publicId}" (${resourceType}):`,
      error
    );
    throw new Error(
      `Failed to delete Cloudinary asset: ${error.message || error}`
    );
  }
};

/**
 * Xóa trọn gói tất cả các loại tài nguyên nằm trong một thư mục/prefix chỉ bằng 1 chuỗi lệnh siêu tốc
 * @param {string} prefix - Thư mục tiền tố, ví dụ "courses/5/" hoặc "courses/5/lessons/10/"
 */
const deleteResourcesByPrefix = async (prefix) => {
  if (!prefix || typeof prefix !== 'string') {
    logger.warn('Invalid prefix provided to deleteResourcesByPrefix.');
    return;
  }
  try {
    logger.info(`Bulk deleting all Cloudinary assets under prefix: ${prefix}`);
    
    // 1. Xóa toàn bộ Video Private (Các video bài giảng)
    await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: 'video', type: 'private', invalidate: true }).catch((err) => {
      logger.debug(`Bulk delete private video info for ${prefix}: ${err.message || err}`);
    });
    // 2. Xóa toàn bộ Video Public (Ví dụ intro video của khóa học)
    await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: 'video', type: 'upload', invalidate: true }).catch((err) => {
      logger.debug(`Bulk delete public video info for ${prefix}: ${err.message || err}`);
    });
    // 3. Xóa toàn bộ Hình ảnh (Thumbnail khóa học/bài học)
    await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: 'image', invalidate: true }).catch((err) => {
      logger.debug(`Bulk delete image info for ${prefix}: ${err.message || err}`);
    });
    // 4. Xóa toàn bộ Tài liệu thô RAW (File phụ đề .srt, file đính kèm .pdf, .zip)
    await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: 'raw', invalidate: true }).catch((err) => {
      logger.debug(`Bulk delete raw info for ${prefix}: ${err.message || err}`);
    });
    // 5. Tiêu huỷ cây thư mục trên Cloudinary sau khi đã dọn sạch tệp
    await cloudinary.api.delete_folder(prefix).catch((err) => {
      logger.debug(`Folder delete info for ${prefix}: ${err.message || err}`);
    });
    
    logger.info(`✅ Bulk delete successfully executed for prefix: ${prefix}`);
  } catch (error) {
    logger.error(`Error during bulk prefix deletion for ${prefix}:`, error);
  }
};

/**
 * Bóc tách public_id từ đường dẫn trọn vẹn URL trên Cloudinary (hữu ích cho việc xóa tệp .srt dạng raw)
 * @param {string} url - URL công khai hoặc bảo mật của file trên Cloudinary
 * @returns {string|null} - Public ID tương ứng hoặc null nếu không thể parse
 */
const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    let pathAfterUpload = url.substring(uploadIndex + 8); // Bỏ qua '/upload/'
    // Loại bỏ phần số phiên bản (versioning) như 'v1234567890/' nếu có
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
    return pathAfterUpload;
  } catch (error) {
    logger.error(`Error extracting public_id from URL ${url}:`, error);
    return null;
  }
};

/**
 * Tạo Chữ ký bảo mật (Signature) cho phép Client trực tiếp upload lên Cloudinary
 * @param {object} options - Cấu hình (folder, resource_type, type)
 * @returns {object} - Payload chứa timestamp, signature, apiKey, cloudName...
 */
const generateUploadSignature = (options = {}) => {
  const apiSecret = cloudinary.config().api_secret;
  const apiKey = cloudinary.config().api_key;
  const cloudName = cloudinary.config().cloud_name;
  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error('Cloudinary configuration missing api_key, api_secret, or cloud_name.');
  }
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    timestamp,
    folder: options.folder,
    type: options.type || 'private',
    overwrite: options.overwrite !== undefined ? options.overwrite : true,
  };
  Object.keys(paramsToSign).forEach(
    (key) => paramsToSign[key] === undefined && delete paramsToSign[key]
  );
  
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
  logger.info(`Generated direct upload signature for folder="${options.folder}", type="${options.type}"`);
  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder: options.folder,
    resourceType: options.resource_type || 'video',
    type: options.type || 'private',
  };
};

/* ============================================================================
 * [THÊM 18/08/2026 — COURSE IMPORT] TẢI TỆP TỪ ĐĨA LÊN CLOUDINARY
 * ----------------------------------------------------------------------------
 * ★ VÌ SAO KHÔNG DÙNG LẠI `uploadStream` Ở TRÊN
 *
 * `uploadStream(buffer, ...)` nhận một Buffer — nghĩa là TOÀN BỘ tệp phải nằm
 * trong RAM. Hợp lý với luồng cũ (multer memoryStorage, giảng viên chọn từng
 * video một), nhưng SAI hoàn toàn với luồng nhập ZIP:
 *
 *   • Một tệp ZIP có thể chứa hàng chục video, mỗi video tới 200MB.
 *   • Container backend chỉ có mem_limit 768m (dev) / 1024m (prod).
 *   • Nạp một video 200MB vào Buffer là chạm trần ngay. Mà OOM thì tiến trình
 *     bị hạ tức thì, KHÔNG kịp ghi một dòng log nào — nhìn từ ngoài chỉ thấy
 *     container tự khởi động lại không rõ lý do.
 *
 * `upload_large` đọc thẳng từ đường dẫn trên đĩa và cắt thành từng khối, nên
 * bộ nhớ luôn ở mức MỘT khối bất kể tệp lớn cỡ nào. Đây cũng là API BẮT BUỘC
 * của Cloudinary với tệp trên 100MB.
 * ========================================================================== */

/** Kích thước mỗi khối: đủ lớn để không tốn nhiều lượt gọi mạng, đủ nhỏ để
 *  không phình bộ nhớ. */
const UPLOAD_CHUNK_SIZE = 20 * 1024 * 1024;

/**
 * Tải một tệp TỪ ĐĨA lên Cloudinary, giữ bộ nhớ ở mức thấp.
 *
 * @param {string} filePath - Đường dẫn tuyệt đối trên máy chủ.
 * @param {object} options - folder, resource_type, type, public_id...
 * @returns {Promise<object>} Kết quả Cloudinary (public_id, secure_url, duration...)
 */
const uploadLargeFile = (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: options.resource_type || 'video',
      folder: options.folder,
      public_id: options.public_id,
      type: options.type || 'upload',
      overwrite: options.overwrite !== undefined ? options.overwrite : true,
      chunk_size: options.chunk_size || UPLOAD_CHUNK_SIZE,
    };
    Object.keys(uploadOptions).forEach(
      (key) => uploadOptions[key] === undefined && delete uploadOptions[key]
    );

    cloudinary.uploader.upload_large(
      filePath,
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload_large lỗi (${filePath}):`, error);
          return reject(error);
        }
        if (!result || !result.public_id) {
          return reject(
            new Error('Cloudinary không trả về kết quả cho tệp đã tải lên.')
          );
        }
        logger.info(`Cloudinary upload_large thành công: ${result.public_id}`);
        return resolve(result);
      }
    );
  });
};

/**
 * Cloudinary đã được cấu hình khóa chưa?
 *
 * Dùng để phân biệt "chưa cấu hình" với "cấu hình sai". Thiếu khóa là chuyện
 * BÌNH THƯỜNG trên máy dev, và khi đó việc nhập khóa học vẫn phải chạy tới
 * cùng — chỉ bỏ qua bước tải video kèm thông báo rõ ràng, chứ không đổ lỗi
 * giữa chừng rồi để lại một khóa học nửa vời.
 */
const isConfigured = () => {
  const current = cloudinary.config();
  return Boolean(current.api_key && current.api_secret && current.cloud_name);
};

module.exports = {
  uploadStream,
  uploadLargeFile,
  isConfigured,
  UPLOAD_CHUNK_SIZE,
  deleteAsset,
  generateSignedVideoUrl,
  generateSignedUrl,
  deleteResourcesByPrefix,
  extractPublicIdFromUrl,
  generateUploadSignature,
};
