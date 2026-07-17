# AI + n8n — Trạng thái hoàn thiện (17/07/2026)

## Đã làm

| Hạng mục | Trạng thái |
|----------|------------|
| Floating Copilot nối API thật (`/api/ai-support/chat`) | ✅ |
| Lịch sử chat lưu DB (`ai_conversations`, `ai_chat_messages`) | ✅ |
| Trang `/ai-support` riêng Sinh viên / Giảng viên | ✅ |
| Upload ảnh / báo cáo / file text trong Hub + Copilot | ✅ |
| Idea Generator prompt giàu hơn (persona, revenue, risks…) | ✅ |
| Pipeline n8n ưu tiên + fallback Gemini | ✅ |
| Mentor / Weekly / Financial / Survey / Canvas / AI routes qua n8n | ✅ |
| Workflow mẫu + README | `n8n/` |
| Env template | `BE/.env.example` |

## Cấu hình để demo n8n

1. Chạy n8n (local hoặc cloud).
2. Import `n8n/studyconnect-ai-workflow.json` → Activate.
3. Copy Production Webhook URL vào `BE/.env`:
   ```
   N8N_WEBHOOK_URL=https://.../webhook/studyconnect-ai
   GEMINI_API_KEY=...
   ```
4. Restart backend. Chat tại `/ai-support` → xem Execution trên n8n.

Không có `N8N_WEBHOOK_URL` thì AI vẫn chạy (Gemini trực tiếp).

## Gap còn lại (không chặn demo AI)

- PDF binary chưa parse OCR (upload PDF hiện chủ yếu metadata; ưu tiên ảnh + text).
- Speech Coach vẫn client-side (Web Speech API), chưa qua n8n.
- Pitch video analysis vẫn dựa metadata URL (Gemini không xem video thật).
