# Chọn GPU instance và cỡ mô hình Qwen cho vLLM

> Viết ngày 23/08/2026. Trả lời câu hỏi: g6.xlarge có đủ chạy Qwen 27B không,
> nếu không thì nâng lên máy nào, hay hạ xuống mô hình nhỏ hơn.

---

## 1. Trước khi đổi máy: xác định đang tràn cái gì

`g6.xlarge` có **hai** loại bộ nhớ, và chúng rất dễ bị nói lẫn:

| | Dung lượng | Ai dùng |
|---|---|---|
| VRAM (card L4) | 24 GB | trọng số mô hình + KV cache |
| RAM hệ thống | **16 GB** | tiến trình vLLM, giải nén safetensors lúc nạp |

Con số "21 GB" trong `nvidia-smi` **không phải là tràn**. `docker-compose.yml`
đang đặt `--gpu-memory-utilization 0.90`, nghĩa là vLLM *chủ động* xí trước
0.90 × 24 = 21.6 GB VRAM ngay khi khởi động và giữ nguyên đó suốt vòng đời
tiến trình. Đây là hành vi thiết kế của vLLM (nó cấp phát KV cache một lần),
không phải dấu hiệu sắp hết.

Thứ nhiều khả năng đang tràn là **RAM hệ thống 16 GB**. Trọng số Qwen 27B ở
mức AWQ 4-bit nặng khoảng 15–17 GB trên đĩa; vLLM đọc chúng qua RAM host rồi
mới đẩy sang GPU. 16 GB RAM trừ đi phần OS và Docker là không đủ chỗ.

### Cách phân biệt trong 5 phút

```bash
# Container có bị OOM-killer giết không? (true = tràn RAM hệ thống)
docker inspect edutech-vllm --format '{{.State.OOMKilled}} {{.State.ExitCode}}'

# Nhân hệ điều hành có ghi nhận không?
sudo dmesg | grep -i -E "out of memory|oom-kill"

# Log dừng ở bước nào?
docker compose logs --tail=100 vllm
```

Đọc kết quả:

- Exit code **137** / `OOMKilled: true` / log dừng giữa chừng ở dòng
  `Loading safetensors checkpoint shards...` → **tràn RAM hệ thống**.
- Log có `torch.OutOfMemoryError: CUDA out of memory` kèm số MiB cụ thể →
  **tràn VRAM**.
- Log có `ValueError: Model architectures [...] are not supported` → không
  phải chuyện bộ nhớ, xem mục 4.

---

## 2. Các lựa chọn instance, và vì sao không có nấc trung gian

Giá on-demand us-east-1 (nguồn: Vantage). Cột Tokyo là suy ra theo tỉ lệ
1.24 mà tài liệu triển khai đang dùng cho g6.xlarge — nên kiểm lại bằng
AWS Pricing Calculator trước khi quyết.

| Instance | GPU | VRAM | vCPU | RAM | us-east-1 /h | ~Tokyo /h | ~Tokyo /ngày |
|---|---|---|---|---|---|---|---|
| **g6.xlarge** (hiện tại) | L4 | 24 GB | 4 | 16 GB | $0.805 | ~$1.00 | ~$24 |
| **g6.2xlarge** | L4 | 24 GB | 8 | **32 GB** | $0.978 | ~$1.22 | ~$29 |
| g5.xlarge | A10G | 24 GB | 4 | 16 GB | $1.006 | ~$1.25 | ~$30 |
| **g6e.xlarge** | L40S | **48 GB** | 4 | 32 GB | $1.861 | ~$2.31 | ~$55 |
| g6.12xlarge | 4×L4 | 96 GB | 48 | 192 GB | $4.602 | ~$5.71 | ~$137 |

Điều cần thấy ở bảng này: **AWS không bán nấc 32 GB VRAM.** Trong dòng G,
sau 24 GB (L4, A10G) là nhảy thẳng lên 48 GB (L40S). Nguyện vọng "đắt hơn một
chút, VRAM nhiều hơn một chút" không có hàng — nếu vấn đề đúng là VRAM thì
lựa chọn duy nhất là g6e.xlarge, tức **hơn gấp đôi tiền**.

Ngược lại, nếu vấn đề là RAM hệ thống thì **g6.2xlarge chính là món hàng đó**:
cùng card L4 24 GB, gấp đôi vCPU và RAM, chỉ đắt thêm khoảng 22%.

---

## 3. Có thực sự cần 27B không

### Qwen đang làm những việc gì trong hệ thống

Đọc `ai-service/src/core/llm_provider.py`, Qwen được gọi ở đúng bốn chỗ:

| Hàm | Việc | max_tokens | Độ khó |
|---|---|---|---|
| `generate_routing` | phân 6 intent, trả JSON | 256 | thấp |
| `generate_response` | trả lời chat có sẵn context RAG | 2048 | trung bình |
| `generate_response_stream` | như trên, dạng streaming | 2048 | trung bình |
| `generate_suggestions` | gợi ý 3 câu hỏi tiếp | 300 | thấp |

Không có việc nào là suy luận nhiều bước, sinh mã, hay chứng minh toán. Ba
trong bốn việc là **bám định dạng và bám ngữ cảnh**, không phải kiến thức thế
giới. Trong kiến trúc RAG, phần "khôn" nằm ở khâu retrieval — mô hình chỉ cần
đọc hiểu tiếng Việt và không bịa thêm ngoài ngữ cảnh được đưa.

### Và Qwen là đường lùi, không phải đường chính

Theo chính sách viết ở đầu `llm_provider.py`, mặc định `LLM_PROVIDER=auto`
nghĩa là **Gemini đi trước**, Qwen chỉ vào cuộc khi Gemini trả 429 hoặc khi
không có API key. Đây là điểm quyết định của cả bài toán: đang cân nhắc trả
thêm $31/ngày để nuôi một mô hình phục vụ phần lưu lượng còn thừa.

### So sánh các cỡ mô hình trên card 24 GB

| Mô hình | Q4 VRAM | Chỗ trống cho KV cache | Nhận xét |
|---|---|---|---|
| Qwen3.5-4B | ~3 GB | ~18 GB | dư sức cho intent routing, hơi mỏng cho chat |
| **Qwen3.5-9B** | ~5.7 GB | ~15 GB | đủ khôn cho RAG tiếng Việt, nạp nhanh, không đụng trần RAM 16 GB |
| **Qwen3.6-35B-A3B** (MoE) | ~19.6 GB | ~3 GB | chỉ 3B tham số active/token → nhanh như mô hình nhỏ, khôn như mô hình lớn; nhưng nạp cần >16 GB RAM host |
| Qwen3.6-27B (hiện tại) | ~16.5 GB | ~5 GB | đúng thứ đang gây rắc rối |

---

## 4. Một lỗi khác, không liên quan bộ nhớ, nhưng sẽ chặn trước

`docker-compose.yml` đang ghim `vllm/vllm-openai:v0.6.3`. Đó là bản phát hành
từ cuối 2024. Qwen 3.6 ra tháng 04/2026 và dùng kiến trúc attention lai
(Gated DeltaNet) — **v0.6.3 không thể biết kiến trúc đó tồn tại.**

Nếu container chết ngay lập tức chứ không phải sau vài phút nạp, hãy đọc lại
log tìm dòng `Model architectures ['...'] are not supported`. Trường hợp đó
thì đổi instance bao nhiêu cũng vô ích.

Việc ghim phiên bản là đúng và nên giữ; nhưng phải ghim vào một bản **đủ mới
để hỗ trợ mô hình đang dùng**, rồi kiểm tra trên máy trước khi tin.

---

## 5. Khuyến nghị

**Bước 1 — chẩn đoán (bắt buộc, 5 phút).** Chạy ba lệnh ở mục 1. Đừng đổi
instance khi chưa biết đang tràn cái gì; hai nguyên nhân dẫn tới hai máy khác
nhau và chênh nhau $26/ngày.

**Bước 2 — hạ mô hình xuống Qwen3.5-9B, ở lại g6.xlarge.** Đây là lựa chọn
tôi khuyên cho tình trạng hiện tại. Đổi một biến:

```yaml
--model Qwen/Qwen3.5-9B-AWQ
--max-model-len 16384          # tăng được vì KV cache dư
--gpu-memory-utilization 0.85
--kv-cache-dtype fp8
```

và `VLLM_MODEL_NAME` trong `ai-service/.env.production`. Được gì:

- không tràn RAM 16 GB lúc nạp (trọng số ~6 GB thay vì ~16 GB)
- nạp trong 2–3 phút thay vì 15–20 phút — mỗi lần restart bớt đau
- context dài gấp đôi, chạy được nhiều request song song hơn
- intent routing nhanh hơn rõ rệt, mà đó là **đường nóng**: nó chặn mọi câu
  chat, người dùng cảm nhận trực tiếp
- $0 chi phí thêm

**Bước 3 — nếu chất lượng chat của 9B không đạt.** Lúc đó mới lên
`g6.2xlarge` (+$5/ngày) và chạy `Qwen3.6-35B-A3B`. MoE 3B active cho tốc độ
của mô hình nhỏ với chất lượng của mô hình lớn, vừa khít 24 GB VRAM, và 32 GB
RAM host giải quyết luôn khâu nạp. Đây là điểm cân bằng tốt nhất trong bảng.

**Không khuyến nghị g6e.xlarge** ở giai đoạn này. $55/ngày cho một mô hình
đang đứng ở vai trò dự phòng là sai tỉ lệ. Chỉ đáng khi đảo chính sách sang
`LLM_PROVIDER=qwen-first` và Qwen thật sự gánh phần lớn lưu lượng.

---

## 6. Về nỗi lo "sau này có chức năng cần LLM thông minh hơn"

Kiến trúc hiện tại đã trả lời sẵn câu này. `llm_provider.py` là một lớp chọn
provider — việc khó thì route sang Gemini (vốn đã là mặc định), việc thường
xuyên và rẻ thì để Qwen local. Không cần mua sẵn VRAM cho một tính năng chưa
tồn tại.

Quan trọng hơn: đây là **quyết định đảo ngược được trong 20 phút**. Đổi mô
hình là sửa một dòng trong compose file cộng một biến môi trường. Đổi instance
type là `stop` → `modify-instance-attribute` → `start`, ổ EBS và dữ liệu giữ
nguyên. Không có gì phải chốt cứng từ bây giờ.

---

## 7. Một khoản tiết kiệm lớn hơn tất cả những thứ trên

Theo `docs/HUONG_DAN_TRIEN_KHAI_3_MAY.md`, đang có hai máy GPU chạy song song:

- GPU #1 `g6.xlarge` — chỉ chạy vLLM
- GPU #2 `g4dn.xlarge` — chạy AI Service + Whisper large-v3, **chiếm khoảng
  3.1 GB trong 16 GB VRAM của card T4**

Nếu chuyển sang Qwen3.5-9B (~6 GB), tổng 9–10 GB vẫn nằm gọn trong T4 16 GB.
Gộp được hai máy làm một là **bỏ hẳn $24/ngày**, lớn hơn mọi khoản chênh lệch
bàn ở trên cộng lại.

Ba điều cần kiểm trước khi làm:

1. T4 là kiến trúc Turing, không chạy được Marlin kernel của AWQ. Phải dùng
   bản GPTQ-int4 và chấp nhận chậm hơn L4 khoảng 2–3 lần.
2. `g4dn.xlarge` cũng chỉ có 16 GB RAM hệ thống — vẫn phải kiểm khâu nạp.
3. Whisper và vLLM chia nhau một card sẽ tranh VRAM lúc vừa phiên âm vừa
   chat. Đặt `--gpu-memory-utilization` ở mức 0.65 trở xuống để chừa chỗ.

Nếu buổi báo cáo còn gần thì đừng gộp — rủi ro không đáng. Nhưng nếu hệ thống
còn chạy dài, đây là việc đáng làm nhất trong danh sách.

---

## Nguồn giá

- [g6.xlarge — Vantage](https://instances.vantage.sh/aws/ec2/g6.xlarge)
- [g6.2xlarge — Vantage](https://instances.vantage.sh/aws/ec2/g6.2xlarge)
- [g6e.xlarge — Vantage](https://instances.vantage.sh/aws/ec2/g6e.xlarge)
- [Qwen model lineup mid-2026 — InsiderLLM](https://insiderllm.com/guides/qwen-models-guide/)
- [Qwen 3.x GPU requirements — WillItRunAI](https://willitrunai.com/blog/qwen-3-gpu-requirements)
