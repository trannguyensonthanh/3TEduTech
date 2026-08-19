/**
 * helpers/api.js
 * ─────────────────────────────────────────────────────────
 * HTTP helper — wrapper nhỏ gọn quanh fetch để gọi API backend.
 *
 * Dùng built-in `fetch` (Node 18+) để không phụ thuộc vào việc import app
 * Express. Test suite này chạy AGAINST một server đang sống (docker hoặc
 * npm run dev).
 *
 * [SỬA 19/08/2026] `state` KHÔNG còn định nghĩa ở đây nữa — nó đã chuyển sang
 * helpers/state.js và được lưu xuống đĩa. Lý do dài dòng nằm ở đầu tệp đó,
 * tóm tắt: mỗi tệp test Jest có module registry riêng, nên state kiểu biến
 * module không bao giờ đi từ tệp 01 sang tệp 05 được.
 */

const { state } = require('./state');

const BASE = process.env.API_BASE_URL || 'http://localhost:5000/v1';
const AI_BASE = process.env.AI_BASE_URL || 'http://localhost:2111';

/**
 * Gửi HTTP request đến backend.
 * @param {'GET'|'POST'|'PATCH'|'PUT'|'DELETE'} method
 * @param {string} path   — đường dẫn tương đối, vd: '/auth/register'
 * @param {object} [opts]
 * @param {object} [opts.body]    — JSON body
 * @param {string} [opts.token]   — Bearer token
 * @param {object} [opts.query]   — query params
 * @param {object} [opts.headers] — header bổ sung
 * @param {string} [opts.baseUrl] — override base URL (vd: AI_BASE)
 * @param {number} [opts.timeoutMs] — mặc định 20s
 * @returns {Promise<{status: number, data: any, headers: Headers}>}
 */
async function api(method, path, opts = {}) {
  const base = opts.baseUrl || BASE;
  let url = `${base}${path}`;

  if (opts.query) {
    /* Bỏ các tham số undefined/null — URLSearchParams sẽ biến chúng thành
       chuỗi "undefined" và làm Joi ở backend báo lỗi 400 rất khó hiểu. */
    const clean = {};
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) clean[k] = v;
    }
    const qs = new URLSearchParams(clean).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const fetchOpts = {
    method,
    headers,
    signal: AbortSignal.timeout(opts.timeoutMs || 20000),
  };
  if (opts.body !== undefined) fetchOpts.body = JSON.stringify(opts.body);

  let res;
  try {
    res = await fetch(url, fetchOpts);
  } catch (err) {
    /* Trả về một "response giả" thay vì ném lỗi, để test nào cũng thấy được
       nguyên nhân thật (server sập / timeout) thay vì một stack trace của
       fetch không nói lên điều gì. status 0 = không tới được server. */
    return {
      status: 0,
      data: { error: `KHÔNG GỌI ĐƯỢC ${method} ${url}: ${err.message}` },
      headers: new Headers(),
    };
  }

  let data;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text();
  }

  return { status: res.status, data, headers: res.headers };
}

/**
 * Gửi multipart/form-data — dùng cho các endpoint nhận tệp (nhập ZIP, upload
 * tài liệu FAQ, upload phụ đề).
 *
 * KHÔNG tự đặt Content-Type: fetch phải tự sinh boundary, đặt tay là hỏng.
 *
 * @param {string} path
 * @param {object} opts
 * @param {string} [opts.token]
 * @param {object} [opts.fields] — các trường text
 * @param {Array<{field: string, filename: string, buffer: Buffer, type?: string}>} [opts.files]
 */
async function postForm(path, opts = {}) {
  const base = opts.baseUrl || BASE;
  const form = new FormData();

  for (const [k, v] of Object.entries(opts.fields || {})) {
    form.append(k, String(v));
  }
  for (const f of opts.files || []) {
    form.append(
      f.field,
      new Blob([f.buffer], { type: f.type || 'application/octet-stream' }),
      f.filename
    );
  }

  const headers = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers,
      body: form,
      signal: AbortSignal.timeout(opts.timeoutMs || 120000),
    });
  } catch (err) {
    return {
      status: 0,
      data: { error: `KHÔNG GỌI ĐƯỢC POST ${base}${path}: ${err.message}` },
      headers: new Headers(),
    };
  }

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text();

  return { status: res.status, data, headers: res.headers };
}

// --- Shorthand helpers ---
const get = (path, opts) => api('GET', path, opts);
const post = (path, opts) => api('POST', path, opts);
const patch = (path, opts) => api('PATCH', path, opts);
const put = (path, opts) => api('PUT', path, opts);
const del = (path, opts) => api('DELETE', path, opts);

/**
 * In gọn nội dung lỗi khi một assertion sắp thất bại.
 * Dùng làm message thứ hai của expect() để lúc đỏ còn biết vì sao.
 */
const why = (res) =>
  `status=${res.status} body=${JSON.stringify(res.data)?.slice(0, 400)}`;

/**
 * Khẳng định mã trạng thái, và khi sai thì NÓI RÕ máy chủ đã trả về gì.
 *
 * ⚠️ Đừng dùng `expect(res.status, why(res)).toBe(200)` — khác với Chai,
 * `expect` của Jest KHÔNG nhận tham số thông báo thứ hai; nó bị bỏ qua lặng
 * lẽ, và lúc đỏ bạn chỉ thấy "Expected 200, Received 500" mà không biết vì sao
 * 500. Hàm này ném lỗi kèm nguyên văn phần thân phản hồi.
 *
 * @param {{status:number,data:any}} res
 * @param {number|number[]} expected
 * @param {string} [nhan] — mô tả ngắn việc đang làm
 */
function expectStatus(res, expected, nhan) {
  const list = Array.isArray(expected) ? expected : [expected];
  if (!list.includes(res.status)) {
    throw new Error(
      `${nhan ? nhan + ' — ' : ''}mong mã ${list.join(' hoặc ')} nhưng nhận ${why(res)}`
    );
  }
}

module.exports = {
  api,
  expectStatus,
  get,
  post,
  patch,
  put,
  del,
  postForm,
  why,
  state,
  BASE,
  AI_BASE,
};
