# Hướng dẫn triển khai lên 3 máy EC2

> Viết ngày 19/08/2026. Chỉ liệt kê **việc cần tay bạn**. Phần mã nguồn đã sửa xong.

---

## 0. ĐỌC TRƯỚC — hai máy GPU đang chạy và đang tính tiền

```
i-0f8ac78807132b82d  g6.xlarge     3T-EduTech-GPU-1-vLLM       running
i-0f6bcd18bd2c0f4eb  g4dn.xlarge   3T-EduTech-GPU-2-AIService  running
i-01f5c3c164c11042e  t3.medium     3T-EduTech-CPU-EC2          stopped
```

Giá on-demand ở ap-northeast-1 (Tokyo), làm tròn:

| Máy | ~USD/giờ | ~USD/ngày | ~USD/tuần |
|---|---|---|---|
| g6.xlarge | 1.00 | 24 | 168 |
| g4dn.xlarge | 0.53 | 13 | 89 |
| **Cộng** | **1.53** | **37** | **257** |

Hai máy này đang chạy **24/7 dù chưa cài gì**. Nếu buổi báo cáo còn vài ngày,
hãy `stop` chúng lại ngay và chỉ `start` khi cần — dừng máy thì chỉ trả tiền ổ
đĩa EBS (vài nghìn đồng/ngày), không trả tiền GPU.

```bash
aws ec2 stop-instances --region ap-northeast-1 --profile edutech-devops \
  --instance-ids i-0f8ac78807132b82d i-0f6bcd18bd2c0f4eb
```

> Lưu ý: `stop` rồi `start` lại sẽ **đổi IP public** (trừ khi bạn gán Elastic
> IP). IP **private** thì giữ nguyên — và đó mới là thứ ba máy dùng để gọi nhau,
> nên việc đổi IP public không ảnh hưởng liên kết nội bộ.

---

## 1. Việc BẮT BUỘC làm trước tiên: thu hồi 3 khóa đã lộ

Ba khóa này đã từng nằm trong lịch sử Git. Xóa khỏi mã nguồn là **không đủ** —
ai clone repo về đều đọc được commit cũ.

- [ ] `MASTER_API_KEY` — thu hồi và tạo mới
- [ ] `COURSE_AI_API_KEY` — thu hồi và tạo mới
- [ ] Khóa YouTube Data API — vào Google Cloud Console, xóa khóa cũ, tạo khóa mới

Khóa mới **chỉ** đặt trong `.env.production` trên máy chủ và trong GitHub
Secrets. Không commit.

---

## 2. Security Group — phần dễ sai nhất

Ba máy phải nằm **cùng VPC**. Lấy Security Group ID của từng máy:

```bash
aws ec2 describe-instances --region ap-northeast-1 --profile edutech-devops \
  --instance-ids i-01f5c3c164c11042e i-0f8ac78807132b82d i-0f6bcd18bd2c0f4eb \
  --query "Reservations[*].Instances[*].{Ten:Tags[?Key=='Name']|[0].Value, SG:SecurityGroups[0].GroupId, IP_Private:PrivateIpAddress}" \
  --output table
```

Ghi lại **IP private** của cả ba — bạn sẽ cần chúng ở bước 4 và 5.

### Quy tắc cần có

| Máy | Cổng | Nguồn được phép | Ghi chú |
|---|---|---|---|
| CPU EC2 | 22 | **IP nhà bạn/32** | KHÔNG để 0.0.0.0/0 |
| CPU EC2 | 80, 443 | 0.0.0.0/0 | web công khai |
| GPU #2 (AI) | 2111 | **SG của CPU EC2** | KHÔNG để 0.0.0.0/0 |
| GPU #2 (AI) | 22 | IP nhà bạn/32 | |
| GPU #1 (vLLM) | 8000 | **SG của GPU #2** | KHÔNG để 0.0.0.0/0 |
| GPU #1 (vLLM) | 22 | IP nhà bạn/32 | |
| RDS | 1433 | **SG của CPU EC2** | |

Vì sao gắt: cổng 2111 mở ra Internet nghĩa là bất kỳ ai cũng gọi được AI
Service và tiêu hạn mức Gemini của bạn. Cổng 8000 mở ra Internet nghĩa là ai
cũng dùng được GPU 1 USD/giờ của bạn. `INTERNAL_API_KEY` là lớp chắn duy nhất
đứng giữa, và nó đi qua mạng ở dạng **chữ thường** nếu không có HTTPS — nên
tuyệt đối phải là mạng nội bộ VPC.

Thêm quy tắc bằng SG-của-máy-kia (thay `sg-XXX` cho đúng):

```bash
# Cho phép CPU EC2 gọi AI Service
aws ec2 authorize-security-group-ingress --region ap-northeast-1 --profile edutech-devops \
  --group-id sg-CUA-GPU2 --protocol tcp --port 2111 --source-group sg-CUA-CPU

# Cho phép AI Service gọi vLLM
aws ec2 authorize-security-group-ingress --region ap-northeast-1 --profile edutech-devops \
  --group-id sg-CUA-GPU1 --protocol tcp --port 8000 --source-group sg-CUA-GPU2
```

---

## 3. GPU EC2 #1 — vLLM chạy Qwen

SSH vào máy `3T-EduTech-GPU-1-vLLM` (52.195.176.0).

```bash
# 3.1 Kiểm tra driver NVIDIA. Phải thấy card L4 24GB.
nvidia-smi

# 3.2 Nếu chưa có Docker + nvidia-container-toolkit thì cài (AMI Deep Learning đã có sẵn)
docker --version && docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi

# 3.3 Lấy mã nguồn
git clone <repo-cua-ban> 3t-edutech && cd 3t-edutech/vllm-server

# 3.4 Đặt biến rồi chạy
export HF_TOKEN=hf_xxxxxxxx          # token HuggingFace của bạn
export VLLM_API_KEY=$(openssl rand -hex 24)   # GHI LẠI, bước 4 cần
echo "VLLM_API_KEY=$VLLM_API_KEY"
docker compose up -d

# 3.5 Theo dõi — LẦN ĐẦU TẢI MÔ HÌNH MẤT 15-20 PHÚT
docker compose logs -f
```

Xong khi lệnh này trả về danh sách model:

```bash
curl -s http://localhost:8000/v1/models -H "Authorization: Bearer $VLLM_API_KEY" | head
```

**Nếu container chết ngay với "Bus error"** — đó là `/dev/shm` quá nhỏ. File
compose đã có `ipc: host` để chống việc này; nếu vẫn gặp, kiểm tra xem bạn có
sửa nhầm dòng đó không.

**Nếu hết VRAM khi nạp mô hình**: hạ `--gpu-memory-utilization` từ `0.90` xuống
`0.85`, hoặc hạ `--max-model-len` từ `8192` xuống `4096`.

---

## 4. GPU EC2 #2 — AI Service + Whisper large-v3

SSH vào máy `3T-EduTech-GPU-2-AIService` (13.112.54.132).

```bash
nvidia-smi          # phải thấy card T4 16GB
git clone <repo-cua-ban> 3t-edutech && cd 3t-edutech
```

### 4.1 Tạo `ai-service/.env.production`

Chép từ `ci-cd/mau-bien-moi-truong-ai-service.txt` rồi **bắt buộc** đổi các dòng sau:

```ini
LLM_PROVIDER=auto
LLM_GEMINI_COOLDOWN_SECONDS=900

# ★ IP PRIVATE của GPU EC2 #1 (lấy ở bước 2), KHÔNG phải 127.0.0.1
VLLM_BASE_URL=http://10.x.x.x:8000/v1
VLLM_MODEL_NAME=Qwen/Qwen3.6-27B-AWQ
VLLM_API_KEY=<chuoi-random-o-buoc-3.4>

GEMINI_ROUTING_API_KEY=<khoa-that>
GEMINI_CHAT_API_KEY=<khoa-that>
GEMINI_EMBEDDING_API_KEY=<khoa-that>

INTERNAL_API_KEY=<32-ky-tu-random>     # phải TRÙNG với backend

WHISPER_MODEL_SIZE=large-v3
WHISPER_DEVICE=cuda
WHISPER_COMPUTE_TYPE=float16
```

> Nếu để `VLLM_BASE_URL=127.0.0.1`, AI Service sẽ tự gọi vào chính nó, không
> bao giờ tới được vLLM — **và mọi thứ vẫn chạy bình thường** nhờ Gemini. Bạn
> sẽ không phát hiện ra rằng con GPU 1 USD/giờ chưa từng phục vụ một câu hỏi
> nào. Vì vậy file compose nay **bắt buộc** phải có biến này, không có thì
> container từ chối khởi động.

### 4.2 Build ảnh KÈM whisper và gpu

```bash
export DOCKER_USERNAME=<tai-khoan-docker-hub>
docker build --build-arg INSTALL_EXTRAS="whisper,gpu" \
  -t $DOCKER_USERNAME/3t-edu-tech-ai-service:gpu ./ai-service
docker push $DOCKER_USERNAME/3t-edu-tech-ai-service:gpu
```

Thiếu `--build-arg` thì dịch vụ **vẫn chạy** (chatbot, RAG bình thường), chỉ
riêng phiên âm bị bỏ qua kèm cảnh báo trong log. Đây đúng là kiểu lỗi mà không
ai để ý cho tới lúc demo tính năng tạo phụ đề.

### 4.3 Chạy

```bash
export VLLM_BASE_URL=http://10.x.x.x:8000/v1
docker compose -f docker-compose.gpu-ec2-ai.yml up -d
docker compose -f docker-compose.gpu-ec2-ai.yml logs -f
```

### 4.4 Kiểm tra — **làm đủ cả bốn dòng**

```bash
curl -s http://localhost:2111/health | python3 -m json.tool
```

Phải thấy:

- `"status": "healthy"` (nếu là `degraded` → vLLM chưa gọi tới được, xem lại IP/SG)
- `"whisper": {"available": true, "model_size": "large-v3", "device": "cuda"}`
- `"llm": {"gemini_configured": true, "gemini_cooling_down": false}`
- `"collections"` có số lượng > 0 (nếu 0 → chưa nạp dữ liệu RAG, chatbot sẽ trả lời chung chung)

Kiểm tra Whisper thật sự nằm trên GPU:

```bash
nvidia-smi     # sau lần phiên âm đầu tiên phải thấy tiến trình python chiếm ~3GB
```

---

## 5. CPU EC2 — backend, frontend, nginx

Máy này đang **stopped**. Khởi động:

```bash
aws ec2 start-instances --region ap-northeast-1 --profile edutech-devops \
  --instance-ids i-01f5c3c164c11042e
```

Rồi làm theo `docs/HUONG_DAN_TRIEN_KHAI_AWS.md` (đã viết trước đó) — phần cài
Docker, kéo mã nguồn, `.env.production`, migration, nginx, HTTPS.

Điểm **khác** so với tài liệu cũ:

```ini
# 3t-edu-tech-backend/.env.production
AI_SERVICE_URL=http://<IP-PRIVATE-CUA-GPU2>:2111
AI_SERVICE_INTERNAL_KEY=<trùng với INTERNAL_API_KEY ở bước 4.1>
```

t3.medium chỉ có **2 vCPU / 4GB RAM**. Nó chạy backend + frontend + nginx +
Redis là vừa đủ, nhưng đừng chạy thêm AI Service trên đó.

---

## 6. CI/CD

- [ ] Chép `ci-cd/deploy.yml` đè lên `.github/workflows/deploy.yml` rồi commit
      (tôi không ghi thẳng vào thư mục đó được)
- [ ] Vào GitHub → Settings → Secrets, đặt: `DOCKER_USERNAME`, `DOCKER_PASSWORD`,
      `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `VITE_API_URL`,
      `VITE_AI_API_URL`, và các biến môi trường backend/AI
- [ ] Vào GitHub → Settings → Variables, đặt `DEPLOY_ENABLED=true` khi đã sẵn sàng

---

## 7. Danh sách kiểm tra cuối, chạy từ máy bạn

```bash
# Backend sống
curl -s https://<ten-mien>/v1/categories | head -c 200

# AI Service KHÔNG được gọi trực tiếp từ Internet (phải timeout hoặc bị từ chối)
curl -m 5 http://13.112.54.132:2111/health ; echo "^ phải LỖI/timeout mới đúng"

# vLLM KHÔNG được gọi trực tiếp từ Internet
curl -m 5 http://52.195.176.0:8000/v1/models ; echo "^ phải LỖI/timeout mới đúng"

# Bộ test tích hợp, chạy từ máy dev trỏ vào server
cd 3t-edu-tech-backend
$env:API_BASE_URL="https://<ten-mien>/v1"
npm run test:smoke
npm run test:security
```

---

## 8. Điều tôi KHÔNG làm được và bạn cần biết

**Embedding không có đường lùi.** Toàn bộ RAG dùng `gemini-embedding`. vLLM ở
đây chỉ phục vụ mô hình sinh văn bản. Nếu hạn mức embedding của Gemini cạn:
chatbot **vẫn trả lời được** (nhờ Qwen) nhưng **không tìm được tài liệu để
trích dẫn** — câu trả lời sẽ chung chung, không dẫn nguồn.

Muốn dự phòng cả phần này thì phải triển khai thêm một mô hình embedding trên
GPU EC2 #2 (ví dụ `bge-m3` qua text-embeddings-inference) và viết một lớp chọn
tương tự `llm_provider`. Đó là việc vài giờ, không phải vài phút — nếu buổi báo
cáo còn gần thì cách an toàn hơn là **nạp sẵn toàn bộ dữ liệu RAG trước ngày
demo** để hôm đó không cần gọi embedding nữa.

**Nạp dữ liệu RAG trước khi demo:**

```bash
curl -X POST http://localhost:2111/api/ingest/courses \
  -H "X-Internal-Api-Key: <INTERNAL_API_KEY>"
curl -s http://localhost:2111/health | grep -A3 collections
```
