# Runbook triển khai 3T EduTech lên AWS

> Viết 23/08/2026, cập nhật 24/08/2026 (phần migration — xem `db-init/README.md`).
> Đây là tài liệu **thao tác theo thứ tự**, khác với
> `KE_HOACH_TRIEN_KHAI_PRODUCTION.md` (phân tích hiện trạng và lý do).
> Làm từ trên xuống, không nhảy cóc.

## Các quyết định đã chốt

| Việc | Quyết định | Ghi chú |
|---|---|---|
| Thu hồi 3 khóa lộ trong Git | **Bỏ qua** | Xem cảnh báo cuối tài liệu |
| Nâng hạn mức G (8 vCPU) | **Không xin** | Dùng máy khác thay vì chờ duyệt |
| RDS | **`db.t3.small`, giữ Express** | Bật mã hóa luôn thể |
| S3 | **Tạo, quy mô nhỏ** | Đường lùi cho Cloudinary |
| Tên miền | **Miễn phí** | `.id.vn` hoặc DuckDNS, xem Giai đoạn 3 |
| Tắt máy khi không dùng | **Tự động hằng đêm** | `scripts/12-lich-tu-dong-tat.sh` |
| Migration | **Gộp V1–V10 thành một baseline** | Kèm 745 hàng dữ liệu demo |

## Tổng thời gian và chi phí

| Giai đoạn | Thời gian | Chi phí trong lúc làm |
|---|---|---|
| 0 — Nền tảng | ~45 phút | $0 (máy vẫn tắt) |
| 1 — RDS + migration | ~75 phút | ~$1.5/ngày |
| 2 — Web + HTTPS | ~90 phút | ~$1.5/ngày |
| 3 — AI Service | ~60 phút | ~$14/ngày |
| 4 — vLLM | ~60 phút | ~$38/ngày |

Giai đoạn 4 là tầng duy nhất đắt. Theo `llm_provider.py`, Gemini trả lời trước
nên **hệ thống chạy đầy đủ suốt giai đoạn 1–3 với GPU #1 vẫn tắt**. Đừng bật nó
sớm.

---

# GIAI ĐOẠN 0 — Nền tảng (~45 phút, $0)

Làm hết trong lúc mọi thứ còn tắt. Không tốn đồng nào.

## 0.1 Đóng SSH với người lạ

```bash
export AWS_PROFILE=edutech-devops AWS_REGION=ap-northeast-1

aws ec2 revoke-security-group-ingress \
  --group-id sg-0dbefbd2d9eaad7b4 --protocol tcp --port 22 --cidr 0.0.0.0/0
```

Kiểm lại — kết quả phải **không còn** `0.0.0.0/0` ở cổng 22:

```bash
aws ec2 describe-security-groups --group-ids sg-0dbefbd2d9eaad7b4 \
  --query 'SecurityGroups[0].IpPermissions[?FromPort==`22`].IpRanges[].CidrIp'
```

## 0.2 IAM role cho EC2

Đây là điều kiện cần cho SSM (0.3), S3 (0.5) và CloudWatch. Gắn được cả khi máy
đang tắt; quyền có hiệu lực từ lần khởi động sau.

```bash
aws iam create-role --role-name 3t-edutech-ec2-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

aws iam attach-role-policy --role-name 3t-edutech-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam attach-role-policy --role-name 3t-edutech-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

aws iam create-instance-profile --instance-profile-name 3t-edutech-ec2-profile
aws iam add-role-to-instance-profile \
  --instance-profile-name 3t-edutech-ec2-profile --role-name 3t-edutech-ec2-role

sleep 10   # IAM lan truyền chậm

for id in i-01f5c3c164c11042e i-0f8ac78807132b82d i-0f6bcd18bd2c0f4eb; do
  aws ec2 associate-iam-instance-profile --instance-id "$id" \
    --iam-instance-profile Name=3t-edutech-ec2-profile
done
```

## 0.3 SSM Session Manager — thay hẳn SSH

Cài xong SSM thì **không cần cổng 22 nữa**, không cần khóa `.pem`, không cần
biết IP public (vốn đổi sau mỗi lần start). Trên máy bạn:

```bash
# Windows: winget install Amazon.SessionManagerPlugin
# macOS:   brew install --cask session-manager-plugin

aws ssm start-session --target i-01f5c3c164c11042e
```

AMI Amazon Linux và Ubuntu của AWS đã cài sẵn SSM Agent, nên chỉ cần IAM role ở
0.2. Nếu lệnh trên báo "not connected", khởi động lại máy một lần để agent nhận
quyền mới.

> Chưa dùng được SSM thì cứ SSH bình thường — 0.1 vẫn giữ ba IP nhà của bạn.
> Nhưng khi SSM chạy được rồi, gỡ nốt cổng 22 là bước dọn dẹp đáng làm.

## 0.4 Tạo lại RDS: mã hóa + `db.t3.small` + về AZ 1a

Ba việc gộp một lần tạo mới, vì `StorageEncrypted` **chỉ đặt được lúc tạo**.

```bash
bash scripts/10-tao-lai-rds.sh
```

Script hỏi xác nhận và bắt gõ đúng chuỗi `XOA-VA-TAO-LAI`. Nếu bạn không chắc
cơ sở dữ liệu còn rỗng:

```bash
KIEM_TRA_TRUOC=1 bash scripts/10-tao-lai-rds.sh
```

> **Chi phí:** `db.t3.small` **không nằm trong free tier** (free tier chỉ có
> `db.t3.micro`, 750 giờ/tháng, 12 tháng đầu). Khoảng $0.05/giờ ở Tokyo — chừng
> $36/tháng nếu chạy 24/7, nhưng bạn sẽ tắt nó, nên thực tế thấp hơn nhiều.
> Kiểm giá chính xác:
> ```bash
> aws pricing get-products --region us-east-1 --service-code AmazonRDS \
>   --filters Type=TERM_MATCH,Field=instanceType,Value=db.t3.small \
>             Type=TERM_MATCH,Field=databaseEngine,Value="SQL Server" \
>             Type=TERM_MATCH,Field=licenseModel,Value="License included" \
>             Type=TERM_MATCH,Field=regionCode,Value=ap-northeast-1 \
>   --max-items 1 --output text | head -c 2000
> ```

**Ghi lại endpoint mới** — nó khác endpoint cũ.

## 0.5 S3 làm đường lùi cho Cloudinary

```bash
bash scripts/11-tao-s3-fallback.sh
```

Bucket bị chặn public tuyệt đối, mã hóa SSE-S3, có vòng đời dọn multipart bỏ dở
sau 7 ngày. **Không bật versioning** — với video thì nó nhân đôi dung lượng mà
không hiện ra khi liệt kê.

Về cách dùng: Cloudinary vẫn là nơi lưu chính, S3 chỉ là đích ghi khi Cloudinary
hỏng. Điều này đòi một thay đổi nhỏ trong cơ sở dữ liệu — thêm cột
`storage_provider` (`'cloudinary'` | `'s3'`) vào bảng lưu tệp. Nếu chỉ lưu
đường dẫn rồi đoán theo tiền tố thì sau này rất khó gỡ.

## 0.6 Lịch tự tắt hằng đêm

```bash
bash scripts/12-lich-tu-dong-tat.sh
```

01:00 giờ Việt Nam mỗi ngày, cả ba EC2 và RDS tắt. Dùng EventBridge Scheduler
gọi thẳng API AWS, không cần Lambda. Role chỉ có quyền `StopInstances` và
`StopDBInstance` trên đúng bốn tài nguyên này — kể cả nếu lịch bị sửa sai, thứ
tệ nhất nó làm được là tắt máy của bạn.

> Đây là lưới an toàn cho một chuyện mà `aws-tat.sh` không cứu được: **RDS tự
> bật lại sau 7 ngày dừng**, và lần tự bật đó không báo cho ai.

## 0.7 Cảnh báo ngân sách

```bash
aws budgets create-budget --account-id 552357225071 \
  --budget '{"BudgetName":"3t-edutech-thang","BudgetLimit":{"Amount":"60","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}' \
  --notifications-with-subscribers '[{
    "Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":80,"ThresholdType":"PERCENTAGE"},
    "Subscribers":[{"SubscriptionType":"EMAIL","Address":"sonthanhit35@gmail.com"}]
  }]'
```

## ✅ Nghiệm thu giai đoạn 0

- [ ] Cổng 22 không còn `0.0.0.0/0`
- [ ] `aws ec2 describe-instances --query 'Reservations[].Instances[].IamInstanceProfile.Arn'` trả về 3 ARN
- [ ] RDS mới: `StorageEncrypted: true`, `db.t3.small`, AZ `ap-northeast-1a`
- [ ] `aws s3 ls | grep 3t-edutech-media`
- [ ] `aws scheduler list-schedules --group-name 3t-edutech-tu-dong-tat` có 2 lịch
- [ ] Tất cả EC2 vẫn `stopped`

---

# GIAI ĐOẠN 1 — Cơ sở dữ liệu (~75 phút)

```bash
bash scripts/aws-bat.sh web
```

Bật RDS + CPU EC2. Đợi RDS `available` (5–10 phút).

## 1.1 Vào máy, lấy mã nguồn

```bash
aws ssm start-session --target i-01f5c3c164c11042e
# hoặc: ssh -i 3t_edutech_aws.pem ubuntu@18.178.30.57

sudo -i
cd /opt/3t-edu-tech && git pull
```

## 1.2 Tạo `.env.production` cho backend

```bash
nano /opt/3t-edu-tech/3t-edu-tech-backend/.env.production
```

Bốn dòng bắt buộc phải đúng:

```ini
DB_HOST=<endpoint MỚI từ bước 0.4>
DB_PORT=1433
DB_USER=edutech_admin
DB_PASSWORD=<mật khẩu đặt ở 0.4>
DB_NAME=3t_edutech_db

AI_SERVICE_URL=http://10.0.1.85:2111
AI_SERVICE_INTERNAL_KEY=<32 ký tự random, phải TRÙNG với AI Service>

MEDIA_PRIMARY=cloudinary
MEDIA_FALLBACK=s3
AWS_S3_BUCKET=3t-edutech-media-552357225071
AWS_S3_REGION=ap-northeast-1
```

> Dùng **IP private** `10.0.1.85` cho AI Service, không phải IP public. IP
> private không đổi khi start/stop; IP public thì đổi mỗi lần.
>
> **Không đặt** `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — SDK tự lấy
> quyền tạm thời từ IAM role gắn ở 0.2.

## 1.3 Thử migration trên máy dev trước — 3 phút

[SỬA 24/08/2026] Thư mục `db-init/` đã được gộp lại: Flyway giờ **chỉ thấy một
tệp** `V1__baseline.sql` (47 bảng, 88 khóa ngoại, 745 hàng dữ liệu). Chuỗi
V1..V10 cũ đã chuyển vào `_lich_su/`, bản xuất SSMS vào `_nguon/`. Chi tiết ở
`db-init/README.md`.

Chạy thử trên SQL Server trong Docker **trước khi** động vào RDS. Nó bắt mọi
lỗi cú pháp mà không tốn một giây nào của instance đang tính tiền:

```bash
docker run -d --name thu-sql -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='Thu@Nghiem123' \
  -e MSSQL_PID=Express -p 14333:1433 mcr.microsoft.com/mssql/server:2022-latest
sleep 30

docker run --rm --network host -v "$PWD/db-init:/flyway/sql:ro" flyway/flyway:10-alpine \
  -url="jdbc:sqlserver://localhost:14333;databaseName=master;encrypt=true;trustServerCertificate=true" \
  -user=sa -password='Thu@Nghiem123' \
  -mixed=true -placeholderReplacement=false migrate

docker rm -f thu-sql
```

> `-placeholderReplacement=false` là bắt buộc — SQL có chuỗi dạng `${...}` và
> Flyway sẽ tưởng đó là biến của nó.

## 1.4 Chạy migration lên RDS

```bash
sudo bash /opt/3t-edu-tech/scripts/02-chay-migration.sh
```

Script bản mới còn **4 bước** (trước là 5): DNS → TCP → dò ảnh Docker + đăng
nhập → Flyway. Bước "chuẩn bị bản SQL tương thích RDS" đã bỏ hẳn — `V1__baseline.sql`
trong git nay chính là tệp sẽ chạy, không qua bản sao tạm nào nữa.

Nếu bước TCP báo MỞ thì mạng đã đúng, mọi lỗi sau đó là lỗi khác.

**Chạy từ EC2, không phải từ máy ở nhà.** RDS không public — từ ngoài VPC sẽ
luôn thất bại dù cấu hình hoàn hảo.

## 1.5 🔴 Đổi mật khẩu tài khoản quản trị — làm ngay, đừng để sau

`V1__baseline.sql` mang theo **11 tài khoản thật từ máy dev**, kèm
`HashedPassword`, `PasswordResetToken` và `EmailVerificationToken`. Đó là cái
giá của việc có sẵn dữ liệu để demo.

Nghĩa là: **ai biết mật khẩu bạn dùng ở máy dev thì đăng nhập được vào máy chủ
công khai với quyền quản trị.** Và mật khẩu máy dev thường là loại đặt cho
nhanh.

```bash
# Xem có những tài khoản nào và vai trò gì
docker run --rm mcr.microsoft.com/mssql-tools:latest /opt/mssql-tools/bin/sqlcmd \
  -S "<endpoint>,1433" -U edutech_admin -P '<mat-khau>' -d 3t_edutech_db \
  -Q "SELECT AccountID, Email, RoleID, Status FROM dbo.Accounts ORDER BY RoleID"
```

Rồi đăng nhập từng tài khoản `AD` trên web và đổi mật khẩu qua giao diện — đừng
`UPDATE` thẳng vào bảng, vì backend băm mật khẩu theo thuật toán riêng của nó.

> Không muốn mang dữ liệu demo lên máy chủ thì sinh lại baseline với
> `python3 scripts/13-chuan-hoa-baseline.py --chi-luoc-do ...`. Nhưng khi đó
> trang web trống trơn: không khóa học, không danh mục, và mục 3.3 (nạp RAG)
> sẽ không có gì để nạp.

## ✅ Nghiệm thu giai đoạn 1

Script tự in ra ở bước cuối. Phải thấy:

- [ ] `SoBang` = **47**
- [ ] `flyway_schema_history` có dòng `1 | baseline | success = 1`
- [ ] Dữ liệu đã vào: `SELECT COUNT(*) FROM dbo.Courses` trả về **8**,
      `dbo.Roles` trả về **4**, `dbo.CourseStatuses` trả về **7**
- [ ] Đã đổi mật khẩu mọi tài khoản `RoleID = 'AD'`

> Nếu `SoBang` = 47 nhưng `Courses` = 0 thì bạn đang chạy bản `--chi-luoc-do`.
> Không sai, nhưng phải biết là mình đang ở nhánh nào.

---

# GIAI ĐOẠN 2 — Web + HTTPS (~90 phút)

## 2.1 Lấy tên miền miễn phí

Let's Encrypt **không cấp chứng chỉ cho địa chỉ IP**, nên phải có tên miền.
Hai đường, chọn một:

### Cách A — `.id.vn` qua iNET (khuyên dùng cho báo cáo)

VNNIC phát miễn phí tên miền `.id.vn` cho người dùng **18–23 tuổi**, đăng ký qua
nhà đăng ký iNET. Đây là tên miền quốc gia thật, nhìn nghiêm túc trong báo cáo
tốt nghiệp hơn hẳn một subdomain miễn phí.

1. Vào `inet.vn`, tìm tên miền dạng `3t-edutech.id.vn`
2. Xác minh danh tính (eKYC bằng CCCD)
3. Vào phần quản lý DNS, thêm bản ghi:

   | Loại | Tên | Giá trị | TTL |
   |---|---|---|---|
   | A | `@` | `18.178.30.57` | 300 |
   | A | `www` | `18.178.30.57` | 300 |

**Nhược điểm:** eKYC mất vài giờ tới một ngày. Nếu gấp, làm cách B trước rồi
chuyển sang A sau — đổi tên miền chỉ là chạy lại `03-bat-https.sh`.

### Cách B — DuckDNS (có ngay trong 2 phút)

1. Vào `duckdns.org`, đăng nhập bằng GitHub/Google
2. Tạo `3t-edutech.duckdns.org`, điền IP `18.178.30.57`
3. Xong — không cần chờ duyệt gì

`duckdns.org` nằm trong Public Suffix List nên mỗi subdomain có hạn mức
Let's Encrypt riêng, không tranh chấp với người khác.

### Kiểm tra trước khi xin chứng chỉ

```bash
dig +short 3t-edutech.id.vn      # phải trả về 18.178.30.57
```

Nếu chưa đúng, **đừng chạy certbot vội**: Let's Encrypt giới hạn 5 lần thất bại
mỗi giờ, và mỗi lần chạy hỏng là một lần tiêu hạn mức.

## 2.2 Triển khai ứng dụng

```bash
cd /opt/3t-edu-tech
docker compose -f docker-compose.cpu-ec2.yml up -d
docker compose -f docker-compose.cpu-ec2.yml logs -f
```

Đặt `LLM_PROVIDER=gemini` ở giai đoạn này — chưa động tới máy GPU nào.

```bash
curl -s http://localhost/v1/categories | head -c 200
```

## 2.3 Bật HTTPS

```bash
sudo bash scripts/03-bat-https.sh
```

## ✅ Nghiệm thu giai đoạn 2

- [ ] `https://<tên-miền>/v1/categories` trả JSON, trình duyệt hiện khóa xanh
- [ ] `curl -I http://<tên-miền>` chuyển hướng 301 sang https
- [ ] Trang chủ frontend load được, đăng nhập được

---

# GIAI ĐOẠN 3 — AI Service (~60 phút, +$0.53/h)

```bash
bash scripts/aws-bat.sh ai
```

## 3.1 `.env.production` cho AI Service

```ini
LLM_PROVIDER=gemini          # CHƯA phải auto — GPU #1 vẫn đang tắt
LLM_GEMINI_COOLDOWN_SECONDS=900

GEMINI_ROUTING_API_KEY=<khóa thật>
GEMINI_CHAT_API_KEY=<khóa thật>
GEMINI_EMBEDDING_API_KEY=<khóa thật>

INTERNAL_API_KEY=<trùng với AI_SERVICE_INTERNAL_KEY của backend>

WHISPER_MODEL_SIZE=large-v3
WHISPER_DEVICE=cuda
WHISPER_COMPUTE_TYPE=float16

VLLM_BASE_URL=http://10.0.1.114:8000/v1    # điền sẵn, chưa dùng tới
```

## 3.2 Build kèm Whisper và GPU

```bash
docker build --build-arg INSTALL_EXTRAS="whisper,gpu" \
  -t $DOCKER_USERNAME/3t-edu-tech-ai-service:gpu ./ai-service
docker compose -f docker-compose.gpu-ec2-ai.yml up -d
```

Thiếu `--build-arg` thì dịch vụ **vẫn chạy bình thường**, chỉ riêng phiên âm bị
bỏ qua kèm một dòng cảnh báo trong log — đúng kiểu lỗi không ai để ý cho tới
lúc demo tính năng tạo phụ đề.

## 3.3 Nạp dữ liệu RAG — làm ngay, đừng để tới sát ngày demo

```bash
curl -X POST http://localhost:2111/api/ingest/courses \
  -H "X-Internal-Api-Key: <INTERNAL_API_KEY>"
```

> Embedding đi qua `gemini-embedding` và **không có đường lùi** — vLLM chỉ phục
> vụ mô hình sinh văn bản. Nếu hạn mức embedding cạn đúng hôm demo, chatbot vẫn
> trả lời nhưng không tìm được tài liệu để trích dẫn: câu trả lời chung chung,
> không dẫn nguồn. Dữ liệu đã nạp rồi thì hôm đó không cần gọi embedding nữa.

[SỬA 24/08/2026] Bước này **giờ mới thật sự có gì để nạp**. `V1__baseline.sql`
mang theo 8 khóa học, 22 chương, 59 bài học và 50 bản phụ đề. Trước đây, khi
baseline chưa kèm dữ liệu, lệnh ingest vẫn trả về `200 OK` nhưng nạp đúng 0
tài liệu — và chatbot sau đó trả lời chung chung mà không ai hiểu vì sao.

Vì vậy đừng chỉ nhìn mã trạng thái, hãy đếm:

```bash
curl -s http://localhost:2111/health | python3 -c \
  "import sys,json; print(json.load(sys.stdin)['collections'])"
```

## ✅ Nghiệm thu giai đoạn 3

```bash
curl -s http://localhost:2111/health | python3 -m json.tool
```

- [ ] `"status": "healthy"`
- [ ] `"whisper": {"available": true, "model_size": "large-v3", "device": "cuda"}`
- [ ] `"collections"` có số lượng > 0 (với 8 khóa học trong baseline thì phải khác 0)
- [ ] `nvidia-smi` thấy tiến trình python ~3GB sau lần phiên âm đầu
- [ ] Chatbot trên web trả lời có trích dẫn nguồn

---

# GIAI ĐOẠN 4 — vLLM (~60 phút, +$1.00/h)

Tầng cuối, tầng đắt nhất. Chỉ làm khi giai đoạn 1–3 đã xanh hết.

## 4.1 Chọn mô hình — và xác minh nó là bản text-only

Sự cố 20/08 là do nạp một biến thể **VL (nhìn ảnh)**: trọng số chiếm 19.77 GiB
trên card 22.04 GiB, và crash lúc vLLM dựng ảnh giả để đo bộ nhớ. Hệ thống của
bạn không bao giờ gửi ảnh — `_build_messages()` chỉ dựng message text thuần.

```bash
MODEL=<repo bạn định dùng>
curl -s https://huggingface.co/${MODEL}/raw/main/config.json \
  | grep -iE 'architectures|vision|quant'
```

- Có `vision_config`, hoặc `architectures` chứa `VL` → **bản VL, bỏ**
- `"quant_method": "awq"` → đúng bản đã lượng tử hóa
- Không có `quantization_config` → bản fp16, nặng gấp 4 lần

## 4.2 Cấu hình

Tạo `vllm-server/.env` theo **cấu hình A** ở cuối `vllm-server/docker-compose.yml`:

```ini
VLLM_VERSION=v0.11.0
VLLM_MODEL=<repo AWQ/GPTQ ~9B text-only, đã xác minh ở 4.1>
VLLM_MAX_LEN=16384
VLLM_GPU_UTIL=0.88
VLLM_MAX_SEQS=16
```

```bash
cd /opt/3t-edu-tech/vllm-server
export HF_TOKEN=hf_xxx
export VLLM_API_KEY=$(openssl rand -hex 24) && echo "$VLLM_API_KEY"   # GHI LẠI
docker compose up -d && docker compose logs -f
```

## 4.3 Nếu muốn chạy mô hình 27B

`g6.xlarge` (L4, 22.04 GiB dùng được) quá chật cho 27B: trọng số ~16.5 GiB chỉ
còn ~4 GiB cho KV cache. Bạn đã nói không xin nâng hạn mức, nên đây là lối duy nhất:

**`g6e.xlarge`** — L40S 48 GiB VRAM, và quan trọng là **cũng 4 vCPU**, nên tổng
G-quota vẫn 8/8, không cần xin phép ai. Giá khoảng $2.31/giờ ở Tokyo (so với
~$1.00 của g6.xlarge).

```bash
# Kiểm g6e có bán ở AZ 1a không — subnet của bạn nằm ở 1a
aws ec2 describe-instance-type-offerings --location-type availability-zone \
  --filters Name=instance-type,Values=g6e.xlarge \
  --query 'InstanceTypeOfferings[].Location'

# Đổi loại máy — EBS và dữ liệu giữ nguyên
aws ec2 stop-instances --instance-ids i-0f8ac78807132b82d
aws ec2 wait instance-stopped --instance-ids i-0f8ac78807132b82d
aws ec2 modify-instance-attribute --instance-id i-0f8ac78807132b82d \
  --instance-type g6e.xlarge
aws ec2 start-instances --instance-ids i-0f8ac78807132b82d
```

Đổi ngược lại về `g6.xlarge` cũng bằng đúng ba lệnh đó. Không mất gì.

> **Thử cấu hình A trên `g6.xlarge` trước.** Mô hình ~9B thừa sức cho bốn việc
> mà `llm_provider.py` giao cho Qwen: phân intent (JSON 256 token), trả lời RAG
> đã có sẵn ngữ cảnh, streaming, gợi ý câu hỏi. Nếu nó đủ tốt thì bạn tiết kiệm
> $1.31/giờ và khỏi đổi máy.

## 4.4 Nối vào AI Service

Trên GPU #2:

```ini
VLLM_BASE_URL=http://10.0.1.114:8000/v1
VLLM_MODEL_NAME=<đúng chuỗi VLLM_MODEL ở 4.2>
VLLM_API_KEY=<chuỗi random ở 4.2>
LLM_PROVIDER=auto
```

```bash
docker compose -f docker-compose.gpu-ec2-ai.yml restart
```

## ✅ Nghiệm thu giai đoạn 4 — bước này bắt buộc

```bash
# Trên GPU #2, ép đi qua Qwen
docker compose -f docker-compose.gpu-ec2-ai.yml exec ai-service \
  sh -c 'LLM_PROVIDER=qwen python -c "..."'
# hoặc đơn giản: đặt LLM_PROVIDER=qwen trong .env, restart, chat một câu, rồi đổi lại auto
```

- [ ] Với `LLM_PROVIDER=qwen`, chatbot vẫn trả lời được
- [ ] `docker compose logs` của vLLM thấy request đi vào
- [ ] Đổi lại `LLM_PROVIDER=auto`, restart

> Với `auto`, Gemini luôn trả lời trước, nên **vLLM có thể hỏng hoàn toàn mà
> không ai biết** — đúng cái bẫy `VLLM_BASE_URL=127.0.0.1` mà
> `HUONG_DAN_TRIEN_KHAI_3_MAY.md` đã cảnh báo. Ép `qwen` một lần là cách duy
> nhất chứng minh đường đi đó còn sống.

---

# NGHIỆM THU TOÀN HỆ THỐNG

Chạy từ máy bạn, không phải từ EC2:

```bash
# Backend sống
curl -s https://<tên-miền>/v1/categories | head -c 200

# AI Service KHÔNG được lộ ra Internet
curl -m 5 http://<ip-public-gpu2>:2111/health ; echo "^ phải LỖI mới đúng"

# vLLM KHÔNG được lộ ra Internet
curl -m 5 http://<ip-public-gpu1>:8000/v1/models ; echo "^ phải LỖI mới đúng"

# SSH đã đóng với người lạ
nmap -Pn -p 22 18.178.30.57      # filtered, không phải open

# Bộ test tích hợp
cd 3t-edu-tech-backend && npm run test:smoke && npm run test:security
```

Rồi tắt hết:

```bash
bash scripts/aws-tat.sh
```

---

# VẬN HÀNH HẰNG NGÀY

```bash
bash scripts/aws-bat.sh web       # làm backend / migration
bash scripts/aws-bat.sh ai        # + chatbot, RAG, Whisper
bash scripts/aws-bat.sh tat-ca    # + vLLM (chỉ khi cần)

bash scripts/aws-tat.sh           # xong việc
bash scripts/aws-tat.sh gpu       # chỉ tắt GPU, giữ web chạy
```

Lịch ở 0.6 tự tắt mọi thứ lúc 01:00 mỗi đêm — đó là lưới an toàn, không phải
lý do để bỏ thói quen tắt tay.

Kiểm kê lại bất cứ lúc nào:

```bash
bash scripts/00-kiem-ke-he-thong-aws.sh
```

---

# MỘT ĐIỀU TÔI KHÔNG BỎ QUA ĐƯỢC

Bạn bảo bỏ phần thu hồi ba khóa đã lộ trong lịch sử Git, và tôi đã bỏ khỏi
runbook. Nhưng để lại đây một đoạn ngắn, vì nó không tự hết hạn:

`MASTER_API_KEY`, `COURSE_AI_API_KEY` và khóa YouTube Data API từng nằm trong
commit. Xóa khỏi mã nguồn không gỡ chúng khỏi lịch sử — ai clone repo về đều đọc
được. Nếu repo là **private** thì rủi ro thấp và quyết định của bạn hợp lý. Nếu
nó **public**, thì khóa YouTube là thứ đáng lo cụ thể: hạn mức Data API tính theo
dự án Google Cloud của bạn, và bot quét GitHub tìm khóa API là chuyện tự động,
liên tục, không nhắm vào ai cả.

Kiểm tra trong một phút:

```bash
gh repo view --json isPrivate -q .isPrivate
```

Trả về `true` thì bỏ qua đoạn này. Trả về `false` thì ít nhất đổi khóa YouTube —
việc đó mất 2 phút trong Google Cloud Console và không đụng gì tới mã nguồn.
