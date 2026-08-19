# Phân tích: bỏ bớt bảng FAQ & kế hoạch triển khai AI Service không cần vCPU

18/08/2026

---

## Phần 0 — Tôi đã lập luận sai một chỗ, nói trước cho rõ

Khi bảo vệ bảng `FaqDocumentChunks`, tôi viết:

> "Xóa một tệp chính sách mà không biết nó đã sinh ra những vector nào thì các
> vector đó nằm lại trong ChromaDB vĩnh viễn... Không có cách nào tìm ra để xóa,
> vì ChromaDB chỉ biết id chứ không biết id đó thuộc tài liệu nào."

**Câu đó sai.** ChromaDB xóa được theo bộ lọc metadata, và dự án của bạn **đã có
sẵn** endpoint làm đúng việc đó từ trước:

```python
# ai-service/src/api/routes/ingest.py:154
@router.delete("/collection/{collection_name}/source/{source_name}")
async def delete_by_source_endpoint(...):
    collection.delete(where={"source": source_name})
```

Nghĩa là chỉ cần đặt `source_name = "FAQ-DOC-3"` lúc nạp, rồi gọi đúng endpoint
đó lúc xóa. Không cần lưu `VectorID`, không cần bảng chunks. Lý do chính đáng
duy nhất mà tôi đưa ra cho bảng đó đã tự sụp đổ.

Bạn hỏi đúng câu cần hỏi. Phần còn lại của tài liệu này đi theo hướng bạn đề ra.

---

## Phần 1 — Ba đề xuất của bạn, đánh giá từng cái

### 1.1. Code cứng FAQ thay vì tạo bảng — ĐỒNG Ý

FAQ chính sách thay đổi vài tháng một lần. Đánh đổi thật sự là:

| Có bảng | Code cứng |
|---------|-----------|
| Sửa FAQ không cần deploy | Sửa FAQ phải deploy lại |
| Thêm 1 bảng + CRUD + trang quản trị | Thêm 1 tệp hằng số |
| Có lịch sử sửa đổi | Lịch sử nằm ở Git — thực ra **tốt hơn** |

Với đồ án, vế phải thắng rõ. Và có một điểm cộng ít ai để ý: để trong Git thì
mọi thay đổi chính sách đều có commit, có tác giả, có thời điểm — thứ mà một
bảng CSDL không có sẵn trừ khi bạn tự dựng bảng lịch sử.

### 1.2. Lưu PDF ngoài CSDL — ĐỒNG Ý, nhưng làm rõ một hiểu lầm

Tôi **chưa bao giờ** đề xuất nhét tệp PDF vào CSDL. Bảng `FaqDocuments` chỉ lưu
*siêu dữ liệu* (tiêu đề, URL, trạng thái). Tệp vẫn nằm ngoài.

Nhưng đúng là siêu dữ liệu đó không đáng một bảng riêng. Vấn đề còn lại chỉ là:
để tệp ở đâu?

| Nơi lưu | Ưu | Nhược |
|---------|-----|-------|
| **Cloudinary** | Đã cấu hình sẵn, đã dùng cho tệp đính kèm bài học. Sống sót qua mọi lần deploy. Truy cập được từ bất kỳ host nào. | Phụ thuộc dịch vụ ngoài |
| Ổ cứng container | Không phụ thuộc ai | **Mất sạch mỗi lần deploy lại** nếu không gắn volume. Không chia sẻ được giữa hai host |

**Khuyến nghị: Cloudinary.** Không phải vì nó "xịn" hơn, mà vì bạn đã cấu hình
xong rồi — dùng ổ cứng nghĩa là phải thêm volume, thêm sao lưu, và tự chuốc lấy
rủi ro "deploy lại là mất hết tài liệu chính sách".

> ⚠️ Về ý "chỉ cho xem, không cho tải": trên web **không có cách nào** thật sự
> ngăn tải về thứ đang hiển thị cho người dùng. Trình duyệt phải nhận được tệp
> mới vẽ ra được. Che nút tải chỉ làm khó người dùng thường; ai mở DevTools là
> lấy được. Nếu tài liệu thật sự nhạy cảm thì đừng đưa lên web.

### 1.3. Chunk để trong ChromaDB thay vì CSDL — ĐỒNG Ý, và bạn đúng hơn tôi

Đã giải thích ở Phần 0. Nhưng có một thứ **nên** giữ lại ngoài ChromaDB, và
không phải chunk:

**Phần text đã bóc ra từ PDF.**

Lý do rất cụ thể, liên quan trực tiếp tới kế hoạch triển khai của bạn ở Phần 2:
nếu host chạy AI Service là loại ổ đĩa tạm (Render free, Fly không volume), thì
`./data/chroma_db` **bị xóa sạch mỗi lần deploy lại**. Lúc đó phải nạp lại RAG.

- Nếu chỉ có PDF: mỗi lần khởi động phải tải PDF về, bóc lại text (tốn CPU), rồi
  mới cắt đoạn và nhúng vector.
- Nếu có sẵn text đã bóc: bỏ qua bước nặng nhất, chỉ cắt đoạn và nhúng.

Text đó để trong một tệp JSON cạnh siêu dữ liệu là đủ. Không cần bảng.

---

## Phần 2 — Thiết kế cuối cùng: KHÔNG THÊM BẢNG NÀO

```
┌─────────────────────────────────────────────────────────────────┐
│  FAQ hỏi–đáp                                                    │
│  → src/api/faqs/faqs.data.js   (hằng số trong mã nguồn)         │
│    Sửa ở đây, commit, deploy. Lịch sử nằm trong Git.            │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  Tệp PDF chính sách                                             │
│  → Cloudinary  (resource_type: 'raw')                           │
│    Tệp gốc, không đụng tới.                                     │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  Siêu dữ liệu + text đã bóc                                     │
│  → data/faq-documents.json  (named volume)                      │
│    [{ id, title, fileUrl, publicId, uploadedAt, chars, text }]  │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  Vector cho RAG                                                 │
│  → ChromaDB, collection master_knowledge                        │
│    source_name = "FAQ-DOC-<id>"  → xóa bằng delete-by-source    │
└─────────────────────────────────────────────────────────────────┘
```

**Số bảng CSDL thêm vào: 0.**

Đánh đổi phải nói thẳng: tệp JSON không có transaction. Hai quản trị viên tải
tài liệu lên **cùng một giây** có thể ghi đè nhau. Với một hệ thống có đúng vài
quản trị viên và vài chục tệp chính sách, rủi ro này gần như bằng không — và cách
ghi an toàn (ghi ra tệp tạm rồi đổi tên) làm nó nhỏ hơn nữa. Nếu sau này có hàng
trăm tài liệu và nhiều người sửa đồng thời, lúc đó mới cần bảng.

---

## Phần 3 — Kế hoạch AWS của bạn: đánh giá

> "AWS không cấp vCPU mặc định, phải xin. Tôi có RDS + EC2 CPU cho web rồi. Định
> để AI Service chỉ dùng Gemini (bỏ Qwen + Whisper) trên một server không yêu
> cầu vCPU sẵn. Xin được quota rồi thì chuyển sang server xịn có Qwen + Whisper."

### Ý tưởng đúng. Nhưng bước "server thứ hai" là thừa.

Đây là điểm quan trọng nhất của cả tài liệu.

**Khi đã bỏ Qwen và Whisper, AI Service không còn nặng nữa.** Nó chỉ còn làm ba
việc: gọi HTTP tới Gemini, giữ ChromaDB, và bóc PDF/DOCX. Không mô hình nào được
nạp vào RAM. Nó nhẹ ngang một dịch vụ Node bình thường.

Nghĩa là **cứ để nó chạy chung trên CPU EC2 đang có**. So sánh:

| | Chung CPU EC2 | Host thứ hai |
|---|---|---|
| Cần xin quota vCPU | Không | Không |
| Khóa nội bộ đi qua Internet công cộng | **Không** — chỉ trong mạng Docker | **Có** — phải có HTTPS, nếu không khóa bị lộ |
| Độ trễ mỗi lượt gọi | ~1ms | 50–200ms |
| Số nơi phải deploy | 1 | 2 |
| Ngủ đông khi rảnh (free tier) | Không | Có — request đầu tiên hay quá hạn chờ |

Ước tính RAM trên t3.medium (4GB):

```
backend      1024m (trần)  → thực tế ~200MB
redis         512m         → ~30MB
frontend      256m         → ~20MB (nginx phục vụ tệp tĩnh)
ai-service    ~700MB       → chromadb + fastapi, KHÔNG có whisper
────────────────────────────────────────────
tổng thực tế ~1GB, còn dư ~3GB
```

Vừa thoải mái. Bạn **không cần host thứ hai chút nào**.

### Việc phải làm để AI Service nhẹ đi

Hiện `pyproject.toml` cài `faster-whisper` + `static-ffmpeg` + `av`. Trong log
build của bạn thấy rõ: `av (33.9MiB)`, `onnxruntime (17.8MiB)`, tổng **131 gói**.

Tách chúng thành nhóm tùy chọn `whisper`, giống nhóm `gpu` đã có sẵn:

```toml
[project.optional-dependencies]
whisper = ["faster-whisper>=1.0.3", "static-ffmpeg>=2.7"]
gpu = ["nvidia-cublas-cu12>=12.1.3.1", "nvidia-cudnn-cu12>=9.1.0.70"]
```

Bản Gemini-only build không kèm `--extra whisper`. Bỏ được `av`, `ctranslate2`,
`tokenizers`, `huggingface-hub` — ước chừng **400–600MB** nhẹ hơn sau khi cài.

> ⚠️ `onnxruntime` và `numpy` **không** bỏ được: chúng đến từ `chromadb`, thứ
> bắt buộc phải có. Đừng kỳ vọng image tụt xuống vài trăm MB.

Kèm theo đó, `src/core/transcription.py` phải chịu được việc không có
`faster_whisper`: import trong hàm chứ không ở đầu tệp, thiếu thì trả lỗi rõ
ràng "chưa bật tính năng phiên âm" thay vì làm sập cả dịch vụ lúc khởi động.

### Ngày chuyển sang server có GPU

Phần này **đã được thiết kế sẵn từ trước**, bạn không phải sửa mã:

```dotenv
LLM_PROVIDER=auto          # tự ưu tiên Qwen, rơi xuống Gemini khi vLLM chết
WHISPER_DEVICE=cuda
WHISPER_COMPUTE_TYPE=float16
```

`llm_provider.py` đã có sẵn cơ chế dò sức khỏe vLLM và fallback. Việc còn lại
chỉ là build có `--extra whisper --extra gpu` và chép thư mục `data/chroma_db`
sang — hoặc đơn giản hơn: để trống rồi cho hệ thống tự nạp lại (xem dưới).

---

## Phần 4 — Khó khăn thật sự, xếp theo mức độ

### 4.1. ChromaDB mất dữ liệu khi deploy lại — mức: TRUNG BÌNH, đã có sẵn cách chữa

`CHROMA_PERSIST_DIR=./data/chroma_db` nằm trên đĩa container. Không gắn volume
thì mỗi lần deploy là chatbot quên sạch.

**May mắn là dự án đã tự chữa từ trước:** `server.js` gọi `syncInitialDataToAi()`
3 giây sau khi khởi động, nạp lại toàn bộ khóa học + FAQ vào ChromaDB. Nghĩa là
mất dữ liệu vector không phải thảm họa — chỉ là vài giây chậm lúc khởi động.

Nhưng phải bổ sung hai điều:

1. **Nạp lại cả tài liệu FAQ** (đọc từ `faq-documents.json`, dùng text đã bóc).
2. **Chỉ nạp khi collection rỗng.** Nếu nạp mù mỗi lần khởi động, mỗi lần deploy
   lại đốt một lượt gọi API nhúng vector cho toàn bộ nội dung — với hạn mức
   Gemini miễn phí thì đó là lãng phí đáng kể.

Trên EC2 thì đơn giản hơn nữa: gắn named volume cho `./data` là xong, không mất
gì cả.

### 4.2. Hạn mức Gemini miễn phí — mức: CAO, đây mới là ràng buộc thật

Đây là thứ sẽ cắn bạn sớm nhất, không phải vCPU.

Với `LLM_PROVIDER=gemini`, **mọi thứ** đều gọi API: phân loại ý định, trả lời
chat, nhúng vector, viết mô tả khóa học, soạn trắc nghiệm. Hạn mức tính **theo
project Google Cloud, không phải theo API key** — tạo thêm key trong cùng project
không giúp gì cả.

Cách giảm áp lực, theo thứ tự hiệu quả:

- Chỉ nạp lại RAG khi collection rỗng (mục 4.1) — tiết kiệm nhiều nhất.
- Giữ nguyên `RATE_LIMIT_IMPORT_ENRICH_MAX` ở mức thấp khi demo thật.
- Dùng model rẻ cho việc phân loại ý định (`gemini_routing_model` đã tách riêng
  sẵn — thiết kế này đúng, cứ giữ).
- Cache câu trả lời cho những câu hỏi lặp lại (Redis đã có).

### 4.3. Nếu vẫn muốn host thứ hai — mức: CAO về bảo mật

Chỉ đọc phần này nếu bạn nhất định tách host.

`INTERNAL_API_KEY` hiện đi qua header HTTP. Trong mạng Docker thì không sao. Ra
Internet công cộng mà không có TLS thì **khóa bị lộ nguyên văn** cho bất kỳ ai
nghe được đường truyền — và ai có khóa thì đốt sạch hạn mức Gemini của bạn.

Bắt buộc: host phải có HTTPS (Render/Fly/Railway đều cấp sẵn), và
`AI_SERVICE_URL` phải là `https://`. Không có ngoại lệ.

### 4.4. RDS đã có sẵn — mức: THẤP, nhưng nhớ một điều

Bạn đã tạo được RDS. Khi deploy, `DB_HOST` trỏ vào endpoint RDS thay vì
`database`. Nhớ rằng **`db-init` (Flyway) cũng phải trỏ vào RDS**, và mật khẩu
phải đồng bộ — đúng cái bẫy vừa làm bạn mất thời gian ở môi trường local. Trên
production, `MSSQL_SA_PASSWORD` phải thành mật khẩu master của RDS.

### 4.5. Chi phí EC2 khi bật GPU sau này — mức: THẤP nhưng nên biết trước

Instance GPU rẻ nhất (g4dn.xlarge) khoảng **0,5 USD/giờ** — chạy liên tục là
~360 USD/tháng. Với đồ án, cách dùng hợp lý là **bật khi demo, tắt khi xong**.
Thiết kế `LLM_PROVIDER=auto` đã tính đúng cho kiểu dùng này: GPU tắt thì tự rơi
xuống Gemini, hệ thống không chết.

---

## Phần 5 — Thứ tự việc cần làm

| # | Việc | Trạng thái |
|---|------|-----------|
| 1 | Xóa `db-init/V9__faq_knowledge_base.sql` | ✅ đã chuyển vào `_to_delete/` |
| 2 | `V10__drop_faq_tables.sql` — dọn bảng nếu V9 đã lỡ chạy | ✅ đã viết |
| 3 | `faqs.data.js` — FAQ code cứng | ✅ đã viết |
| 4 | `faqs.repository.js` đọc từ hằng số, bỏ SQL | ✅ đã viết |
| 5 | `aiSync.service.js` nạp FAQ từ hằng số | ✅ đã sửa |
| 6 | Tách `whisper` thành nhóm phụ thuộc tùy chọn | ✅ xong |
| 7 | `transcription.py` chịu được khi thiếu faster-whisper | ✅ xong |
| 8 | Đường ống PDF → Cloudinary → JSON → ChromaDB | ✅ xong |
| 9 | Chỉ nạp lại RAG khi collection rỗng | ✅ xong |
| 10 | Dockerfile + compose thống nhất cho production | ✅ xong |

Việc còn lại của bạn: xóa thư mục `_to_delete/` ở gốc dự án (và thư mục rỗng
`db-init/_to_delete/`) — tôi chuyển tệp vào đó chứ không xóa được từ xa.

---

## Phần 6 — Docker & Compose sau khi làm xong (mục 10)

### 6.1. Một Dockerfile, hai loại máy

`ai-service/Dockerfile` trước đây ghi cứng `--extra gpu` và trong chú thích nói
thẳng: *"Image này CHỈ build để chạy trên GPU EC2 #2"*. Muốn bản CPU thì phải
sửa mã nguồn — cách chắc chắn nhất để một ngày nào đó đẩy nhầm bản GPU lên máy
CPU mà không ai nhận ra cho tới lúc container không khởi động.

Nay khác nhau ở **tham số lúc build**, không ở mã nguồn:

```bash
# Giai đoạn 1 — EC2 CPU tạm thời (đang dùng), Gemini-only:  ~500MB
docker build -t $DOCKER_USERNAME/3t-edu-tech-ai-service:cpu ./ai-service

# Giai đoạn 2 — GPU EC2 #2 sau khi xin được quota:          ~1.6GB
docker build --build-arg INSTALL_EXTRAS="whisper,gpu" \
             -t $DOCKER_USERNAME/3t-edu-tech-ai-service:gpu ./ai-service
```

Mặc định là **rỗng (CPU)** có chủ ý: quên tham số khi build cho máy CPU thì
được đúng thứ cần; quên khi build cho máy GPU thì phiên âm báo lỗi rõ ràng
"chưa bật tính năng phiên âm" chứ dịch vụ vẫn chạy. Chiều hỏng nhẹ hơn được
chọn làm mặc định.

Bước cài còn **chặn cấu hình vô nghĩa**: `INSTALL_EXTRAS=gpu` mà thiếu `whisper`
sẽ làm build DỪNG kèm giải thích, vì nhóm `gpu` chỉ là thư viện runtime cho
ctranslate2 — mà ctranslate2 đến từ faster-whisper.

### 6.2. Hai lỗi thật đã sửa nhân tiện

**`uv run run.py` → `python run.py`.** `uv run` thấy `pyproject.toml` + `uv.lock`
trong thư mục làm việc nên nó tạo một `.venv` MỚI và đồng bộ lại toàn bộ phụ
thuộc **ngay lúc container khởi động**. Nghĩa là:

- bước `uv pip install --system` lúc build thành công cốc — image mang sẵn
  500MB–1.6GB thư viện không bao giờ được dùng tới;
- `uv sync` mặc định **không** cài nhóm optional, nên bản GPU build với
  `--extra whisper,gpu` sẽ khởi động mà **không có** faster-whisper — đúng thứ
  vừa trả tiền dung lượng để có;
- container cần mạng ra PyPI mỗi lần khởi động lại;
- thời gian khởi động từ vài giây thành vài phút, đủ để healthcheck của Docker
  báo thất bại và giết container ngay giữa lúc nó đang cài.

**`workers=2` ghi cứng → `AI_SERVICE_WORKERS`, mặc định 1.** Mỗi worker là một
tiến trình riêng, tức hai bản ChromaDB cùng mở một thư mục SQLite. ChromaDB bản
nhúng không được thiết kế cho nhiều tiến trình ghi song song — ghi đồng thời
sinh "database is locked" ngẫu nhiên, và lỗi kiểu này chỉ xuất hiện lúc có tải
thật. Cộng thêm ~350MB mỗi worker trên một t3.medium 4GB đã phải chia cho
backend + redis + frontend.

### 6.3. AI Service nay nằm trong `docker-compose.cpu-ec2.yml`

Một EC2 chạy cả bốn: backend, redis, frontend, ai-service.

| Dịch vụ | `mem_limit` | Cổng |
|---------|------------|------|
| backend | 1024m | 5000 |
| redis | 512m | 127.0.0.1:6379 |
| ai-service | 1024m | **127.0.0.1:2111** |
| frontend | 256m | 80, 443 |

Cổng 2111 **chỉ bind loopback**. Backend gọi qua DNS nội bộ của Docker
(`http://ai-service:2111`), nên không cần mở gì trên Security Group — nỗi lo
"cổng 2111 lộ ra 0.0.0.0/0" trong Phần 4.3 biến mất hoàn toàn ở giai đoạn này.

`LLM_PROVIDER=gemini` được **ghi đè cứng** trong compose, không để phụ thuộc
vào `.env.production`. Nếu tệp đó còn sót `auto` hay `qwen` (rất dễ, vì cùng một
tệp được chép qua lại giữa các máy), AI Service sẽ thử gọi vLLM ở
`127.0.0.1:8000` — tức gọi vào chính nó — rồi chờ hết timeout ở **mỗi** câu hỏi
trước khi fallback. Người dùng chỉ thấy "chatbot rất chậm", không thấy lỗi nào.

### 6.4. Ngày chuyển sang máy GPU — không sửa một dòng YAML nào

```bash
# 1. Trên máy GPU:
docker compose -f docker-compose.gpu-ec2-ai.yml up -d

# 2. Trên máy CPU, thêm vào .env:
AI_SERVICE_URL=http://<ip-noi-bo-cua-may-gpu>:2111

# 3. Tắt bản AI Service đang chạy chung:
docker compose -f docker-compose.cpu-ec2.yml up -d --scale ai-service=0
```

Backend đọc `AI_SERVICE_URL` từ biến môi trường (mặc định trỏ vào service nội
bộ), nên đổi đích chỉ là đổi một dòng trong `.env`.

⚠️ Dùng **IP nội bộ trong VPC**. Khi hai máy nói chuyện qua Internet công cộng,
`INTERNAL_API_KEY` đi qua đường công cộng ở dạng chữ thường và HTTPS trở thành
bắt buộc.

⚠️ Hai máy dùng **hai tag ảnh khác nhau** (`AI_IMAGE_TAG`, mặc định `cpu` và
`gpu`) chứ không dùng chung `IMAGE_TAG` với backend/frontend — nếu dùng chung,
một lần deploy backend theo git-sha sẽ vô tình kéo theo ảnh AI Service cùng sha,
mà ảnh đó có thể là bản GPU 1.6GB không chạy nổi trên t3.medium.

Kiểm tra sau khi triển khai máy GPU:

```bash
curl -s http://localhost:2111/health | grep -o '"available":[a-z]*'
# phải là "available":true
```

---

## Phần 7 — Tài liệu chính sách FAQ (mục 8) hoạt động thế nào

### 7.1. Đường đi của một tệp PDF

```
PDF của quản trị viên
  → bóc text (AI Service /api/extract/document, Python)
  → lưu bản text ra đĩa      FAQ_DOCS_DIR/text/<docId>.txt
  → tải tệp GỐC lên Cloudinary   (trang quản lý vẫn xem lại được)
  → nạp text vào ChromaDB        source_name = "FAQ-DOC-<docId>"
  → ghi siêu dữ liệu             FAQ_DOCS_DIR/manifest.json
```

**Không thêm bảng CSDL nào.** Xóa sạch một tài liệu chỉ cần một lời gọi có sẵn
từ trước:

```
DELETE /api/ingest/collection/master_knowledge/source/FAQ-DOC-<docId>
```

### 7.2. Thứ tự các bước được chọn theo "hỏng thì hỏng kiểu nào"

- **Bóc text đi trước Cloudinary.** Đây là bước hay hỏng nhất (PDF quét từ ảnh,
  PDF có mật khẩu, tệp hỏng). Hỏng ở đây thì chưa có gì được ghi ra ngoài.
- **Nạp ChromaDB hỏng sau khi đã tải Cloudinary → tự gỡ tệp vừa tải.** Nửa vời
  ở đây nghĩa là quản trị viên thấy một tài liệu trong danh sách mà chatbot
  không hề biết tới — sai lệch âm thầm, khó phát hiện nhất.
- **Khi xóa: gỡ ChromaDB TRƯỚC, mọi thứ khác sau.** Nếu xóa manifest trước rồi
  ChromaDB hỏng, ta mất luôn khóa `sourceName` cần để dọn — vector ở lại vĩnh
  viễn và chatbot vẫn trích dẫn một chính sách đã bị gỡ.

### 7.3. Ba lớp bảo vệ khi nhận tệp

1. **Chữ ký ở đầu tệp** (`%PDF-`, `PK\x03\x04`) chứ không tin `mimetype` —
   giá trị đó do trình duyệt (hay kẻ tấn công) khai báo.
2. **Chỉ quản trị viên** tải lên được. Đây mới là lớp bảo vệ chính.
3. **PDF không bóc được chữ → từ chối (422)** kèm gợi ý "dùng bản PDF gốc thay
   vì bản scan", chứ không lưu một tài liệu rỗng rồi để quản trị viên tin rằng
   chính sách đã được nạp.

### 7.4. Trang quản trị đã được viết lại

Bản cũ **chưa từng hoạt động**: nút "Import từ PDF" truyền `FormData` vào
`apiHelper.post`, mà hàm đó chạy `JSON.stringify` lên nó — cả tệp thành chuỗi
`"{}"`. Kể cả qua được, endpoint backend lại `require('pdf-parse')`, một gói
không có trong `package.json`.

Trang mới có hai phần: **Tài liệu chính sách** (tải lên / xem nội dung đã bóc /
mở tệp gốc / xóa) và **Câu hỏi thường gặp** ở chế độ chỉ đọc, kèm giải thích
rằng nội dung nằm trong `faqs.data.js` và sửa bằng cách chỉnh tệp đó rồi triển
khai lại.

### 7.5. Biến môi trường mới

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `FAQ_DOCS_DIR` | `/var/lib/3tedu/faq-docs` | Thư mục chứa `manifest.json` + bản text |
| `FAQ_DOC_MAX_MB` | `10` | Kích thước tối đa một tệp |
| `FAQ_DOC_MAX_COUNT` | `50` | Số tài liệu tối đa |

⚠️ `FAQ_DOCS_DIR` dùng **volume riêng** (`faq-docs`, `faq-docs-dev`), tuyệt đối
không dùng chung với `import-temp`: thư mục nhập khóa học bị cron dọn định kỳ
theo `IMPORT_TTL_HOURS`. Để chung thì sau 12–48 giờ toàn bộ danh mục tài liệu bị
xóa cùng tệp tạm — tệp gốc vẫn còn trên Cloudinary nhưng hệ thống không còn biết
chúng tồn tại, và mất luôn khóa để gỡ vector khỏi ChromaDB.

---

## Phần 8 — Chỉ nạp lại RAG khi cần (mục 9)

`syncInitialDataToAi()` chạy ở **mỗi** lần backend khởi động và trước đây nạp
lại toàn bộ khóa học + FAQ bất kể ChromaDB đã có sẵn dữ liệu. Mỗi lần nạp là một
loạt lời gọi API embedding của Gemini — tốn tiền và đếm vào hạn mức (xem Phần
4.2, đây mới là ràng buộc thật). Vòng lặp khóa học còn có `sleep(500ms)` giữa
các lần gọi, nên 40 khóa học là thêm ~20 giây mỗi lần khởi động.

Nay có **ba điều kiện khác nhau**, mỗi cái theo một logic riêng:

| Loại | Điều kiện bỏ qua | Vì sao khác nhau |
|------|------------------|------------------|
| Khóa học | collection `courses` còn vector | Xuất bản/sửa khóa học đã có đường đồng bộ riêng; vòng lặp lúc khởi động chỉ là mồi ban đầu |
| FAQ | **vân tay nội dung** khớp **và** collection `master` còn vector | FAQ nằm trong mã nguồn nên sửa xong deploy là phải nạp lại NGAY |
| Tài liệu chính sách | collection `master` còn vector | PDF bất biến sau khi tải lên; sửa nghĩa là xóa và tải bản mới |

Vế "collection còn vector" trong điều kiện FAQ là **bắt buộc**: thiếu nó, xóa
volume ChromaDB xong chatbot sẽ mất hết tri thức FAQ vĩnh viễn vì vân tay trong
Redis vẫn còn nguyên và bảo "đã nạp rồi" — đúng kiểu bộ nhớ đệm nói dối mà cơ
chế này phải tránh.

Vân tay chỉ được ghi khi **tất cả** FAQ nạp thành công. Nếu 10/12 vào được mà
vẫn ghi, hai mục lỗi sẽ không bao giờ được thử lại.

Ép nạp lại bằng tay: `syncInitialDataToAi({ force: true })`.

---

## Phần 9 — Đã kiểm thử những gì

| Bộ | Số phép | Nội dung |
|----|---------|----------|
| `transcription.py` không có faster-whisper | 4 | nạp được module, `is_transcription_available()` = false, ném `TranscriptionUnavailableError` kèm hướng dẫn bật lại |
| Logic `INSTALL_EXTRAS` của Dockerfile | 5 | rỗng / whisper / whisper,gpu / gpu (bị chặn) / gpu,whisper |
| `aiSync.service.js` | 11 | ChromaDB rỗng, vân tay khớp, FAQ vừa sửa, volume bị xóa, `force`, Redis hỏng |
| `faqDocuments` (store + service) | 29 | 5 bước tải lên, chặn tệp giả mạo, PDF scan → 422, rollback Cloudinary, xóa khi ChromaDB hỏng, tải lên đồng thời, chạm trần, manifest hỏng, `reingestAll` |
| YAML của 3 tệp compose | 3 | phân tích được, mọi volume đều đã khai báo |
| TypeScript toàn dự án frontend | — | `tsc --noEmit` → **0 lỗi** |
| Nạp thật `faqs.routes` trên máy bạn | — | `/documents` đứng trước `/:id`, đúng thứ tự |

**Tổng: 52 phép kiểm thử, 52 đạt.**
