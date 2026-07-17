# StudyConnect + n8n Community Edition (miễn phí vĩnh viễn)

## Chọn bản nào?

| Bản | Chi phí | Dùng cho StudyConnect |
|-----|---------|------------------------|
| **n8n Community (tự host)** | **Miễn phí vĩnh viễn** | ✅ Nên dùng (đúng yêu cầu GV) |
| n8n Cloud | Có trial / gói trả phí | Không cần nếu tự host được |

**Kết luận:** Cài n8n trên máy bạn (hoặc VPS miễn phí), không cần mua Cloud.

---

## Kiến trúc trong dự án (đã có sẵn code)

```
FE chat AI → BE Express → POST N8N_WEBHOOK_URL → n8n → Gemini
                              ↓ (nếu n8n tắt)
                         Gemini trực tiếp (fallback)
```

Bạn **không cần viết lại AI** — chỉ cần chạy n8n + điền URL webhook vào `BE/.env`.

---

## Bước 1b — Kích hoạt license miễn phí (key gửi qua email)

n8n Community gửi **activation key** qua email để mở vài tính năng nâng cao (execution history, folders…).

### Cách nhanh (UI — khuyến nghị)

1. Chạy n8n → mở http://localhost:5678
2. Đăng nhập Owner/Admin
3. **Settings → Usage and plan → Enter activation key**
4. Dán key từ email → **Activate**
5. Thấy trạng thái **Registered** là xong (miễn phí vĩnh viễn trên instance này)

### Cách env (Docker)

1. Copy `n8n/.env.example` → `n8n/.env`
2. Điền:
   ```env
   N8N_LICENSE_ACTIVATION_KEY=your-key-from-email
   ```
3. `docker compose up -d` trong thư mục `n8n/`

> **Bảo mật:** Key chỉ để trong `n8n/.env` (đã gitignore). Không commit, không dán vào README/PR.

---

## Bước 1 — Cài n8n miễn phí trên Windows

### Cách A: npm (nhanh nhất)

```powershell
npm install -g n8n
n8n start
```

Mở trình duyệt: **http://localhost:5678**

Lần đầu tạo tài khoản admin (local, miễn phí).

### Cách B: Docker (ổn định hơn)

Trong thư mục `n8n/` đã có `docker-compose.yml`:

```powershell
cd e:\EXE\n8n
docker compose up -d
```

UI: **http://localhost:5678**

---

## Bước 2 — Import workflow StudyConnect

1. Vào n8n → **Workflows** → **Import from File**
2. Chọn file: `e:\EXE\n8n\studyconnect-ai-workflow.json`
3. Bấm **Save** → bật **Active** (góc phải trên)
4. Mở node **Webhook AI** → copy **Production URL**  
   Ví dụ: `http://localhost:5678/webhook/studyconnect-ai`

> Lưu ý: Production webhook chỉ hoạt động khi workflow **Active**.  
> Test URL (`.../webhook-test/...`) chỉ dùng khi bấm "Listen for test event".

---

## Bước 3 — Nối vào Backend StudyConnect

Mở / tạo `BE/.env` (copy từ `BE/.env.example`):

```env
GEMINI_API_KEY=AIza...your_key...

# Bắt buộc để dùng n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook/studyconnect-ai

# Tuỳ chọn
N8N_EVENT_WEBHOOK_URL=http://localhost:5678/webhook/studyconnect-events
N8N_WEBHOOK_SECRET=
```

Restart backend:

```powershell
cd e:\EXE\BE
npm run dev
```

---

## Bước 4 — Kiểm tra đã nối thành công

1. Giữ n8n đang chạy (`n8n start` hoặc Docker).
2. Đăng nhập StudyConnect → **AI Hỗ trợ** (`/ai-support`) hoặc bong bóng AI.
3. Gửi 1 câu hỏi.
4. Trong n8n → **Executions**: thấy request mới (`feature: support_chat`).
5. Nếu tắt n8n mà chat vẫn trả lời → đang fallback Gemini (vẫn OK, nhưng GV muốn thấy n8n thì phải bật lại).

---

## Payload Backend gửi / Response n8n cần trả

**Request (BE → n8n):**

```json
{
  "feature": "support_chat",
  "prompt": "...",
  "systemPrompt": "...",
  "history": [],
  "geminiApiKey": "...",
  "timestamp": "..."
}
```

**Response (n8n → BE) — bắt buộc có một trong các field:**

```json
{ "reply": "Câu trả lời tiếng Việt..." }
```

Workflow mẫu đã trả đúng format này.

---

## Feature nào đi qua n8n?

| feature | Chỗ dùng trên app |
|---------|-------------------|
| support_chat | AI Support + Floating Copilot |
| idea_generator | Idea Generator |
| mentor_chat | Workspace Mentor |
| weekly_summary | Báo cáo tuần |
| financial_review | Financial Hub |
| survey_analyze | Customer Validation |
| global_audit | Analytics |
| auto_grouping | Manager xếp nhóm |
| generate_canvas | Canvas AI |
| … | Pitch Lab / slides / … |

---

## Demo trước giảng viên (checklist)

- [ ] n8n Community đang chạy local
- [ ] Workflow Active + có Execution khi chat
- [ ] `N8N_WEBHOOK_URL` trong `BE/.env`
- [ ] Slide/docs ghi: *“AI orchestration qua n8n Community Edition (self-hosted)”*
- [ ] Fallback Gemini vẫn hoạt động nếu n8n tắt (độ tin cậy)

---

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|------------|------------|
| BE không gọi n8n | Kiểm tra `N8N_WEBHOOK_URL`, restart BE |
| Webhook 404 | Workflow chưa Active; dùng URL **Production** không phải test |
| Gemini lỗi trong n8n | Kiểm tra `geminiApiKey` trong body / key trong `BE/.env` |
| Timeout | n8n chậm; tăng chờ hoặc kiểm tra mạng tới Google API |
| Chỉ chạy trên máy bạn | Deploy: host n8n trên VPS miễn phí (Oracle/Render…) rồi đổi URL public |

---

## Không cần làm gì thêm trong code?

Đúng — code đã sẵn (`BE/src/services/n8n.service.ts`). Việc của bạn chỉ là:

1. Cài & chạy n8n Community  
2. Import workflow  
3. Điền `N8N_WEBHOOK_URL` + `GEMINI_API_KEY`  
4. Restart BE → test chat  
