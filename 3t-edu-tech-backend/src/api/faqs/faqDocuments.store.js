/* ============================================================================
 * faqDocuments.store.js
 * [THÊM 18/08/2026]
 *
 * Danh mục tài liệu chính sách FAQ, lưu trong MỘT tệp JSON trên đĩa.
 *
 * ----------------------------------------------------------------------------
 * ★ VÌ SAO LÀ JSON CHỨ KHÔNG PHẢI BẢNG CSDL
 *
 * Ở bản phân tích trước tôi đã đề xuất hai bảng (`FaqDocuments` và
 * `FaqDocumentChunks`) và LẬP LUẬN ĐỂ GIỮ CHÚNG LÀ SAI. Tôi viết rằng không có
 * cách nào xóa vector mồ côi trong ChromaDB nên phải lưu lại từng VectorID.
 * Thực tế ChromaDB xóa được theo bộ lọc metadata, và dự án ĐÃ CÓ SẴN endpoint
 * làm đúng việc đó từ trước khi tôi viết bản phân tích:
 *
 *     DELETE /api/ingest/collection/{c}/source/{name}
 *          → collection.delete(where={"source": name})
 *
 * Chỉ cần đặt `source_name = "FAQ-DOC-<id>"` lúc nạp là xóa được sạch. Bảng
 * chunk hoàn toàn thừa.
 *
 * Còn lại là siêu dữ liệu của vài chục tệp: tên, đường dẫn Cloudinary, thời
 * điểm tải lên. Một tệp JSON đọc/ghi trọn vẹn là đủ, và đổi lại không phải nuôi
 * migration, repository, lẫn một bảng nữa trong sơ đồ vốn đã 44 bảng.
 *
 * ----------------------------------------------------------------------------
 * ★ GIỚI HẠN ĐÃ BIẾT — ĐỌC TRƯỚC KHI MỞ RỘNG
 *
 *   1. Ghi lại TOÀN BỘ tệp mỗi lần thay đổi. Chấp nhận được ở quy mô vài chục
 *      bản ghi (FAQ_DOC_MAX_COUNT mặc định 50), KHÔNG chấp nhận được ở quy mô
 *      hàng nghìn. Cần hơn thế thì đã đến lúc dùng bảng thật.
 *
 *   2. An toàn với nhiều luồng TRONG MỘT TIẾN TRÌNH (nhờ hàng đợi bên dưới),
 *      nhưng KHÔNG an toàn với nhiều tiến trình. Backend hiện chạy một tiến
 *      trình Node duy nhất. Nếu sau này bật cluster hoặc chạy nhiều bản sao
 *      backend cùng lúc, hai tiến trình có thể ghi đè lẫn nhau và mất bản ghi.
 *      ⚠️ Đây là điều PHẢI kiểm tra lại trước khi mở rộng theo chiều ngang.
 * ========================================================================== */

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const config = require('../../config');
const logger = require('../../utils/logger');

const MANIFEST_NAME = 'manifest.json';
const manifestPath = () => path.join(config.faqDocs.dir, MANIFEST_NAME);

/* ---------------------------------------------------------------------------
 * Hàng đợi ghi — nối tiếp mọi thao tác thay đổi.
 *
 * Không có nó, hai request tải lên gần nhau sẽ cùng đọc manifest (cùng thấy N
 * bản ghi), cùng thêm một bản ghi, rồi cùng ghi đè — kết quả là N+1 thay vì
 * N+2, MẤT một tài liệu vừa tải lên thành công. Đây là lỗi read-modify-write
 * kinh điển, và nó chỉ xuất hiện khi có hai người dùng thao tác cùng lúc, nên
 * gần như không bao giờ lộ ra lúc thử tay.
 *
 * Cách làm: mọi thao tác ghi nối vào một chuỗi Promise duy nhất.
 * ------------------------------------------------------------------------- */
let writeChain = Promise.resolve();

const serialize = (fn) => {
  // `.then(fn, fn)` chứ không phải `.then(fn)`: nếu thao tác TRƯỚC đó ném lỗi
  // mà chỉ nối vào nhánh thành công, cả hàng đợi sẽ đứng lại vĩnh viễn và mọi
  // lần tải lên sau đó đều treo. Một lỗi không được phép làm hỏng hàng đợi.
  const result = writeChain.then(fn, fn);
  // Nuốt lỗi ở BẢN SAO dùng làm mắt xích tiếp theo, nhưng vẫn trả `result` thật
  // cho người gọi để họ bắt được lỗi của chính thao tác mình.
  writeChain = result.catch(() => {});
  return result;
};

const ensureDir = async () => {
  await fs.mkdir(config.faqDocs.dir, { recursive: true });
};

/** Đọc manifest. Thiếu tệp hoặc tệp hỏng đều trả về danh sách rỗng. */
const readAll = async () => {
  try {
    const raw = await fs.readFile(manifestPath(), 'utf8');
    const parsed = JSON.parse(raw);
    // Chấp nhận cả mảng trần lẫn { documents: [...] } để nếu về sau thêm trường
    // ở cấp cao nhất thì bản cũ vẫn đọc được.
    const list = Array.isArray(parsed) ? parsed : parsed?.documents;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    if (error.code === 'ENOENT') return []; // Chưa ai tải tài liệu nào — bình thường.

    /* JSON hỏng: KHÔNG ném lỗi ra ngoài, vì như vậy cả trang quản lý FAQ sẽ
       trả 500 và quản trị viên không làm được gì. Trả danh sách rỗng và ghi log
       to — tệp gốc vẫn nằm nguyên trên Cloudinary, không mất dữ liệu thật. */
    logger.error(
      `[FAQ Docs] Không đọc được ${manifestPath()}: ${error.message}. ` +
        'Coi như danh mục rỗng. Tệp gốc trên Cloudinary KHÔNG bị ảnh hưởng.'
    );
    return [];
  }
};

/**
 * Ghi manifest theo kiểu NGUYÊN TỬ: ghi ra tệp tạm rồi đổi tên đè lên.
 *
 * `rename` trong cùng một hệ tệp là thao tác nguyên tử ở mức hệ điều hành. Ghi
 * thẳng vào manifest.json thì nếu tiến trình bị giết giữa chừng (OOM kill trên
 * EC2 4GB là chuyện có thật), tệp còn lại là JSON cụt — và toàn bộ danh mục
 * tài liệu biến mất ở lần đọc sau.
 */
const writeAll = async (documents) => {
  await ensureDir();
  const target = manifestPath();
  const tmp = `${target}.${process.pid}.tmp`;
  const payload = JSON.stringify({ version: 1, documents }, null, 2);

  await fs.writeFile(tmp, payload, 'utf8');
  try {
    await fs.rename(tmp, target);
  } catch (error) {
    await fs.unlink(tmp).catch(() => {});
    throw error;
  }
};

/** Sinh id ổn định, dùng luôn làm `source_name` trong ChromaDB. */
const newId = () => crypto.randomBytes(8).toString('hex');

/**
 * Thêm một bản ghi.
 * @returns {Promise<object>} bản ghi đã lưu
 */
const add = (doc) =>
  serialize(async () => {
    const documents = await readAll();

    if (documents.length >= config.faqDocs.maxCount) {
      const err = new Error(
        `Đã đạt giới hạn ${config.faqDocs.maxCount} tài liệu chính sách. ` +
          'Hãy xóa bớt tài liệu cũ trước khi tải thêm.'
      );
      err.statusCode = 409;
      throw err;
    }

    documents.push(doc);
    await writeAll(documents);
    return doc;
  });

/** Xóa theo id. Trả về bản ghi đã xóa, hoặc null nếu không có. */
const remove = (docId) =>
  serialize(async () => {
    const documents = await readAll();
    const idx = documents.findIndex((d) => d.docId === docId);
    if (idx === -1) return null;

    const [removed] = documents.splice(idx, 1);
    await writeAll(documents);
    return removed;
  });

/** Cập nhật một phần bản ghi. Trả về bản ghi mới, hoặc null nếu không có. */
const patch = (docId, changes) =>
  serialize(async () => {
    const documents = await readAll();
    const idx = documents.findIndex((d) => d.docId === docId);
    if (idx === -1) return null;

    documents[idx] = { ...documents[idx], ...changes, docId };
    await writeAll(documents);
    return documents[idx];
  });

const getById = async (docId) => {
  const documents = await readAll();
  return documents.find((d) => d.docId === docId) || null;
};

/** Mới nhất lên đầu — đúng thứ tự quản trị viên muốn thấy. */
const list = async () => {
  const documents = await readAll();
  return [...documents].sort((a, b) =>
    String(b.uploadedAt || '').localeCompare(String(a.uploadedAt || ''))
  );
};

module.exports = {
  MANIFEST_NAME,
  manifestPath,
  newId,
  readAll,
  list,
  getById,
  add,
  patch,
  remove,
};
