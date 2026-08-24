# Kế hoạch triển khai production — 3T EduTech

> Viết ngày 23/08/2026, dựa trên bản kiểm kê `kiem-ke-aws-20260823-0614`.
> Thay thế phần "thứ tự triển khai" của `HUONG_DAN_TRIEN_KHAI_3_MAY.md`.
> Các bước chi tiết trong tài liệu đó vẫn đúng; tệp này sửa lại **thứ tự** và
> **những ràng buộc mà bản kiểm kê mới lộ ra**.

---

## 0. Hiện trạng — đọc thẳng từ kiểm kê

| Tài nguyên | Giá trị | Trạng thái |
|---|---|---|
| Tài khoản | `552357225071`, user `edutech-admin-devops` | |
| VPC | `vpc-0eba431f9dc3ee04b` — `10.0.0.0/16` | |
| CPU EC2 | `t3.medium`, `10.0.1.9`, EIP `18.178.30.57` | **stopped** |
| GPU #1 vLLM | `g6.xlarge`, `10.0.1.114`, EBS 150GB | **stopped** |
| GPU #2 AI | `g4dn.xlarge`, `10.0.1.85`, EBS 80GB | **stopped** |
| RDS | `sqlserver-ex` 16.00, `db.t3.micro`, `10.0.20.238` | **stopped** |
| Hạn mức G | **8 vCPU** | **đang dùng 8/8** |
| S3 / ALB / ACM / Route53 | không có | |
| NAT Gateway | không có | |

**Điều đầu tiên phải nói:** mọi thứ đang tắt. Kết quả "TCP tới RDS ĐÓNG" trong
bản kiểm kê **không phải lỗi Security Group** — RDS đang `stopped`, và bạn chạy
script từ máy ở nhà trong khi RDS có `PubliclyAccessible: False`. Hai lý do đó
đủ để cổng đóng dù cấu hình hoàn toàn đúng. Thông báo chẩn đoán của script sai;
tôi đã sửa nó.

---

## 1. Những thứ đang ĐÚNG — đừng sửa

Phần mạng nội bộ của bạn làm chuẩn hơn phần lớn đồ án. Cụ thể:

```
sg-0c72aa22c2170af63 (3t-rds)        1433 ← sg-0dbefbd2d9eaad7b4 (cpu-ec2)
sg-00c6d1043a1d2f58d (3t-gpu-ec2-1)  8000 ← sg-0ba227fea0379d189 (gpu-ec2-2)
sg-0ba227fea0379d189 (3t-gpu-ec2-2)  2111 ← sg-0dbefbd2d9eaad7b4 (cpu-ec2)
```

Cả ba đều tham chiếu **security group**, không phải dải CIDR. Đây đúng là cách
nên làm: IP private đổi khi thay ENI, security group thì không. Chuỗi
`CPU → AI Service → vLLM` khép kín, không có cổng nào của tầng AI mở ra Internet.

RDS nằm ở private subnet, `PubliclyAccessible: False`, subnet group trải hai AZ.
Route table cho public subnet có đường ra qua `igw-01c760f0208a5af74`. EIP gắn
đúng vào máy cần địa chỉ cố định.

Lưu lượng EC2 (`10.0.1.x`) → RDS (`10.0.20.x`) đi qua **route `local`** của VPC,
luôn tồn tại và không cần NAT hay IGW. Nên việc không có NAT Gateway **không**
ảnh hưởng tới kết nối cơ sở dữ liệu.

---

## 2. Sáu vấn đề, xếp theo thứ tự phải xử lý

### 🔴 V1 — SSH mở ra toàn bộ Internet

```
[sg-0dbefbd2d9eaad7b4  3t-cpu-ec2]
  tcp 22 22  cidr=113.185.87.165/32, 0.0.0.0/0, 14.241.253.151/32, 113.185.85.84/32
                                     ^^^^^^^^^
```

`0.0.0.0/0` nằm lẫn giữa ba IP nhà nên rất dễ nhìn lướt qua. Máy này có EIP cố
định `18.178.30.57` — địa chỉ không đổi, nghĩa là bot quét cổng sẽ tìm thấy nó
và giữ nó trong danh sách. Chính `HUONG_DAN_TRIEN_KHAI_3_MAY.md` bạn viết có
dòng "KHÔNG để 0.0.0.0/0"; luật này lọt vào sau đó.

Gỡ ngay, không cần chờ máy chạy:

```bash
aws ec2 revoke-security-group-ingress --region ap-northeast-1 --profile edutech-devops \
  --group-id sg-0dbefbd2d9eaad7b4 --protocol tcp --port 22 --cidr 0.0.0.0/0
```

Ba IP nhà cũng là gánh nặng: IP động của nhà mạng đổi thường xuyên, và mỗi lần
đổi bạn lại thêm một dòng mà không xóa dòng cũ. Giải pháp thật nằm ở V2.

### 🔴 V2 — Hạn mức G chỉ có 8 vCPU và đang dùng hết

```
Running On-Demand G and VT instances: 8.0
```

Hạn mức EC2 tính theo **vCPU**, không theo số máy. Hiện tại:

| Máy | vCPU |
|---|---|
| g6.xlarge | 4 |
| g4dn.xlarge | 4 |
| **Tổng** | **8 / 8** |

Bạn đang chạm trần. Hệ quả trực tiếp:

- **`g6.2xlarge` mà tôi khuyên hôm trước sẽ BỊ TỪ CHỐI.** Nó là 8 vCPU; cộng
  với g4dn.xlarge thành 12 > 8 → `VcpuLimitExceeded`. Lời khuyên đó không dùng
  được khi chưa xin nâng hạn mức.
- **`g6e.xlarge` thì được** — cũng 4 vCPU, thay thẳng chỗ g6.xlarge, tổng vẫn 8.
  Đây là đường nâng cấp GPU duy nhất không cần xin phép ai.
- Gộp hai máy GPU làm một sẽ giải phóng 4 vCPU.

Xin nâng hạn mức mất **vài giờ tới vài ngày** — nếu buổi báo cáo còn gần thì
gửi đơn ngay hôm nay, đừng đợi tới lúc cần:

```bash
aws service-quotas request-service-quota-increase --region ap-northeast-1 \
  --profile edutech-devops --service-code ec2 --quota-code L-DB2E81BA --desired-value 16
```

Kiểm tra g6e có bán ở Tokyo không trước khi tính tới nó:

```bash
aws ec2 describe-instance-type-offerings --region ap-northeast-1 --profile edutech-devops \
  --location-type availability-zone \
  --filters Name=instance-type,Values=g6e.xlarge,g6.xlarge,g6.2xlarge \
  --query 'InstanceTypeOfferings[].[InstanceType,Location]' --output table
```

### 🟠 V3 — RDS là SQL Server **Express** trên `db.t3.micro`

Hai ràng buộc nằm sẵn trong lựa chọn này, và cả hai đều không mua thêm được:

**Trần 10GB mỗi cơ sở dữ liệu.** Đây là giới hạn của Microsoft trong bản Express,
không phải của AWS — tăng dung lượng EBS của RDS không nới nó ra. Khi chạm trần,
SQL Server từ chối mọi lệnh ghi với lỗi `Could not allocate space`. Với dữ liệu
học liệu, tiến độ học, và lịch sử thanh toán thì 10GB không phải là xa.

**1GB RAM.** `db.t3.micro` có 1GB, trong khi SQL Server cần gần chừng đó chỉ để
khởi động. Buffer pool gần như bằng không, nghĩa là mọi truy vấn đều đọc đĩa.
Nó sẽ chạy, nhưng chậm, và chậm không đều — đúng kiểu làm hỏng một buổi demo.

Thêm: `StorageEncrypted: False`. **Không bật được tại chỗ.** Quy trình bắt buộc
là snapshot → copy có mã hóa → restore thành instance mới → đổi endpoint. Làm
**bây giờ, khi chưa có dữ liệu thật, mất khoảng 20 phút**. Làm sau khi đã có dữ
liệu là một lần downtime có kế hoạch cộng một lần đổi `.env.production`.

Ba lựa chọn, chọn theo mục tiêu thật:

| | Khi nào chọn | Ghi chú |
|---|---|---|
| Giữ nguyên `ex` + `t3.micro` | Chỉ cần demo và bảo vệ báo cáo | **Phải ghi trần 10GB vào phần "hạn chế" của báo cáo** — đó là một điểm cộng khi bảo vệ, không phải điểm trừ |
| `ex` + `db.t3.small` | Muốn demo mượt, chưa cần dữ liệu lớn | 2GB RAM, vẫn trần 10GB, thêm khoảng $10/tháng |
| `sqlserver-web` + `db.t3.small` | Định chạy thật, có người dùng | Bỏ trần 10GB. Bản Web chỉ được cấp phép cho ứng dụng web công khai — đúng trường hợp của bạn |

Nếu đổi, đổi **trước khi chạy migration**. Đổi sau là làm lại từ đầu.

### 🟠 V4 — Không máy nào có IAM instance profile

```
IAM: None   (cả ba máy)
```

Hệ quả: EC2 không nói chuyện được với dịch vụ AWS nào mà không nhét access key
vào tệp. Ba thứ mất đi, và cả ba đều đáng tiếc:

**SSM Session Manager** — vào được shell máy chủ qua AWS API, không cần cổng 22,
không cần khóa SSH, không cần IP nhà cố định. Đây chính là lời giải cho V1: thay
vì bảo trì một danh sách IP nhà luôn lạc hậu, đóng hẳn cổng 22.

**S3** — xem V5.

**CloudWatch Agent** — hiện không có cách nào biết RAM còn bao nhiêu. CloudWatch
mặc định chỉ đo CPU, đĩa và mạng; RAM phải cài agent. Trên `t3.medium` 4GB đang
chạy backend + frontend + nginx + redis, RAM là thứ sẽ hết trước tiên, và cũng
là thứ bạn đang không nhìn thấy.

Tạo một lần, gắn cho cả ba máy:

```bash
aws iam create-role --profile edutech-devops --role-name 3t-edutech-ec2-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

aws iam attach-role-policy --profile edutech-devops --role-name 3t-edutech-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam attach-role-policy --profile edutech-devops --role-name 3t-edutech-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

aws iam create-instance-profile --profile edutech-devops \
  --instance-profile-name 3t-edutech-ec2-profile
aws iam add-role-to-instance-profile --profile edutech-devops \
  --instance-profile-name 3t-edutech-ec2-profile --role-name 3t-edutech-ec2-role

for id in i-01f5c3c164c11042e i-0f8ac78807132b82d i-0f6bcd18bd2c0f4eb; do
  aws ec2 associate-iam-instance-profile --region ap-northeast-1 --profile edutech-devops \
    --instance-id "$id" \
    --iam-instance-profile Name=3t-edutech-ec2-profile
done
```

> Gắn instance profile được cả khi máy đang `stopped`. Quyền chỉ có hiệu lực từ
> lần khởi động sau.

### 🟠 V5 — Không có S3 bucket, nhưng hệ thống có upload video

`docs/PHAN_TICH_VIDEO_VA_GIOI_HAN_ZIP.md` nói hệ thống nhận video bài giảng và
tệp ZIP. Kiểm kê cho thấy **không có bucket nào**. Vậy tệp đang nằm trên đĩa EC2.

`t3.medium` có **30GB EBS**, đã trừ hệ điều hành, Docker image, log. Vài chục
video bài giảng là hết. Khi đĩa đầy, Docker không ghi được log, Redis không lưu
được, backend đổ — và triệu chứng ban đầu trông chẳng liên quan gì tới video.

Đây là thứ phải xử lý **trước khi có người dùng thật**, vì di chuyển tệp sau khi
đã có đường dẫn trong cơ sở dữ liệu là một cuộc migration riêng.

```bash
aws s3api create-bucket --profile edutech-devops --region ap-northeast-1 \
  --bucket 3t-edutech-media-552357225071 \
  --create-bucket-configuration LocationConstraint=ap-northeast-1

aws s3api put-public-access-block --profile edutech-devops \
  --bucket 3t-edutech-media-552357225071 \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

aws s3api put-bucket-encryption --profile edutech-devops \
  --bucket 3t-edutech-media-552357225071 \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

Chặn public hoàn toàn rồi phát video qua **presigned URL** có hạn — đó cũng đúng
là thứ bạn cần cho nội dung trả phí: người chưa mua khóa học không được xem, kể
cả khi họ có đường dẫn.

### 🟡 V6 — Ba điểm nhỏ, biết để không mắc lại

**Private subnet không có đường ra Internet.** `rtb-00ca71124f6643a63` không có
tuyến `0.0.0.0/0` và không gắn subnet nào — đó là main route table, nơi hai
private subnet rơi về. Hiện chỉ RDS nằm đó và RDS không cần Internet, nên không
sao. Nhưng **đừng chuyển EC2 vào private subnet cho "đúng chuẩn"** khi chưa dựng
NAT Gateway: container sẽ không kéo được image, và triệu chứng là `docker pull`
treo chứ không báo lỗi mạng. NAT Gateway tốn khoảng $0.045/giờ (~$32/tháng)
cộng phí dữ liệu — với quy mô này, SSM Session Manager (V4) đạt cùng mục tiêu
bảo mật mà không tốn gì.

**Lệch AZ.** Ba EC2 ở `ap-northeast-1a`, RDS ở `ap-northeast-1c`. Lưu lượng
cross-AZ tính tiền hai chiều và thêm khoảng 1ms mỗi lượt. Không đáng sửa ngay,
nhưng nếu tạo lại RDS (V3) thì đặt ở `1a`.

**260GB EBS đang tính tiền dù máy tắt.** gp3 ở Tokyo khoảng $0.096/GB-tháng →
**~$25/tháng cho đĩa của ba máy đã tắt**. Riêng 150GB trên GPU #1 là để cache mô
hình; nếu chuyển sang mô hình ~9B (~6GB) thì 150GB là quá thừa. EBS **không thu
nhỏ được** — muốn giảm phải tạo volume mới nhỏ hơn rồi chép sang.

---

## 3. Trình tự triển khai

Nguyên tắc xuyên suốt: **bật từng tầng một, mỗi tầng xanh mới sang tầng sau, và
để tầng đắt nhất ở cuối cùng.**

Điểm mấu chốt mà thứ tự cũ bỏ lỡ: theo `llm_provider.py`, mặc định là Gemini đi
trước. Nghĩa là **toàn bộ hệ thống chạy đầy đủ khi GPU #1 vẫn đang tắt.** Vậy
hãy để nó tắt suốt quá trình gỡ rối — vừa tiết kiệm $1/giờ, vừa bớt một biến số
khi có gì đó hỏng.

### Giai đoạn 0 — Vá, khi mọi thứ còn đang tắt (~30 phút, $0)

- [ ] Gỡ `0.0.0.0/0` khỏi cổng 22 → V1
- [ ] Tạo IAM role + instance profile, gắn cho cả ba máy → V4
- [ ] Gửi đơn nâng hạn mức G lên 16 vCPU → V2 *(gửi sớm vì phải chờ)*
- [ ] Tạo S3 bucket → V5
- [ ] Quyết định về RDS (giữ Express hay đổi Web) → V3
- [ ] Thu hồi 3 khóa đã lộ trong lịch sử Git — mục 1 của `HUONG_DAN_TRIEN_KHAI_3_MAY.md`

> Bước cuối chưa ai làm và nó không tự hết hạn. Xóa khỏi mã nguồn là không đủ:
> ai clone repo về đều đọc được commit cũ.

### Giai đoạn 1 — Cơ sở dữ liệu (~40 phút)

```bash
aws rds start-db-instance --region ap-northeast-1 --profile edutech-devops \
  --db-instance-identifier edutech-db-instance
```

RDS mất 5–10 phút mới `available`. Trong lúc chờ, khởi động CPU EC2:

```bash
aws ec2 start-instances --region ap-northeast-1 --profile edutech-devops \
  --instance-ids i-01f5c3c164c11042e
```

- [ ] SSH vào CPU EC2 (hoặc `aws ssm start-session --target i-01f5c3c164c11042e`)
- [ ] `git pull` để lấy `scripts/02-chay-migration.sh` bản đã sửa
- [ ] Tạo `3t-edu-tech-backend/.env.production` với `DB_HOST` là endpoint RDS
- [ ] `sudo bash scripts/02-chay-migration.sh`

Script bản mới tách bốn phép thử: DNS → TCP → dò ảnh Docker → đăng nhập. Nếu
bước TCP báo MỞ thì mạng đã đúng, mọi lỗi sau đó là lỗi khác. **Chạy từ EC2,
không phải từ máy ở nhà** — RDS không public, từ ngoài VPC sẽ luôn thất bại.

- [ ] Nghiệm thu: `flyway_schema_history` có bản ghi, `SoBang` > 0

### Giai đoạn 2 — Ứng dụng web (~1 giờ)

- [ ] `docker compose -f docker-compose.cpu-ec2.yml up -d`
- [ ] `curl -s http://localhost/v1/categories | head -c 200`
- [ ] Trỏ tên miền về `18.178.30.57` *(kiểm kê không thấy hosted zone Route53 —
      tên miền của bạn đang quản ở đâu?)*
- [ ] `sudo bash scripts/03-bat-https.sh`
- [ ] Nghiệm thu: `https://<tên-miền>/v1/categories` trả JSON, khóa ổ xanh

**Đặt `LLM_PROVIDER=gemini`** ở giai đoạn này, chưa phải `auto`. Hệ thống chạy
hoàn chỉnh mà không cần máy GPU nào.

### Giai đoạn 3 — AI Service, vẫn chưa bật GPU #1 (~1 giờ, $0.53/h)

```bash
aws ec2 start-instances --region ap-northeast-1 --profile edutech-devops \
  --instance-ids i-0f6bcd18bd2c0f4eb
```

- [ ] Build image kèm `--build-arg INSTALL_EXTRAS="whisper,gpu"`
- [ ] `.env.production` với `LLM_PROVIDER=gemini`, `WHISPER_MODEL_SIZE=large-v3`
- [ ] `curl -s http://localhost:2111/health | python3 -m json.tool`
- [ ] Nạp dữ liệu RAG: `POST /api/ingest/courses`
- [ ] Nghiệm thu: `collections` > 0, `whisper.available: true`, chatbot trả lời
      có trích dẫn nguồn

> **Nạp RAG xong ở bước này, đừng để tới sát ngày demo.** Embedding đi qua
> `gemini-embedding` và **không có đường lùi** — vLLM chỉ phục vụ mô hình sinh
> văn bản. Nếu hạn mức embedding cạn đúng hôm demo, chatbot vẫn trả lời nhưng
> không tìm được tài liệu, câu trả lời sẽ chung chung và không dẫn nguồn. Dữ
> liệu đã nạp rồi thì hôm đó không cần gọi embedding nữa.

### Giai đoạn 4 — vLLM, tầng cuối cùng (~1 giờ, +$1.00/h)

Đây là lúc dùng `vllm-server/docker-compose.yml` bản đã sửa.

- [ ] Xác minh repo mô hình là bản **text-only**, không phải VL:
      `curl -s https://huggingface.co/${MODEL}/raw/main/config.json | grep -iE 'architectures|vision|quant'`
- [ ] Tạo `vllm-server/.env` theo cấu hình A ở cuối tệp compose
- [ ] `docker compose up -d && docker compose logs -f`
- [ ] Nghiệm thu tại chỗ: `curl -s localhost:8000/v1/models -H "Authorization: Bearer $VLLM_API_KEY"`
- [ ] Trên GPU #2: đổi `VLLM_BASE_URL` sang `http://10.0.1.114:8000/v1`, đổi
      `LLM_PROVIDER=auto`, restart
- [ ] Nghiệm thu đầu-cuối: đặt tạm `LLM_PROVIDER=qwen`, chat một câu, xác nhận
      trả lời tới từ vLLM, rồi đổi lại `auto`

> Bước cuối quan trọng hơn vẻ ngoài của nó. Với `auto`, Gemini luôn trả lời
> trước, nên **vLLM có thể hỏng hoàn toàn mà không ai biết** — đúng cái bẫy mà
> `HUONG_DAN_TRIEN_KHAI_3_MAY.md` đã cảnh báo với `VLLM_BASE_URL=127.0.0.1`.
> Ép `qwen` một lần là cách duy nhất chứng minh đường đi đó còn sống.

---

## 4. Nghiệm thu cuối — chạy từ máy bạn

```bash
# Backend sống
curl -s https://<ten-mien>/v1/categories | head -c 200

# AI Service KHÔNG được lộ ra Internet (phải timeout)
curl -m 5 http://<ip-public-gpu2>:2111/health ; echo "^ phải LỖI mới đúng"

# vLLM KHÔNG được lộ ra Internet (phải timeout)
curl -m 5 http://<ip-public-gpu1>:8000/v1/models ; echo "^ phải LỖI mới đúng"

# SSH đã đóng với người lạ
nmap -Pn -p 22 18.178.30.57      # phải là filtered, không phải open

# Bộ test tích hợp
cd 3t-edu-tech-backend && npm run test:smoke && npm run test:security
```

---

## 5. Kỷ luật chi phí

Ba máy chạy 24/7 là khoảng **$37/ngày**. Đồ án không cần thế.

| Trạng thái | ~USD/ngày |
|---|---|
| Tất cả tắt (chỉ EBS + EIP) | ~$1 |
| CPU + GPU #2 (không có vLLM) | ~$14 |
| Cả ba máy | ~$37 |

Giai đoạn 1–3 chỉ cần cột giữa. Chỉ bật GPU #1 khi thật sự đang thử vLLM hoặc
đang demo.

```bash
# Tắt hết cuối ngày
aws ec2 stop-instances --region ap-northeast-1 --profile edutech-devops \
  --instance-ids i-01f5c3c164c11042e i-0f8ac78807132b82d i-0f6bcd18bd2c0f4eb
aws rds stop-db-instance --region ap-northeast-1 --profile edutech-devops \
  --db-instance-identifier edutech-db-instance
```

Hai điều cần biết về việc tắt:

- **RDS tự bật lại sau 7 ngày.** AWS không cho dừng vô hạn. Đặt lịch nhắc, hoặc
  chấp nhận và tắt lại.
- **IP public đổi sau mỗi lần start** với hai máy GPU (chúng không có EIP). IP
  **private** thì giữ nguyên — và đó mới là thứ ba máy dùng để gọi nhau, nên
  `VLLM_BASE_URL=http://10.0.1.114:8000/v1` không bao giờ phải sửa.

Đặt cảnh báo ngân sách để không bị bất ngờ:

```bash
aws budgets create-budget --profile edutech-devops --account-id 552357225071 \
  --budget '{"BudgetName":"3t-edutech-thang","BudgetLimit":{"Amount":"100","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}'
```

---

## 6. Việc còn treo, cần bạn quyết

1. **Tên miền đang ở đâu?** Kiểm kê không thấy hosted zone Route53 nào. Không có
   tên miền thì `03-bat-https.sh` (Let's Encrypt) không chạy được — Let's Encrypt
   không cấp chứng chỉ cho địa chỉ IP.
2. **RDS: giữ Express hay đổi sang Web?** Quyết trước giai đoạn 1, vì đổi sau là
   chạy lại migration.
3. **Bật mã hóa RDS bây giờ hay chấp nhận không mã hóa?** Bây giờ là 20 phút;
   sau khi có dữ liệu là một lần downtime.
4. **Có xin nâng hạn mức G không?** Nếu định thử `g6.2xlarge` hoặc chạy ba máy
   GPU thì phải xin, và phải xin sớm.
