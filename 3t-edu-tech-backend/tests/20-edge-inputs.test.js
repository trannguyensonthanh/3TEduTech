/**
 * 20-edge-inputs.test.js — Du lieu bien quet tren dien rong
 * ===========================================================================
 * [THEM 19/08/2026]
 *
 * -- TEP NAY KHONG KIEM TRA NGHIEP VU --------------------------------------
 *
 * No chi hoi MOT cau, hoi o that nhieu noi:
 *
 *     Khi dua vao du lieu quai dan, may chu co TU CHOI TU TE khong,
 *     hay no no 500 va nem stack trace ra ngoai?
 *
 * Vi sao day la thu dang dau tu nhat khi sap bao cao: 500 la ma loi duy nhat
 * noi rang "lap trinh vien chua nghi toi truong hop nay". 400/403/404 nghia la
 * he thong da luong truoc. Mot hoi dong cham bai go bua vao o tim kiem roi
 * thay stack trace la an tuong rat kho go.
 *
 * -- VI SAO KHONG DUNG THU VIEN FUZZ ---------------------------------------
 *
 * Bang duoi day la nhung chuoi DA TUNG pha vo he thong that: SQL injection,
 * XSS, path traversal, ky tu null, chuoi cuc dai, so vuot nguong 32-bit.
 * Chung ngan, doc hieu duoc, va moi cai chi ra mot lop phong ve cu the -- hon
 * han hang nghin chuoi ngau nhien khong ai biet vi sao lai do.
 *
 * -- MOT LUU Y VE CHINH TEP NAY --------------------------------------------
 *
 * Ky tu dieu khien duoc dung `String.fromCharCode()` chu KHONG dan byte that
 * vao ma nguon. Toi da thu dan truc tiep va tep khong ghi noi: byte NUL va ESC
 * di qua editor, git, terminal moi noi mot kieu. Chuoi ASCII thuan an toan hon
 * va van tao ra dung du lieu do luc chay.
 *
 * Ca tep viet khong dau co chu y, vi noi dung cua no la nhung chuoi ky tu la;
 * tron them dau tieng Viet chi lam kho viec truy nguyen khi co gi do hong.
 */

const { get, post, patch, state, why } = require('./helpers/api');
const {
  ensureAdmin,
  ensureInstructor,
  ensureStudent,
} = require('./helpers/auth');

const NUL = String.fromCharCode(0);
const ESC = String.fromCharCode(27);

let adminToken;
let gvToken;
let hvToken;

beforeAll(async () => {
  adminToken = await ensureAdmin();
  gvToken = await ensureInstructor();
  hvToken = await ensureStudent();
});

const CHUOI_DOC = [
  ['SQL injection co dien', "' OR '1'='1"],
  ['SQL injection kem DROP', "'; DROP TABLE Courses;--"],
  ['SQL comment', 'abc--'],
  ['XSS the script', '<script>alert(document.cookie)</script>'],
  ['XSS thuoc tinh', '" onmouseover="alert(1)'],
  ['Path traversal', '../../../../etc/passwd'],
  ['Path traversal kieu Windows', '..\\..\\..\\windows\\win.ini'],
  ['Ky tu NUL giua chuoi', 'abc' + NUL + 'def'],
  ['Ky tu dieu khien ANSI', ESC + '[31mDO' + ESC + '[0m'],
  ['Unicode nhieu byte', 'tieng Viet co dau an duoc khong'],
  ['Chuoi rat dai 5000 ky tu', 'A'.repeat(5000)],
  ['Chi khoang trang', '     '],
  ['Chuoi rong', ''],
  ['Mau dinh dang', '%s %d %n {{7*7}} ${7*7}'],
];

const SO_QUAI = [
  ['so am', -1],
  ['so khong', 0],
  ['vuot nguong 32-bit', 2147483648],
  ['rat lon', 99999999999999],
  ['so thap phan', 1.5],
];

/** Goi va chi quan tam: co no 500 khong, co ro stack trace khong. */
async function khongDuocNo(res, mota) {
  if (res.status >= 500) {
    throw new Error(`${mota} -> ${res.status} (LOI MAY CHU). ${why(res)}`);
  }
  const body = JSON.stringify(res.data || {});
  if (/\/app\/src\/|at Object\.|at process\.processTicks/.test(body)) {
    throw new Error(`${mota} -> RO RI STACK TRACE. ${body.slice(0, 300)}`);
  }
}

describe('TIM KIEM CONG KHAI -- chiu duoc du lieu ban', () => {
  test.each(CHUOI_DOC)('GET /courses?searchTerm -- %s', async (ten, doc) => {
    const res = await get('/courses', {
      query: { searchTerm: doc, page: 1, limit: 5 },
    });
    await khongDuocNo(res, `searchTerm ${ten}`);
    expect([200, 400]).toContain(res.status);
  });

  test('Bang Courses van con sau khi nem DROP TABLE vao', async () => {
    /* Neu injection thanh cong o phep thu tren thi loi goi nay se hong. Day la
       cach kiem chung re nhat ma van that. */
    const res = await get('/courses', { query: { page: 1, limit: 1 } });
    expect(res.status).toBe(200);
    console.log('  OK Bang Courses con nguyen -- truy van tham so hoa co tac dung');
  });
});

describe('PHAN TRANG -- tham so ngoai vung cho phep', () => {
  const truongHop = [
    ['page am', { page: -1, limit: 10 }],
    ['page = 0', { page: 0, limit: 10 }],
    ['page khong lo', { page: 999999999, limit: 10 }],
    ['limit am', { page: 1, limit: -5 }],
    ['limit = 0', { page: 1, limit: 0 }],
    ['limit vuot tran', { page: 1, limit: 100000 }],
    ['page la chu', { page: 'abc', limit: 10 }],
    ['limit la chu', { page: 1, limit: 'nhieu' }],
  ];

  test.each(truongHop)('GET /courses -- %s', async (ten, q) => {
    const res = await get('/courses', { query: q });
    await khongDuocNo(res, `phan trang ${ten}`);
    expect([200, 400]).toContain(res.status);
  });

  test('limit = 100000 KHONG duoc tra ve toan bo CSDL', async () => {
    const res = await get('/courses', { query: { page: 1, limit: 100000 } });
    if (res.status === 200) {
      const list = res.data?.courses || res.data?.results || [];
      /* Neu tran bi bo qua, mot loi goi co the keo ca bang ra va lam nghen may
         chu -- kieu tan cong re nhat ma ai cung thu duoc. */
      expect(list.length).toBeLessThanOrEqual(1000);
      console.log(`  OK limit khong lo bi siet con ${list.length} ban ghi`);
    } else {
      console.log(`  OK limit khong lo bi tu choi (${res.status})`);
    }
  });

  test('sortBy sai dinh dang -> khong duoc noi thang vao SQL', async () => {
    for (const s of [
      'CourseName; DROP TABLE Courses',
      'CourseName:asc; --',
      '1=1',
      'CreatedAt:sideways',
    ]) {
      const res = await get('/courses', { query: { sortBy: s, limit: 5 } });
      await khongDuocNo(res, `sortBy "${s}"`);
      expect([200, 400]).toContain(res.status);
    }
    console.log('  OK sortBy doc hai deu bi chan hoac bo qua an toan');
  });
});

describe('THAM SO DUONG DAN -- so quai dan', () => {
  const duongDan = [
    ['/courses/:id/versions', (v) => `/courses/${v}/versions`],
    ['/orders/:id', (v) => `/orders/${v}`],
    ['/users/:id', (v) => `/users/${v}`],
  ];

  for (const [ten, dung] of duongDan) {
    test.each(SO_QUAI)(`${ten} -- %s`, async (motaSo, so) => {
      const res = await get(dung(so), { token: adminToken });
      await khongDuocNo(res, `${ten} voi ${motaSo}`);
    });

    test(`${ten} -- chuoi chu`, async () => {
      const res = await get(dung('khong-phai-so'), { token: adminToken });
      await khongDuocNo(res, `${ten} voi chuoi chu`);
      expect([400, 404]).toContain(res.status);
    });
  }
});

describe('TAO KHOA HOC -- truong bat buoc va do dai', () => {
  test.each(CHUOI_DOC)('courseName -- %s', async (ten, doc) => {
    const res = await post('/courses', {
      token: gvToken,
      body: { courseName: doc, categoryId: state.qaCategoryId || 1, language: 'vi' },
    });
    await khongDuocNo(res, `courseName ${ten}`);
    /* Chuoi rong / chi khoang trang / 5000 ky tu deu phai bi chan o validation
       (courseName gioi han 500 ky tu). Chuoi hop le co the tao thanh cong --
       ca hai deu on, mien khong phai 500. */
    expect([200, 201, 400, 403]).toContain(res.status);
  });

  test('categoryId khong ton tai -> 400, khong phai 500', async () => {
    const res = await post('/courses', {
      token: gvToken,
      body: { courseName: 'QA test danh muc', categoryId: 999999, language: 'vi' },
    });
    await khongDuocNo(res, 'categoryId khong ton tai');
    expect(res.status).toBe(400);
  });

  test('language sai ma -> 400', async () => {
    const res = await post('/courses', {
      token: gvToken,
      body: {
        courseName: 'QA test ngon ngu',
        categoryId: state.qaCategoryId || 1,
        language: 'xyz',
      },
    });
    await khongDuocNo(res, 'language sai');
    expect(res.status).toBe(400);
  });

  test('Body rong hoan toan -> 400', async () => {
    const res = await post('/courses', { token: gvToken, body: {} });
    expect(res.status).toBe(400);
  });

  test('MASS ASSIGNMENT: body co truong la -> khong duoc ghi vao CSDL', async () => {
    const res = await post('/courses', {
      token: gvToken,
      body: {
        courseName: `QA mass assignment ${Date.now()}`,
        categoryId: state.qaCategoryId || 1,
        language: 'vi',
        statusId: 'PUBLISHED',
        isFeatured: true,
        instructorId: 1,
      },
    });
    await khongDuocNo(res, 'body co truong la');

    if (res.status === 201) {
      const c = res.data?.course || res.data;
      /* Day la lo hong "mass assignment". Neu giang vien tu dat duoc
         statusId=PUBLISHED thi ho bo qua toan bo khau kiem duyet cua admin --
         nghia la bat ky ai co tai khoan GV deu tu xuat ban duoc khoa hoc. */
      const st = String(c.statusId ?? c.StatusID ?? '').toUpperCase();
      expect(st).not.toBe('PUBLISHED');
      expect(Boolean(c.isFeatured ?? c.IsFeatured)).toBe(false);
      console.log(`  OK Truong la bi bo qua, khoa moi o trang thai ${st}`);
    } else {
      console.log(`  OK Body co truong la bi tu choi thang (${res.status})`);
    }
  });
});

describe('HO SO NGUOI DUNG -- du lieu ban', () => {
  test.each(CHUOI_DOC)('PATCH /users/me fullName -- %s', async (ten, doc) => {
    const res = await patch('/users/me', {
      token: hvToken,
      body: { fullName: doc },
    });
    await khongDuocNo(res, `fullName ${ten}`);
    expect([200, 400]).toContain(res.status);
  });

  test('Khoi phuc lai ten tu te sau khi thu', async () => {
    const res = await patch('/users/me', {
      token: hvToken,
      body: { fullName: state.studentName || 'QA Student' },
    });
    expect([200, 400]).toContain(res.status);
  });

  test('LEO THANG QUYEN: tu nang vai tro qua PATCH /users/me -> phai bi bo qua', async () => {
    await patch('/users/me', {
      token: hvToken,
      body: { role: 'SA', roleId: 'SA', status: 'ACTIVE' },
    });
    const me = await get('/users/me', { token: hvToken });
    expect(me.status).toBe(200);
    /* Neu hoc vien tu dat duoc vai tro cua minh thanh SA thi moi hang rao phan
       quyen trong he thong tro thanh vo nghia. */
    expect(me.data.role ?? me.data.roleId).toBe('NU');
    console.log('  OK Khong tu nang duoc vai tro qua ho so ca nhan');
  });
});

describe('TOKEN -- cac dang hong', () => {
  const tokenHong = [
    ['chuoi rac', 'abcxyz'],
    ['JWT thieu phan', 'aaa.bbb'],
    ['JWT sai chu ky', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.saichuky'],
    ['chi khoang trang', '   '],
    ['rat dai', 'x'.repeat(5000)],
  ];

  test.each(tokenHong)('GET /users/me voi token %s -> 401', async (ten, tk) => {
    const res = await get('/users/me', { token: tk });
    await khongDuocNo(res, `token ${ten}`);
    expect(res.status).toBe(401);
  });

  test('Header Authorization sai dinh dang -> 401', async () => {
    for (const h of ['Bearer', 'Basic abc', 'bearer  ', 'Token xyz']) {
      const res = await get('/users/me', { headers: { Authorization: h } });
      await khongDuocNo(res, `Authorization "${h}"`);
      expect(res.status).toBe(401);
    }
    console.log('  OK Moi dang header Authorization hong deu tra 401 sach se');
  });
});

describe('ENDPOINT CONG KHAI -- khong ro ri noi bo khi loi', () => {
  test('GET /v1/ (healthcheck) khong lo thong tin he thong', async () => {
    const res = await get('/');
    const body = JSON.stringify(res.data || {});
    expect(body).not.toMatch(/\/app\/src\/|at Object\./);
    expect(body).not.toMatch(/password|secret|api[_-]?key/i);
    console.log(`  OK Healthcheck sach (${res.status})`);
  });

  test('Duong dan khong ton tai -> loi sach, khong stack trace', async () => {
    for (const p of ['/khong-co-duong-nay', '/courses/../../etc/passwd']) {
      const res = await get(p);
      await khongDuocNo(res, `duong dan "${p}"`);
    }
    console.log('  OK Duong dan la deu tra loi sach');
  });
});
