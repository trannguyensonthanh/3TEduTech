# Triển khai 3T EduTech lên AWS

**Vùng:** `ap-northeast-1` (Tokyo) · **Hiện trạng:** RDS và EC2 đã tạo và đang
chạy, chưa cài Docker, chưa có biến môi trường.

Tài liệu này đi từ trạng thái đó tới một hệ thống chạy thật, có HTTPS và CI/CD
tự động. Phần cuối là kế hoạch chuyển sang ba máy khi xin được quota GPU.

Mọi lệnh đều chép–dán được. Chỗ nào cần thay giá trị đều viết hoa dạng
`DOI-THANH-...` để không lẫn.

---

## Mục lục

| Phần | Nội dung | Thời gian |
|------|----------|-----------|
| [0](#phần-0--bức-tranh-tổng-thể) | Bức tranh tổng thể | đọc 5 phút |
| [1](#phần-1--làm-trước-tiên-thu-hồi-ba-khóa-đã-lộ) | ⚠️ Thu hồi ba khóa đã lộ trong Git | 30 phút |
| [2](#phần-2--nối-mạng-giữa-ec2-và-rds) | Nối mạng EC2 ↔ RDS | 20 phút |
| [3](#phần-3--cài-đặt-máy-chủ) | Cài đặt máy chủ | 15 phút |
| [4](#phần-4--biến-môi-trường-và-github-secrets) | Biến môi trường + GitHub Secrets | 45 phút |
| [5](#phần-5--migration-cơ-sở-dữ-liệu) | Migration cơ sở dữ liệu | 20 phút |
| [6](#phần-6--deploy-lần-đầu-và-bật-cicd) | Deploy lần đầu + bật CI/CD | 30 phút |
| [7](#phần-7--tên-miền-miễn-phí-và-https) | Tên miền miễn phí + HTTPS | 30 phút |
| [8](#phần-8--giai-đoạn-2-khi-có-hai-máy-gpu) | Giai đoạn 2 — hai máy GPU | sau này |
| [9](#phần-9--vận-hành-thường-ngày) | Vận hành thường ngày | tham khảo |
| [10](#phần-10--xử-lý-sự-cố) | Xử lý sự cố | tham khảo |

---

## Phần 0 — Bức tranh tổng thể

### Giai đoạn 1 (bây giờ): một EC2 + RDS

```
                    Internet
                       │
              ┌────────┴────────┐
              │  cổng 80 / 443  │
     ┌────────┴─────────────────────────────┐
     │  EC2 CPU  (t3.medium, 4GB)           │
     │                                      │
     │  ┌──────────┐  Nginx + React SPA     │
     │  │ frontend │  256MB                 │
     │  └────┬─────┘                        │
     │       │ mạng nội bộ Docker           │
     │  ┌────┴─────┐  ┌────────────┐        │
     │  │ backend  │──│ ai-service │        │
     │  │ 1024MB   │  │ 1024MB     │        │
     │  └────┬─────┘  │ Gemini-only│        │
     │       │        └────────────┘        │
     │  ┌────┴─────┐                        │
     │  │  redis   │  512MB                 │
     │  └──────────┘                        │
     └───────────────┬──────────────────────┘
                     │ cổng 1433, trong VPC
              ┌──────┴──────┐
              │ RDS SQL Srv │
              └─────────────┘
```

AI Service chạy chung máy vì ở chế độ chỉ-Gemini nó chỉ là một tiến trình
FastAPI gọi API bên ngoài — khoảng 700MB, không có mô hình nào nạp vào RAM.
Cổng 2111 **chỉ bind loopback**, nên không phải mở gì trên Security Group.

Tổng trần bộ nhớ bốn container: 2816MB trên máy 4GB. Phần 3 bật thêm 2GB swap
làm lưới an toàn cho lúc cả bốn cùng khởi động.

### Giai đoạn 2 (sau khi có quota GPU): ba máy

```
  EC2 CPU                GPU #1 (vLLM/Qwen)      GPU #2 (AI Service + Whisper)
  frontend               g4dn.xlarge             g4dn.xlarge
  backend    ──────────────────────────────────► ai-service :2111
  redis                        ▲                      │
     │                         └──────────────────────┘
     ▼                              cổng 8000
  RDS SQL Server
```

Chuyển đổi **không sửa một dòng YAML nào** — chỉ đổi `AI_SERVICE_URL` trong
`.env` trên máy CPU. Xem [Phần 8](#phần-8--giai-đoạn-2-khi-có-hai-máy-gpu).

### Những tệp bạn sẽ dùng

| Tệp | Vai trò |
|-----|---------|
| `docker-compose.cpu-ec2.yml` | Ngăn xếp cho máy CPU (4 service) |
| `docker-compose.gpu-ec2-ai.yml` | AI Service trên máy GPU #2 |
| `vllm-server/docker-compose.yml` | vLLM trên máy GPU #1 |
| `scripts/01-cai-dat-server.sh` | Cài Docker, swap, certbot |
| `scripts/02-chay-migration.sh` | Chạy Flyway lên RDS |
| `scripts/03-bat-https.sh` | Xin chứng chỉ + bật HTTPS |
| `ci-cd/deploy.yml` | **Chép đè lên** `.github/workflows/deploy.yml` |
| `ci-cd/mau-bien-moi-truong-*.txt` | Mẫu nội dung cho GitHub Secrets |
| `nginx/conf.d/` | Cấu hình Nginx (mount cả thư mục) |

---

## Phần 1 — ⚠️ LÀM TRƯỚC TIÊN: thu hồi ba khóa đã lộ

**Đừng bỏ qua phần này và đừng để dành làm sau.** Ngay khi hệ thống có địa chỉ
công khai, các khóa đang nằm trong lịch sử Git trở thành thứ dùng được thật.

### Vấn đề

Ba khóa từng được ghi cứng trong mã nguồn frontend:

- `MASTER_API_KEY`
- `COURSE_AI_API_KEY`
- Khóa YouTube Data API (dạng `AIzaSy...`)

Tôi đã kiểm tra kho Git của bạn: chúng xuất hiện trong **7 commit** trên nhánh
hiện tại. Tự kiểm chứng:

```bash
git log -S"AIzaSy" --oneline --all
```

**Xóa khỏi mã nguồn hiện tại là chưa đủ.** Git lưu toàn bộ lịch sử; bất kỳ ai
clone kho về đều đọc được nội dung của mọi commit cũ. Nếu kho từng ở chế độ
public, phải coi như các khóa đó đã bị lộ hoàn toàn.

Riêng khóa YouTube nghiêm trọng hơn hai khóa kia: nó nằm trong bundle JavaScript
gửi xuống trình duyệt, nên ai mở DevTools cũng đọc được — không cần đụng tới Git.

### Cách xử lý

**1. Thu hồi và tạo mới ở từng nơi:**

| Khóa | Nơi thu hồi |
|------|-------------|
| YouTube Data API | Google Cloud Console → APIs & Services → Credentials → xóa khóa cũ, tạo khóa mới |
| Gemini | Google AI Studio → API Keys → thu hồi, tạo mới |
| `MASTER_API_KEY` / `COURSE_AI_API_KEY` | Không còn dùng nữa — kiến trúc Level 3 đã bỏ hẳn. Chỉ cần chắc chắn không còn tham chiếu nào trong mã. |

**2. Giới hạn khóa YouTube mới** (Google Cloud Console → khóa → Application
restrictions). Chọn *HTTP referrers* và điền tên miền của bạn. Khóa mới rồi
vẫn nằm trong bundle trình duyệt — giới hạn referrer khiến nó chỉ dùng được từ
trang của bạn.

> Tốt hơn nữa là chuyển lời gọi YouTube về backend để khóa không bao giờ rời
> máy chủ. Không bắt buộc cho đồ án, nhưng nếu có thời gian thì đây là chỗ đáng
> sửa.

**3. Đặt hạn mức chi tiêu** cho mọi khóa Google (Cloud Console → Billing →
Budgets & alerts). Đây là phanh cuối cùng nếu khóa vẫn bị lạm dụng.

**4. Sinh khóa mới cho hệ thống:**

```bash
# JWT_SECRET
openssl rand -base64 48

# CERTIFICATE_SECRET
openssl rand -hex 32

# AI_SERVICE_INTERNAL_KEY  (và INTERNAL_API_KEY — dùng CÙNG một giá trị)
openssl rand -hex 24

# REDIS_PASSWORD
openssl rand -hex 20
```

> ⚠️ Hai khóa đang dùng ở môi trường dev (`WLBCDkZLaIrdhdFiliKt0p8FDcZahFJm` và
> `MKLnr2dNrhhJ6RjQrQzQ20F5WRHo1huS`) đã xuất hiện trong hội thoại này, nên coi
> như đã lộ. **Đừng mang chúng lên production.**

**5. Không viết lại lịch sử Git.** Về lý thuyết `git filter-repo` xóa được khóa
khỏi lịch sử, nhưng nó đổi mọi mã băm commit và phá kho của mọi người đang
clone. Với một đồ án thì thu hồi khóa là đủ và an toàn hơn — khóa đã thu hồi
thì có đọc được cũng vô dụng.

---

## Phần 2 — Nối mạng giữa EC2 và RDS

### 2.1. Cài AWS CLI trên máy bạn

Bạn đã tải `awscliv2.zip` về thư mục dự án. Trên Windows tải bộ cài `.msi` từ
trang chính thức của AWS thì tiện hơn.

```powershell
aws --version
aws configure
#   AWS Access Key ID     : ...
#   AWS Secret Access Key : ...
#   Default region name   : ap-northeast-1
#   Default output format : json
```

### 2.2. Ghi lại thông tin hai tài nguyên đã có

```bash
# --- EC2 ---
aws ec2 describe-instances \
  --region ap-northeast-1 \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].{
      Id:InstanceId, Loai:InstanceType, IPCong:PublicIpAddress,
      IPNoiBo:PrivateIpAddress, VPC:VpcId,
      SG:SecurityGroups[0].GroupId, Ten:Tags[?Key==`Name`]|[0].Value}' \
  --output table

# --- RDS ---
aws rds describe-db-instances \
  --region ap-northeast-1 \
  --query 'DBInstances[].{
      Ten:DBInstanceIdentifier, Engine:Engine, Loai:DBInstanceClass,
      Endpoint:Endpoint.Address, Cong:Endpoint.Port,
      VPC:DBSubnetGroup.VpcId, SG:VpcSecurityGroups[0].VpcSecurityGroupId,
      CongKhai:PubliclyAccessible, TrangThai:DBInstanceStatus}' \
  --output table
```

Chép sáu giá trị ra một chỗ — dùng suốt phần còn lại:

```
EC2_ID=i-xxxxxxxxxxxx
EC2_IP_CONG=xx.xx.xx.xx
EC2_SG=sg-xxxxxxxxxxxx
RDS_ENDPOINT=xxx.xxxxxxxx.ap-northeast-1.rds.amazonaws.com
RDS_SG=sg-yyyyyyyyyyyy
VPC_ID=vpc-xxxxxxxx
```

> **Kiểm tra ngay: hai `VPC` có giống nhau không?**
> Khác VPC thì EC2 không thể nối tới RDS qua mạng riêng, và phải làm VPC
> peering — phức tạp hơn nhiều. Nếu lỡ khác, cách nhanh nhất là **tạo lại RDS**
> trong đúng VPC của EC2 (dữ liệu chưa có gì nên không mất mát).

### 2.3. Cho EC2 nối tới RDS

```bash
aws ec2 authorize-security-group-ingress \
  --region ap-northeast-1 \
  --group-id $RDS_SG \
  --protocol tcp --port 1433 \
  --source-group $EC2_SG
```

`--source-group` chứ **không phải** `--cidr 0.0.0.0/0`. Đây là điểm quan trọng
nhất của cả phần này:

- Với `--source-group`, chỉ máy nào nằm trong security group của EC2 mới nối
  được. Đổi IP của EC2 cũng không ảnh hưởng gì.
- Với `0.0.0.0/0`, RDS của bạn mở ra toàn Internet. Có robot quét cổng 1433
  liên tục và thử mật khẩu phổ biến. Kể cả khi `PubliclyAccessible=false`, đừng
  bao giờ đặt như vậy.

Nếu lỡ mở rồi, đóng lại:

```bash
aws ec2 revoke-security-group-ingress \
  --region ap-northeast-1 --group-id $RDS_SG \
  --protocol tcp --port 1433 --cidr 0.0.0.0/0
```

### 2.4. Mở cổng cho EC2

```bash
# HTTP — PHẢI mở cho 0.0.0.0/0.
# Let's Encrypt xác thực tên miền từ nhiều địa điểm trên thế giới, nên không
# giới hạn nguồn được. Đây cũng là cổng chuyển hướng sang HTTPS sau này.
aws ec2 authorize-security-group-ingress --region ap-northeast-1 \
  --group-id $EC2_SG --protocol tcp --port 80 --cidr 0.0.0.0/0

# HTTPS
aws ec2 authorize-security-group-ingress --region ap-northeast-1 \
  --group-id $EC2_SG --protocol tcp --port 443 --cidr 0.0.0.0/0

# SSH — CHỈ từ IP của bạn, không phải 0.0.0.0/0
IP_CUA_TOI=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress --region ap-northeast-1 \
  --group-id $EC2_SG --protocol tcp --port 22 --cidr ${IP_CUA_TOI}/32
```

> **Về SSH và CI/CD:** GitHub Actions chạy trên dải IP rất rộng và thay đổi
> liên tục, nên không giới hạn nguồn theo IP được. Ba lựa chọn:
>
> 1. **Mở cổng 22 cho `0.0.0.0/0`** — đơn giản nhất, và chấp nhận được **nếu**
>    đã tắt đăng nhập bằng mật khẩu (chỉ dùng khóa SSH). Ubuntu trên AWS mặc
>    định đã tắt sẵn. Đây là lựa chọn thực tế cho đồ án.
> 2. Dùng AWS Systems Manager Session Manager — không cần mở cổng 22 chút nào,
>    nhưng phải đổi cách CI/CD kết nối.
> 3. Cập nhật security group từ chính workflow trước mỗi lần deploy — thêm
>    nhiều phần chuyển động.
>
> Nếu chọn (1), chạy: `aws ec2 authorize-security-group-ingress --region
> ap-northeast-1 --group-id $EC2_SG --protocol tcp --port 22 --cidr 0.0.0.0/0`

**⚠️ Cổng 2111 và 6379 KHÔNG mở.** Ở giai đoạn 1, AI Service và Redis chỉ bind
loopback trong `docker-compose.cpu-ec2.yml`. Mở chúng ra ngoài chỉ tạo thêm bề
mặt tấn công — mà AI Service thì tiêu tiền token Gemini thật.

Kiểm tra lại:

```bash
aws ec2 describe-security-groups --region ap-northeast-1 --group-ids $EC2_SG \
  --query 'SecurityGroups[].IpPermissions[].{Cong:FromPort,Nguon:IpRanges[].CidrIp,SG:UserIdGroupPairs[].GroupId}' \
  --output table
```

### 2.5. Kiểm tra dung lượng ổ

```bash
aws ec2 describe-volumes --region ap-northeast-1 \
  --filters "Name=attachment.instance-id,Values=$EC2_ID" \
  --query 'Volumes[].{GB:Size,Loai:VolumeType}' --output table
```

Cần **tối thiểu 30GB**. Ước tính chỗ dùng: ảnh Docker ~2.5GB, ChromaDB vài trăm
MB, thư mục tạm nhập khóa học tới 500MB mỗi lần, log 45MB, swap 2GB, hệ điều
hành ~4GB. Dưới 20GB là sẽ chạm trần khi tải một khóa học lớn — và ổ đầy trên
EC2 nghĩa là Docker không ghi được log, Redis không lưu được RDB, hỏng lan ra
toàn hệ thống.

Nới rộng (không cần tắt máy):

```bash
aws ec2 modify-volume --region ap-northeast-1 --volume-id vol-xxxx --size 30
# Sau đó SSH vào máy và nới hệ tệp:
#   sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1
```

---

## Phần 3 — Cài đặt máy chủ

```bash
ssh -i duong-dan-toi-khoa.pem ubuntu@$EC2_IP_CONG
```

> Windows: `icacls khoa.pem /inheritance:r /grant:r "%USERNAME%:R"` nếu SSH báo
> quyền tệp quá rộng.

Chép ba script lên máy chủ rồi chạy cái đầu tiên:

```bash
# Trên MÁY BẠN
scp -i khoa.pem -r scripts ubuntu@$EC2_IP_CONG:/tmp/

# Trên MÁY CHỦ
sudo bash /tmp/scripts/01-cai-dat-server.sh
```

Script làm sáu việc: cài Docker Engine + Compose plugin từ kho chính thức, cho
user `ubuntu` chạy docker không cần sudo, tạo `/opt/3t-edu-tech`, bật 2GB swap,
giới hạn log Docker, và cài certbot.

**Sau khi xong, bắt buộc thoát và đăng nhập lại** — quyền nhóm `docker` chỉ có
hiệu lực ở phiên đăng nhập mới:

```bash
exit
ssh -i khoa.pem ubuntu@$EC2_IP_CONG

docker run --rm hello-world     # phải chạy được, KHÔNG cần sudo
docker compose version
free -h                          # phải thấy 2.0Gi swap
```

> Nếu `docker run` báo "permission denied ... docker.sock" thì bạn chưa đăng
> nhập lại. Bước deploy của CI/CD cũng cần điều này, nên đừng bỏ qua.

---

## Phần 4 — Biến môi trường và GitHub Secrets

### 4.1. Vì sao đưa cả tệp `.env` vào một secret

Cách làm ở đây: **toàn bộ nội dung `.env.production` nằm trong một secret duy
nhất**, và CI/CD ghi nó ra máy chủ ở mỗi lần deploy.

- Không chép `.env.production` từ Git — nó chứa khóa thanh toán, khóa Gemini,
  mật khẩu CSDL. Những thứ đó không được nằm trong kho mã nguồn.
- Không tạo tay một lần trên máy chủ rồi thôi — máy chủ dựng lại (đổi instance,
  khôi phục snapshot) là mất, và sáu tháng sau không ai nhớ đã đặt những gì.

Hai tệp mẫu đã viết sẵn, kèm giải thích từng biến:

- `ci-cd/mau-bien-moi-truong-backend.txt`
- `ci-cd/mau-bien-moi-truong-ai-service.txt`

> **Ba biến mà `.env.production` hiện tại của bạn đang thiếu:**
> `AI_SERVICE_INTERNAL_KEY`, `INTERNAL_API_KEY`, `CERTIFICATE_SECRET`.
>
> Hai biến đầu đặc biệt đáng chú ý: AI Service được thiết kế "chưa đặt khóa thì
> không kiểm tra" để tránh làm chết hệ thống khi ai đó quên biến môi trường.
> Nghĩa là thiếu chúng **không gây lỗi nào** — nó chỉ lặng lẽ tắt lớp xác thực.

### 4.2. Tạo khóa SSH riêng cho CI/CD

Đừng dùng lại khóa `.pem` cá nhân của bạn. Khóa riêng cho CI/CD thì thu hồi
được độc lập nếu kho GitHub bị lộ.

```bash
# Trên MÁY CHỦ
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# In khóa RIÊNG — chép toàn bộ, kể cả hai dòng BEGIN/END
cat ~/.ssh/github_actions
```

### 4.3. Danh sách Secrets

GitHub → repo → **Settings → Secrets and variables → Actions → Secrets**:

| Tên | Giá trị |
|-----|---------|
| `DOCKER_USERNAME` | Tên đăng nhập Docker Hub |
| `DOCKER_PASSWORD` | **Access Token** của Docker Hub, không phải mật khẩu |
| `SERVER_HOST` | IP công cộng của EC2 |
| `SERVER_USER` | `ubuntu` |
| `SERVER_SSH_KEY` | Toàn bộ khóa riêng ở bước 4.2 |
| `REDIS_PASSWORD` | Chuỗi từ `openssl rand -hex 20` |
| `VITE_API_URL` | `http://<ip-ec2>/v1` — đổi thành `https://<ten-mien>/v1` ở Phần 7 |
| `VITE_AI_API_URL` | `http://<ip-ec2>/v1/ai` |
| `BACKEND_ENV_PRODUCTION` | Toàn bộ nội dung tệp mẫu backend |
| `AI_ENV_PRODUCTION` | Toàn bộ nội dung tệp mẫu AI Service |

Tab **Variables** (không phải Secrets):

| Tên | Giá trị | Ý nghĩa |
|-----|---------|---------|
| `DEPLOY_ENABLED` | `false` lúc đầu, `true` sau khi deploy tay thành công | Cầu dao an toàn |
| `CO_GPU` | `false` | Bật ở giai đoạn 2 |

> **`VITE_API_URL` là biến LÚC BUILD, không phải lúc chạy.** Vite nhúng thẳng
> giá trị vào bundle JavaScript. Đổi nó thì **phải build lại ảnh frontend** —
> sửa biến môi trường trên máy chủ không có tác dụng gì cả. Đây là khác biệt căn
> bản so với backend và là chỗ hay mất thời gian nhất khi chuyển từ IP sang tên
> miền.

### 4.4. Ba giá trị phải trùng khớp

Đây là ba cặp giá trị mà nếu lệch nhau, hệ thống **vẫn báo healthy** nhưng chức
năng chết âm thầm:

| Giá trị | Nơi 1 | Nơi 2 |
|---------|-------|-------|
| Khóa nội bộ | `AI_SERVICE_INTERNAL_KEY` (backend) | `INTERNAL_API_KEY` (ai-service) |
| Mật khẩu Redis | secret `REDIS_PASSWORD` | `REDIS_URL` trong env backend |
| Mật khẩu RDS | `DB_PASSWORD` trong env backend | mật khẩu master của RDS |

Khóa nội bộ lệch → backend nhận 401 ở mọi lời gọi AI → chatbot im lặng, RAG
không đồng bộ, mà cả hai dịch vụ đều xanh. Đúng kiểu lỗi đã mất nhiều giờ để
lần ra khi làm việc với Flyway trước đây.

---

## Phần 5 — Migration cơ sở dữ liệu

### 5.1. Vì sao cần bước riêng

`docker-compose.cpu-ec2.yml` **không có** service `database-init` (khác hẳn bản
dev), và workflow cũ cũng không chạy Flyway ở đâu cả. Nghĩa là lược đồ trên RDS
sẽ không bao giờ được cập nhật: thêm migration, deploy thành công, container
xanh hết — rồi backend đổ lúc chạy với `Invalid object name`.

### 5.2. RDS không chạy được `V1__init.sql` nguyên bản

`V1__init.sql` được kết xuất từ SQL Server trên máy cá nhân, nên chứa hàng loạt
lệnh cấu hình cấp instance mà RDS cố tình chặn — tài khoản master của RDS không
phải `sysadmin`:

```
EXEC sp_fulltext_database                     → cần sysadmin
ALTER DATABASE ... SET RECOVERY FULL          → RDS tự quản lý mô hình phục hồi
ALTER DATABASE ... SET TRUSTWORTHY            → bị chặn (rủi ro leo thang quyền)
ALTER DATABASE ... SET FILESTREAM             → RDS không hỗ trợ
ALTER DATABASE ... SET DISABLE_BROKER         → bị chặn
ALTER DATABASE ... SET TARGET_RECOVERY_TIME   → bị chặn
ALTER DATABASE ... SET MULTI_USER / READ_WRITE → bị chặn
```

Không lệnh nào trong số đó ảnh hưởng tới ứng dụng — chúng chỉ là phần "kết xuất
đầy đủ" mà SSMS luôn sinh ra.

`scripts/02-chay-migration.sh` **tự lọc bỏ chúng vào một bản sao tạm** và không
đụng tới `db-init/V1__init.sql` gốc (bản gốc vẫn cần nguyên vẹn cho SQL Server
chạy trong Docker ở máy dev). Tôi đã chạy thử bộ lọc trên tệp thật của bạn:
**14 lệnh bị loại, toàn bộ 744 câu `INSERT` giữ nguyên.**

### 5.3. Chạy

```bash
# Trên MÁY BẠN — chép db-init và scripts lên
scp -i khoa.pem -r db-init scripts ubuntu@$EC2_IP_CONG:/opt/3t-edu-tech/

# Trên MÁY CHỦ — cần .env.production của backend đã tồn tại
# (script đọc thông tin kết nối từ đó, không có mật khẩu nào nằm trong script)
cd /opt/3t-edu-tech
sudo bash scripts/02-chay-migration.sh
```

Script chạy năm bước: đọc cấu hình, thử kết nối RDS, tạo CSDL nếu chưa có, lọc
SQL cho tương thích RDS, rồi chạy Flyway. Cuối cùng in số bảng đã tạo và 5 dòng
mới nhất trong `flyway_schema_history`.

> **Ở production không có `repair`** — khác hẳn `docker-compose.dev.yml`.
> `repair` âm thầm chấp nhận một migration đã bị sửa sau khi chạy, đúng thứ mà
> Flyway sinh ra để ngăn chặn. Nếu Flyway dừng vì "Detected failed migration",
> hãy đọc lỗi rồi xử lý tay chứ đừng thêm `repair` vào.

Từ lần sau, CI/CD tự chạy bước này trước mỗi lần deploy.

> **Thứ tự có chủ ý:** migration chạy **trước** khi ảnh backend mới lên. Nếu
> đảo lại, sẽ có một khoảng mã nguồn mới chạy trên lược đồ cũ và đổ với "Invalid
> column name" cho mọi request. Với migration chỉ THÊM (thêm bảng, thêm cột cho
> phép NULL) thì chạy trước là an toàn tuyệt đối — mã cũ không biết tới thứ mới
> nên không bị ảnh hưởng.
>
> ⚠️ Với migration **xóa** hoặc **đổi tên** cột thì không thứ tự nào an toàn cả.
> Phải làm hai bước qua hai lần deploy: thêm cột mới → deploy mã dùng cột mới →
> lần deploy sau mới xóa cột cũ.

---

## Phần 6 — Deploy lần đầu và bật CI/CD

### 6.1. Cập nhật workflow

```powershell
# Trên máy bạn, trong thư mục dự án
copy ci-cd\deploy.yml .github\workflows\deploy.yml
git add .github/workflows/deploy.yml nginx/ scripts/ docker-compose.cpu-ec2.yml db-init/
git commit -m "ci: sửa tag ảnh AI Service, thêm bước migration và kiểm tra sau deploy"
git push
```

Với `DEPLOY_ENABLED` đang là `false`, lần push này chỉ chạy CI và đóng gói ảnh —
chưa động tới máy chủ. Đó là chủ ý: xác nhận ảnh build được trước đã.

Vào tab **Actions** xem ba job CI và job `dockerize` chạy xong.

### 6.2. Deploy tay một lần

Deploy tay lần đầu để nếu có gì sai thì bạn nhìn thấy trực tiếp, thay vì đọc log
CI.

```bash
# Trên MÁY CHỦ
cd /opt/3t-edu-tech

# Chép cấu hình lên (từ máy bạn)
#   scp -i khoa.pem docker-compose.cpu-ec2.yml ubuntu@$EC2_IP_CONG:/opt/3t-edu-tech/
#   scp -i khoa.pem -r nginx ubuntu@$EC2_IP_CONG:/opt/3t-edu-tech/

# Tạo .env cho Compose
umask 077
cat > .env <<'EOF'
DOCKER_USERNAME=ten-docker-hub-cua-ban
REDIS_PASSWORD=mat-khau-redis-vua-sinh
AI_IMAGE_TAG=cpu
EOF

# Tạo hai tệp môi trường (chép từ mẫu, điền giá trị thật)
mkdir -p 3t-edu-tech-backend ai-service
nano 3t-edu-tech-backend/.env.production
nano ai-service/.env.production
chmod 600 3t-edu-tech-backend/.env.production ai-service/.env.production

# Kéo và chạy
docker compose -f docker-compose.cpu-ec2.yml pull
docker compose -f docker-compose.cpu-ec2.yml up -d

# Theo dõi
docker compose -f docker-compose.cpu-ec2.yml ps
docker compose -f docker-compose.cpu-ec2.yml logs -f
```

### 6.3. Kiểm tra từng lớp

```bash
# Nginx
curl -i http://localhost/nginx-health          # phải là 200 "ok"

# Backend — GET /v1/ kiểm tra sâu cả SQL Server lẫn Redis
curl -s http://localhost:5000/v1/ | head -20

# AI Service
curl -s http://localhost:2111/health

# Backend gọi được AI Service qua mạng nội bộ Docker?
docker compose -f docker-compose.cpu-ec2.yml exec backend \
  curl -s http://ai-service:2111/health | head -5

# FAQ đọc từ mã nguồn — phải trả về 12 mục
curl -s http://localhost:5000/v1/faqs | head -5
```

Từ trình duyệt: `http://<ip-ec2>` phải hiện trang chủ.

> **`curl` từ bên ngoài tới cổng 2111 phải THẤT BẠI.** Nếu nó thành công thì
> cổng đang mở ra Internet — quay lại Phần 2.4 và đóng lại.

### 6.4. Bật CI/CD

Đã chạy được thì bật cầu dao:

**Settings → Secrets and variables → Actions → Variables → `DEPLOY_ENABLED` = `true`**

Từ giờ mỗi lần push lên `main`/`master`, workflow tự động:

1. Chạy CI ba thành phần (lint, nạp thử module, build TypeScript)
2. Build và đẩy sáu tag ảnh (`latest` + `<git-sha>` cho mỗi service)
3. Chép cấu hình + `db-init` + `scripts` lên máy chủ
4. Ghi hai tệp `.env.production` từ Secrets
5. **Chạy migration**
6. `docker compose pull` rồi `up -d` (chỉ tạo lại service có thay đổi)
7. Dọn ảnh cũ hơn 72 giờ
8. **Chờ tất cả container healthy rồi kiểm tra ba đầu mối** — thất bại thì
   workflow báo đỏ

Cần deploy ngay mà không push gì: tab **Actions → 3T EduTech CI/CD → Run
workflow**.

---

## Phần 7 — Tên miền miễn phí và HTTPS

### 7.1. Vì sao cần HTTPS, không phải để cho đẹp

Bốn thứ **không hoạt động** trên HTTP thuần:

| Thứ | Chuyện gì xảy ra |
|-----|------------------|
| Đăng nhập Google | Google từ chối redirect URI dùng `http://` (trừ `localhost`). Nút đăng nhập báo lỗi ngay. |
| Webhook Stripe | Stripe yêu cầu HTTPS cho endpoint production. |
| Service Worker / PWA | Trình duyệt chỉ cho chạy trên ngữ cảnh bảo mật. |
| Mật khẩu người dùng | Đi qua mạng ở dạng chữ thường. Với đồ án có người dùng thật thì đây là vấn đề thật. |

### 7.2. Tên miền miễn phí — DuckDNS

Bạn muốn miễn phí. Có ba nhóm lựa chọn, và chúng khác nhau khá nhiều:

| Cách | Miễn phí | Dùng được Let's Encrypt | Nhận xét |
|------|----------|------------------------|----------|
| **DuckDNS** (`ten.duckdns.org`) | ✅ vĩnh viễn | ✅ | **Khuyến nghị.** Đăng ký bằng tài khoản GitHub/Google, mất 2 phút. |
| `sslip.io` / `nip.io` | ✅ | ⚠️ rủi ro | Không cần đăng ký (`13-52-1-2.sslip.io` tự trỏ về IP đó), nhưng hạn mức Let's Encrypt dùng chung cho cả tên miền — người khác dùng hết thì bạn bị khóa. |
| Freenom (`.tk`, `.ml`…) | ❌ | — | Đã ngừng cấp tên miền miễn phí. Đừng mất thời gian. |

DuckDNS nằm trong Public Suffix List, nghĩa là mỗi subdomain có hạn mức
Let's Encrypt riêng — không bị ảnh hưởng bởi người dùng khác.

**Các bước:**

1. Vào `duckdns.org`, đăng nhập bằng GitHub/Google
2. Nhập tên bạn muốn (ví dụ `3tedutech`) → **add domain**
3. Điền IP công cộng của EC2 vào ô **current ip** → **update ip**
4. Chờ 1–2 phút rồi kiểm tra:

```bash
nslookup 3tedutech.duckdns.org
# hoặc: dig +short 3tedutech.duckdns.org
```

> **IP công cộng của EC2 đổi mỗi lần tắt/bật máy** (trừ khi gán Elastic IP).
> Đổi IP là tên miền trỏ sai, và chứng chỉ không gia hạn được. Hai cách:
>
> - **Gán Elastic IP** (miễn phí khi còn gắn với instance đang chạy):
>   ```bash
>   aws ec2 allocate-address --region ap-northeast-1 --domain vpc
>   aws ec2 associate-address --region ap-northeast-1 \
>     --instance-id $EC2_ID --allocation-id eipalloc-xxxx
>   ```
>   ⚠️ Elastic IP **không** gắn với máy nào thì bị tính phí. Nhớ giải phóng khi
>   xóa instance.
> - Hoặc cài cron gọi API cập nhật của DuckDNS mỗi 5 phút.
>
> Elastic IP gọn hơn và nên làm trước khi xin chứng chỉ.

### 7.3. Bật HTTPS

```bash
# Trên MÁY CHỦ
cd /opt/3t-edu-tech
sudo bash scripts/03-bat-https.sh 3tedutech.duckdns.org email-cua-ban@gmail.com
```

Script kiểm tra tên miền đã trỏ đúng máy chưa (**trước** khi gọi certbot — Let's
Encrypt khóa 5 lần thất bại mỗi giờ, bấm bừa là ngồi đợi cả tiếng), thử đường
dẫn ACME đi qua được Nginx chưa, xin chứng chỉ, chuyển cấu hình Nginx, kiểm tra
`nginx -t` **trước** khi nạp lại, rồi diễn tập gia hạn.

Nó dùng `--webroot` chứ không phải `--standalone`: Nginx phục vụ tệp thử thách
như một tệp tĩnh bình thường, nên **không phải tắt web** lúc xin và lúc gia hạn.
Gia hạn chạy tự động 90 ngày một lần lúc rạng sáng; một lần hỏng vì cổng bận là
chứng chỉ hết hạn mà không ai biết.

### 7.4. Bốn việc phải làm sau đó

Đây là phần hay bị quên, và triệu chứng thường rất khó hiểu.

**1. Build lại frontend** (nếu không, trình duyệt vẫn gọi HTTP cũ và bị chặn vì
lỗi mixed content):

```
GitHub Secrets:
  VITE_API_URL    = https://3tedutech.duckdns.org/v1
  VITE_AI_API_URL = https://3tedutech.duckdns.org/v1/ai
```
Rồi **Actions → Run workflow**.

**2. Cập nhật `BACKEND_ENV_PRODUCTION`:**

```
SERVER_URL=https://3tedutech.duckdns.org
FRONTEND_URL=https://3tedutech.duckdns.org
CORS_ALLOWED_ORIGINS=https://3tedutech.duckdns.org
VNP_RETURN_URL=https://3tedutech.duckdns.org/payment/vnpay-return
VNP_IPN_URL=https://3tedutech.duckdns.org/webhooks/vnpay-ipn
GOOGLE_CALLBACK_URL=https://3tedutech.duckdns.org/v1/auth/google/callback
FACEBOOK_CALLBACK_URL=https://3tedutech.duckdns.org/v1/auth/facebook/callback
```

**3. Khai báo lại URL ở từng nhà cung cấp** — Google Cloud Console, Facebook
Developers, VNPay, Stripe, PayPal. Bỏ qua bước này thì thanh toán vẫn trừ tiền
nhưng đơn hàng không bao giờ chuyển sang trạng thái đã thanh toán, vì IPN gọi
vào địa chỉ cũ.

**4. Kiểm tra:**

```bash
curl -I https://3tedutech.duckdns.org
sudo certbot certificates          # xem ngày hết hạn
sudo certbot renew --dry-run       # diễn tập gia hạn
```

> **HSTS — đọc kỹ trước khi bật.** Dòng `Strict-Transport-Security` trong
> `nginx/https-server.conf.template` đang để comment. Nó bảo trình duyệt "trong
> 1 năm tới, không bao giờ nói chuyện với tên miền này qua HTTP" — và đó là thứ
> **không rút lại được từ phía máy chủ**. Nếu chứng chỉ hết hạn hoặc bạn đổi tên
> miền, người dùng đã ghé thăm sẽ bị trình duyệt chặn hẳn, không có nút "vẫn
> tiếp tục". Chỉ bật sau vài tuần chạy ổn định và đã chứng minh gia hạn tự động
> hoạt động.

---

## Phần 8 — Giai đoạn 2: khi có hai máy GPU

### 8.1. Xin quota vCPU trước

Quota cho máy GPU nằm ở nhóm riêng, không phải nhóm vCPU thường:

```bash
aws service-quotas list-service-quotas \
  --region ap-northeast-1 --service-code ec2 \
  --query "Quotas[?contains(QuotaName, 'G and VT')].{Ten:QuotaName,HienTai:Value,Ma:QuotaCode}" \
  --output table
```

Mở yêu cầu tăng:

```bash
aws service-quotas request-service-quota-increase \
  --region ap-northeast-1 --service-code ec2 \
  --quota-code L-DB2E81BA \
  --desired-value 8
```

`L-DB2E81BA` là *Running On-Demand G and VT instances*, tính theo **số vCPU**
chứ không phải số máy. `g4dn.xlarge` có 4 vCPU, nên hai máy cần **8**.

AWS thường trả lời trong 24–48 giờ. Viết rõ mục đích trong phần mô tả ("đồ án
tốt nghiệp, chạy suy luận LLM và nhận dạng giọng nói") thì tỷ lệ duyệt cao hơn.

### 8.2. Chi phí — cân nhắc trước khi bật

`g4dn.xlarge` ở Tokyo khoảng **0,7 USD/giờ** (kiểm tra lại tại
[AWS Pricing Calculator](https://calculator.aws), giá thay đổi theo thời gian).

- Hai máy chạy liên tục cả tháng: **khoảng 1000 USD**
- Chỉ bật khi cần demo, 4 giờ/ngày: **khoảng 170 USD/tháng**

Với đồ án thì **chỉ bật khi demo** là cách duy nhất hợp lý. Kiến trúc đã sẵn
sàng cho điều đó: `LLM_PROVIDER=auto` khiến AI Service tự rơi về Gemini khi máy
vLLM tắt, và endpoint `/health` trả `200` kèm `"status": "degraded"` thay vì lỗi
— nếu trả lỗi, Docker sẽ liên tục khởi động lại container một cách vô ích.

```bash
# Tắt sau khi demo xong
aws ec2 stop-instances --region ap-northeast-1 --instance-ids i-gpu1 i-gpu2
```

> ⚠️ Máy `stop` vẫn tính tiền ổ EBS (~0,1 USD/GB/tháng). Ổ 100GB × 2 máy ≈ 20
> USD/tháng dù không bật lần nào. Nếu để lâu không dùng, tạo AMI rồi xóa hẳn
> instance.

### 8.3. Bật ảnh Docker bản GPU

**Settings → Variables → `CO_GPU` = `true`**

Job `dockerize-gpu` sẽ build `ai-service` với
`--build-arg INSTALL_EXTRAS="whisper,gpu"` (~1,6GB, so với ~500MB bản CPU) và
đẩy lên tag `gpu`. Cùng một `Dockerfile` — chỉ khác tham số build.

### 8.4. Dựng hai máy

**Máy GPU #2 (AI Service + Whisper):**

```bash
# AMI khuyến nghị: AWS Deep Learning Base AMI (đã có sẵn NVIDIA driver
# và nvidia-container-toolkit — tự cài hai thứ đó rất mất thời gian)
nvidia-smi          # phải thấy card Tesla T4

sudo bash /tmp/scripts/01-cai-dat-server.sh

cd /opt/3t-edu-tech
cat > .env <<'EOF'
DOCKER_USERNAME=ten-docker-hub
AI_IMAGE_TAG=gpu
EOF
# ai-service/.env.production dùng bản GPU — xem cuối tệp mẫu AI Service
docker compose -f docker-compose.gpu-ec2-ai.yml up -d

# ★ Xác nhận ảnh THẬT SỰ có whisper.
# Build thiếu INSTALL_EXTRAS thì dịch vụ VẪN chạy bình thường và chỉ lặng lẽ
# bỏ qua phiên âm — không kiểm tra thì không ai biết.
curl -s http://localhost:2111/health | grep -o '"available":[a-z]*'
# phải là "available":true
```

**Máy GPU #1 (vLLM/Qwen):** dùng `vllm-server/docker-compose.yml`.

**Security Group cho máy GPU #2:**

```bash
aws ec2 authorize-security-group-ingress --region ap-northeast-1 \
  --group-id $GPU2_SG --protocol tcp --port 2111 --source-group $EC2_SG
```

⚠️ `--source-group` chứ tuyệt đối không `0.0.0.0/0`. Cổng này nay lộ ra ngoài
máy (backend nằm ở máy khác), và `INTERNAL_API_KEY` là lớp bảo vệ **duy nhất**
đứng chắn. Ai gọi được đều tiêu tiền token Gemini của bạn.

### 8.5. Chuyển đổi — không sửa một dòng YAML nào

```bash
# Trên MÁY CPU
cd /opt/3t-edu-tech

# 1. Trỏ backend sang máy GPU — dùng IP NỘI BỘ trong VPC
echo "AI_SERVICE_URL=http://10.0.x.x:2111" >> .env

# 2. Tắt AI Service đang chạy chung
docker compose -f docker-compose.cpu-ec2.yml up -d --scale ai-service=0

# 3. Kiểm tra
docker compose -f docker-compose.cpu-ec2.yml exec backend \
  curl -s http://10.0.x.x:2111/health
```

Backend đọc `AI_SERVICE_URL` từ biến môi trường (mặc định trỏ vào service nội
bộ), nên đổi đích chỉ là thêm một dòng vào `.env`.

> **Dùng IP nội bộ trong VPC, đừng dùng IP công cộng.** Khi hai máy nói chuyện
> qua Internet, `INTERNAL_API_KEY` đi qua đường công cộng ở dạng chữ thường và
> HTTPS trở thành bắt buộc. Trong VPC thì không cần.

### 8.6. Chuyển dữ liệu ChromaDB sang máy mới

Không bắt buộc — hệ thống tự nạp lại khi collection rỗng. Nhưng nạp lại tốn
lượt gọi API embedding của Gemini, nên chép sang thì rẻ hơn:

```bash
# Trên máy CPU — đóng gói
docker run --rm -v 3t-edu-tech_ai-chroma-data:/d -v $PWD:/b alpine \
  tar czf /b/chroma.tgz -C /d .

# Chép sang máy GPU rồi bung
scp chroma.tgz ubuntu@<ip-gpu2>:/tmp/
docker run --rm -v 3t-edu-tech_ai-chroma-data:/d -v /tmp:/b alpine \
  tar xzf /b/chroma.tgz -C /d
```

Tên volume thật lấy bằng `docker volume ls | grep chroma` (Compose thêm tiền tố
theo tên thư mục dự án).

---

## Phần 9 — Vận hành thường ngày

### 9.1. Các lệnh hay dùng

```bash
cd /opt/3t-edu-tech
C="docker compose -f docker-compose.cpu-ec2.yml"

$C ps                              # trạng thái + healthcheck
$C logs -f backend                 # theo dõi log
$C logs --tail 100 ai-service
$C restart backend                 # khởi động lại một service
$C exec backend sh                 # vào trong container
docker stats --no-stream           # RAM/CPU thực tế
df -h /                            # dung lượng ổ
free -h                            # RAM và swap
```

### 9.2. Quay lui khi bản mới hỏng

Mỗi ảnh có tag `<git-sha>`, nên quay lui là đổi một dòng:

```bash
cd /opt/3t-edu-tech
docker compose -f docker-compose.cpu-ec2.yml ps --format '{{.Service}} {{.Image}}'
# ghi lại sha đang chạy trước khi đổi

echo "IMAGE_TAG=<sha-cua-ban-chay-duoc>" >> .env
docker compose -f docker-compose.cpu-ec2.yml up -d
```

> ⚠️ **Quay lui mã nguồn KHÔNG quay lui cơ sở dữ liệu.** Nếu bản mới có
> migration, lược đồ vẫn ở trạng thái mới. Với migration chỉ thêm thì mã cũ vẫn
> chạy bình thường (nó không biết tới cột mới). Với migration xóa cột thì mã cũ
> sẽ đổ — đó là lý do Phần 5 khuyên làm hai bước cho mọi thay đổi phá vỡ tương
> thích.

### 9.3. Sao lưu

**RDS** — bật sao lưu tự động (mặc định có thể đang tắt):

```bash
aws rds modify-db-instance --region ap-northeast-1 \
  --db-instance-identifier TEN-RDS \
  --backup-retention-period 7 \
  --preferred-backup-window "18:00-19:00" \
  --apply-immediately
```

Cửa sổ `18:00-19:00` UTC = 1–2 giờ sáng giờ Việt Nam, lúc ít người dùng nhất.

**ChromaDB và tài liệu FAQ** — không nằm trong RDS, phải sao lưu riêng:

```bash
cd /opt/3t-edu-tech
docker run --rm -v 3t-edu-tech_ai-chroma-data:/d -v $PWD/backup:/b alpine \
  tar czf /b/chroma-$(date +%F).tgz -C /d .
docker run --rm -v 3t-edu-tech_faq-docs:/d -v $PWD/backup:/b alpine \
  tar czf /b/faq-docs-$(date +%F).tgz -C /d .
```

> `faq-docs` chứa `manifest.json` — **dữ liệu thật, không phải cache**. Mất nó
> thì tệp PDF vẫn còn trên Cloudinary nhưng hệ thống không còn biết chúng tồn
> tại, và mất luôn khóa `sourceName` để gỡ vector khỏi ChromaDB.

### 9.4. Theo dõi chi phí

```bash
aws ce get-cost-and-usage --region us-east-1 \
  --time-period Start=$(date -d '30 days ago' +%F),End=$(date +%F) \
  --granularity MONTHLY --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

> Cost Explorer **chỉ có ở `us-east-1`** dù bạn dùng vùng nào — đây là một
> ngoại lệ của AWS, không phải lỗi gõ nhầm.

Đặt cảnh báo ngân sách trong Billing → Budgets. Với giai đoạn 1 thì 30–40
USD/tháng là mức hợp lý để bắt đầu.

---

## Phần 10 — Xử lý sự cố

### Container báo `unhealthy` hoặc khởi động lại liên tục

```bash
docker compose -f docker-compose.cpu-ec2.yml ps
docker compose -f docker-compose.cpu-ec2.yml logs --tail 100 <ten-service>
docker inspect <ten-container> --format '{{json .State.Health}}' | python3 -m json.tool
```

### Backend không nối được RDS

```bash
# Từ máy chủ — cổng có thông không?
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/'"$RDS_ENDPOINT"'/1433' \
  && echo "thông" || echo "KHÔNG thông"
```

Không thông → kiểm tra theo thứ tự: Security Group của RDS có nhận
`--source-group $EC2_SG` chưa; RDS và EC2 có cùng VPC không; `DB_HOST` có đúng
là endpoint (không phải IP, không kèm cổng) không.

### `docker compose up` báo `manifest unknown`

Ảnh với tag đó chưa được đẩy lên Docker Hub. Hay gặp nhất là lệch tag AI Service:
compose kéo `${AI_IMAGE_TAG:-cpu}` còn CI đẩy `:latest`. Kiểm tra:

```bash
grep AI_IMAGE_TAG /opt/3t-edu-tech/.env
docker pull $DOCKER_USERNAME/3t-edu-tech-ai-service:cpu
```

### Chatbot im lặng, nhưng mọi thứ đều "healthy"

Gần như chắc chắn là khóa nội bộ lệch nhau:

```bash
grep AI_SERVICE_INTERNAL_KEY /opt/3t-edu-tech/3t-edu-tech-backend/.env.production
grep INTERNAL_API_KEY        /opt/3t-edu-tech/ai-service/.env.production
# hai giá trị phải GIỐNG HỆT nhau
```

Xác nhận bằng cách gọi thẳng:

```bash
# Không có khóa → phải trả 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:2111/api/ingest/text

# Có khóa → phải khác 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:2111/api/ingest/text \
  -H "x-internal-api-key: <khoa-cua-ban>"
```

### Ổ đầy

```bash
df -h /
docker system df -v | head -30
docker image prune -a -f --filter "until=24h"
sudo du -sh /opt/3t-edu-tech/* | sort -h | tail
```

Thủ phạm thường gặp: volume `import-temp` (tệp tạm giải nén ZIP). Xóa vô hại:

```bash
docker volume rm 3t-edu-tech_import-temp   # chỉ chứa tệp tạm
```

⚠️ **Đừng** xóa `ai-chroma-data` hay `faq-docs` — đó là dữ liệu thật.

### Frontend chết, log báo `host not found in upstream`

Có `upstream` trong cấu hình Nginx trỏ tới tên máy không phân giải được. Nginx
phân giải tên upstream **lúc nạp cấu hình**, nên nó thoát ngay lúc khởi động —
kể cả khi khối `location` dùng upstream đó đã bị comment.

Đây đúng là lỗi trong `nginx.conf` cũ (`server GPU_EC2_2_PRIVATE_IP:2111`), đã
sửa trong `nginx/conf.d/00-common.conf`. Nếu gặp lại, tìm mọi khối `upstream`
và kiểm tra từng tên máy.

### Certbot báo `Timeout during connect`

Cổng 80 chưa mở cho `0.0.0.0/0`, hoặc tên miền chưa trỏ đúng IP. Script
`03-bat-https.sh` kiểm tra cả hai **trước** khi gọi certbot — nếu bạn gọi
certbot trực tiếp thì tự kiểm tra:

```bash
dig +short 3tedutech.duckdns.org
curl -s https://checkip.amazonaws.com
# hai giá trị phải giống nhau
```

### Deploy xong nhưng frontend vẫn gọi địa chỉ cũ

`VITE_API_URL` được nhúng vào bundle **lúc build**. Đổi secret rồi thì phải
build lại ảnh frontend (Actions → Run workflow), và người dùng phải tải lại
trang không dùng cache (Ctrl+Shift+R).

---

## Phụ lục — Thứ tự làm, gọn trong một chỗ

```
[ ] 1. Thu hồi 3 khóa đã lộ, sinh khóa mới                    (Phần 1)
[ ] 2. Ghi lại EC2/RDS id, IP, SG, endpoint                   (Phần 2.2)
[ ] 3. Xác nhận EC2 và RDS cùng VPC                           (Phần 2.2)
[ ] 4. Mở 1433 RDS ← SG của EC2                               (Phần 2.3)
[ ] 5. Mở 80/443 cho 0.0.0.0/0, 22 cho IP của bạn             (Phần 2.4)
[ ] 6. Kiểm tra ổ ≥ 30GB                                      (Phần 2.5)
[ ] 7. Chạy 01-cai-dat-server.sh, đăng nhập lại               (Phần 3)
[ ] 8. Tạo khóa SSH cho CI/CD                                 (Phần 4.2)
[ ] 9. Đặt 10 Secrets + 2 Variables trên GitHub               (Phần 4.3)
[ ] 10. Tạo 2 tệp .env.production trên máy chủ                (Phần 6.2)
[ ] 11. Chạy 02-chay-migration.sh                             (Phần 5.3)
[ ] 12. Chép ci-cd/deploy.yml vào .github/workflows/          (Phần 6.1)
[ ] 13. Deploy tay + kiểm tra từng lớp                        (Phần 6.2–6.3)
[ ] 14. Bật DEPLOY_ENABLED = true                             (Phần 6.4)
[ ] 15. Gán Elastic IP                                        (Phần 7.2)
[ ] 16. Tạo tên miền DuckDNS                                  (Phần 7.2)
[ ] 17. Chạy 03-bat-https.sh                                  (Phần 7.3)
[ ] 18. Đổi VITE_API_URL + env sang https, build lại          (Phần 7.4)
[ ] 19. Khai báo lại callback URL ở Google/VNPay/Stripe        (Phần 7.4)
[ ] 20. Bật sao lưu RDS, đặt cảnh báo ngân sách               (Phần 9.3–9.4)
```

Giai đoạn 2 (sau khi có quota GPU): Phần 8.
