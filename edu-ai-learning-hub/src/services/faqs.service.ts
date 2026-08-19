/* ============================================================================
 * faqs.service.ts
 *
 * [SỬA 18/08/2026] Hai thay đổi lớn — đọc trước khi dùng lại tệp này.
 *
 * 1) FAQ NAY CHỈ ĐỌC.
 *    Nội dung FAQ nằm trong mã nguồn backend (src/api/faqs/faqs.data.js) chứ
 *    không còn trong CSDL. `create` / `update` / `delete` đã bị GỠ khỏi tệp
 *    này: backend trả 501 cho cả ba, nên giữ lại chỉ khiến giao diện gọi một
 *    thứ chắc chắn thất bại.
 *
 * 2) `uploadPdf` ĐƯỢC THAY BẰNG CẢ MỘT NHÓM `FaqDocumentService`.
 *
 *    ★ Hàm `uploadPdf` cũ KHÔNG THỂ chạy được, vì hai lý do độc lập:
 *
 *      a. Nó gọi `apiHelper.post(path, formData, ...)`, mà `post` chạy
 *         `JSON.stringify(options)` lên tham số đó. `JSON.stringify(formData)`
 *         trả về chuỗi `"{}"` — máy chủ nhận một thân request rỗng và không
 *         bao giờ thấy tệp. Đặt `Content-Type: multipart/form-data` bằng tay
 *         còn làm hỏng thêm: thiếu tham số `boundary` mà chỉ trình duyệt mới
 *         sinh được.
 *      b. Endpoint `/faqs/upload-pdf` phía backend gọi `require('pdf-parse')`,
 *         một gói KHÔNG có trong package.json.
 *
 *    Nay dùng thẳng `fetchWithAuth` với FormData: hàm đó cố ý KHÔNG đặt
 *    Content-Type khi thân request là FormData, để trình duyệt tự sinh kèm
 *    boundary.
 * ========================================================================== */

import apiHelper, { fetchWithAuth } from './apiHelper';

const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/v1`;

export interface FAQ {
  /* ⚠️ `faqId` — chữ `d` THƯỜNG, không phải `faqID`.
     Backend trả về `FaqID` rồi chạy qua `toCamelCaseObject`, cho ra `faqId`.
     Bản cũ của tệp này khai báo `faqID`, nên `faq.faqID` luôn là `undefined` và
     cột ID trong bảng quản trị hiện ra trống trơn. TypeScript không bắt được vì
     kiểu này chỉ là lời khai của chúng ta về dữ liệu chạy tới lúc thực thi —
     không có gì đối chiếu nó với backend. */
  faqId: number;
  question: string;
  answer: string;
  category?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Một tài liệu chính sách (PDF/DOCX) đã được nạp vào tri thức chatbot. */
export interface FaqDocument {
  docId: string;
  title: string;
  category: string;
  fileName: string;
  fileExt: string;
  sizeBytes: number;
  /** Số ký tự đã bóc được — 0 nghĩa là tệp không có lớp văn bản. */
  chars: number;
  /** Đường dẫn tệp GỐC trên Cloudinary. Chỉ để xem trong trang quản trị. */
  fileUrl: string;
  publicId: string;
  /** Khóa trong ChromaDB, dạng `FAQ-DOC-<docId>`. */
  sourceName: string;
  uploadedAt: string;
  uploadedBy: number | null;
  warnings?: string[];
  meta?: Record<string, unknown>;
}

/* Mọi endpoint đều trả `{ status, data }`. Khai báo một lần ở đây để chỗ gọi
   không phải tự đoán hình dạng. */
interface Envelope<T> {
  status: string;
  data: T;
}

/* ⚠️ KHÔNG viết `apiHelper.get<FAQ[]>(...)`.
   `get` trong apiHelper KHÔNG phải hàm generic — nó khai báo
   `(path, tokenIgnored, params) => Promise<any>`. Truyền tham số kiểu vào đó là
   lỗi TypeScript ("Expected 0 type arguments"). Bản cũ của tệp này viết như vậy
   và không ai phát hiện, vì Vite dùng esbuild — esbuild XÓA kiểu chứ không hề
   kiểm tra kiểu. Lỗi chỉ nổ ra ở `npm run build` khi tsc chạy thật.
   Cách đúng: ép kiểu giá trị TRẢ VỀ. */
export const FaqService = {
  getAll: async () => (await apiHelper.get('/faqs')) as Envelope<FAQ[]>,
  getById: async (id: number) =>
    (await apiHelper.get(`/faqs/${id}`)) as Envelope<FAQ>,
};

export const FaqDocumentService = {
  list: async () =>
    (await apiHelper.get('/faqs/documents')) as Envelope<FaqDocument[]>,

  /**
   * Tải một tài liệu chính sách lên.
   *
   * Quá trình phía máy chủ: bóc text → lưu tệp gốc lên Cloudinary → nạp text
   * vào ChromaDB → ghi vào danh mục. Có thể mất vài giây với PDF nhiều trang,
   * nên giao diện cần hiện trạng thái chờ.
   */
  upload: async (file: File, meta: { title?: string; category?: string } = {}) => {
    const formData = new FormData();
    // Tên trường PHẢI là 'file' — khớp `uploadAttachment.single('file')` ở
    // faqs.routes.js. Sai tên thì multer trả 'LIMIT_UNEXPECTED_FILE'.
    formData.append('file', file);
    if (meta.title) formData.append('title', meta.title);
    if (meta.category) formData.append('category', meta.category);

    return (await fetchWithAuth(new URL(`${API_BASE_URL}/faqs/documents`), {
      method: 'POST',
      body: formData,
      // KHÔNG đặt Content-Type ở đây — xem ghi chú đầu tệp.
    })) as Envelope<FaqDocument>;
  },

  /** Nội dung text đã bóc — để XEM tại chỗ, không phải để tải về. */
  getText: async (docId: string) =>
    (await apiHelper.get(
      `/faqs/documents/${encodeURIComponent(docId)}/text`
    )) as Envelope<{ docId: string; text: string }>,

  /** Xóa khỏi cả ChromaDB, Cloudinary lẫn danh mục. */
  remove: async (docId: string) =>
    apiHelper.delete(`/faqs/documents/${encodeURIComponent(docId)}`),
};
