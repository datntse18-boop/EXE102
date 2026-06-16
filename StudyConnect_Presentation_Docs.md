# 🚀 STUDYCONNECT - TÀI LIỆU THUYẾT TRÌNH DỰ ÁN (PRESENTATION & TESTING DOCS)

Chào mừng bạn đến với **StudyConnect**, nền tảng quản trị và hỗ trợ khởi nghiệp tích hợp trí tuệ nhân tạo (Gemini AI) dành cho học phần dự án khởi nghiệp (**EXE101/EXE201**). 

Tài liệu này tổng hợp toàn bộ các chức năng chính, cấu trúc vai trò (roles), cơ chế thương mại hóa (commercialization), kịch bản chạy thử (demo flows) và danh sách tài khoản kiểm thử đã được thiết lập sẵn trong cơ sở dữ liệu để phục vụ cho buổi thuyết trình và chấm điểm dự án.

---

## 📂 1. TỔNG QUAN HỆ THỐNG & CÔNG NGHỆ

StudyConnect được xây dựng theo mô hình SaaS (Software as a Service) với cấu trúc phân tầng hoàn chỉnh:
* **Frontend**: React.js (Vite, TypeScript, TailwindCSS, Lucide Icons) chạy trên cổng `http://localhost:5173`. Giao diện tối (Dark mode) mặc định chuẩn Obsidian Glassmorphism hiện đại, chuyên nghiệp.
* **Backend**: Node.js (Express, TypeScript, JWT, bcrypt) chạy trên cổng `http://localhost:3000`.
* **Database**: PostgreSQL lưu trữ trên nền tảng đám mây **Neon DB**, kết nối qua ORM **Prisma**.
* **AI Integration**: Tích hợp trực tiếp với dòng mô hình **Google Gemini AI** thông qua API Key phục vụ chẩn đoán dữ liệu và tư vấn.

---

## 👥 2. HỆ THỐNG VAI TRÒ (ROLES) & QUYỀN HẠN

Hệ thống được thiết kế với **5 vai trò phân cấp bảo mật**, có sự liên kết chặt chẽ và tương tác hai chiều:

| Vai trò (Role) | Chức năng & Quyền hạn chính |
| :--- | :--- |
| **Quản trị IT (Admin)** | Toàn quyền kiểm soát hệ thống: Quản lý/phân quyền tài khoản người dùng, Suspend (Khóa) hoặc Xóa vĩnh viễn tài khoản. Theo dõi dòng tiền và duyệt yêu cầu thanh toán thủ công. |
| **Giảng viên (Manager)** | Quản lý lớp học thông qua mã lớp (`classCode`). Xem danh sách báo cáo tuần của các nhóm, chấm điểm nhóm dự án (Team Grade). Sử dụng AI để chẩn đoán sức khỏe dự án và gửi nhận xét/phản hồi trực tiếp vào cơ sở dữ liệu. |
| **Quản lý khoa (Dean)** | Giám sát chất lượng giảng dạy chung của toàn khoa. Xem danh sách giảng viên, các lớp học đang mở, điểm số trung bình của các nhóm và nhận đề xuất AI chiến lược cho khối ngành. |
| **Trưởng nhóm (Student Leader)** | Sinh viên sở hữu quyền hạn quản lý nhóm: Mời thành viên, duyệt đơn gia nhập, giao việc nhanh (Quick Assign) trên Kanban, nộp báo cáo tuần, giải tán nhóm (Archive), và là người duy nhất có quyền mua/nâng cấp gói dịch vụ cho nhóm. |
| **Thành viên (Student Member)** | Sinh viên tham gia dự án. Thực hiện công việc được giao, cập nhật trạng thái Task, đánh giá chéo đồng đội (Peer Evaluation), xem tài liệu môn học và gửi yêu cầu rời nhóm (cần Trưởng nhóm duyệt). |

---

## 💎 3. CÁC TÍNH NĂNG NỔI BẬT & CƠ CHẾ THƯƠNG MẠI HÓA

### 💰 A. Mô hình kiếm tiền (Monetization & SaaS Paywall)
Hệ thống áp dụng biểu giá **Decoy Pricing (Giá chim mồi)** để kích thích hành vi mua hàng:
1. **Gói Free**: Giới hạn tối đa **3 lượt gọi AI mỗi ngày** (áp dụng trên mọi tính năng AI). Khóa các công cụ khởi nghiệp nâng cao và chứng chỉ.
2. **Gói Pro (Cá nhân)**: `699.000 VNĐ / tháng` - Mở khóa hoàn toàn AI và các công cụ cho cá nhân.
3. **Gói Team Premium (Nhóm tối đa 6 người)**: `3.149.000 VNĐ / tháng` (Giá gốc gạch ngang: `4.194.000 VNĐ` - tiết kiệm 25%). **Chỉ Trưởng nhóm mới được quyền thanh toán**. Khi nhóm nâng cấp, toàn bộ 5 thành viên còn lại cũng được tự động mở khóa Premium.
4. **Gói Enterprise (Nhà trường/Lớp học)**: `899.000 VNĐ / tháng / học viên` - Mở khóa hệ thống sổ điểm Gradebook và giám sát cho giảng viên.
5. **Gói Corporate (Doanh nghiệp lớn)**: Không hiển thị giá trực tiếp mà để nút **"Liên hệ"** phục vụ đàm phán B2B.

### 💳 B. Luồng Thanh toán QR động & Xác thực Tự động (MB Bank Webhook)
* **Không cần tải ảnh bằng chứng**: Người dùng chỉ cần quét mã VietQR tĩnh có chứa mã nội dung giao dịch định dạng `SC[A-Z0-9]{8}`.
* **Tự động kích hoạt qua Webhook**: Khi tài khoản MB Bank nhận được tiền đúng cú pháp, webhook backend xử lý nâng cấp gói ngay lập tức.
* **Thời gian thực (Realtime Polling)**: Trang Chờ thanh toán tự động kiểm tra trạng thái mỗi 4 giây và hiển thị màn hình Thành công bóng bẩy ngay khi giao dịch hoàn tất mà không cần F5.

### 📜 C. Phôi Chứng chỉ Khởi nghiệp (Startup Certificate)
* Tính năng độc quyền cho thành viên Premium. Sinh viên điền thông tin và hệ thống xuất ra phôi chứng chỉ mạ vàng kép, đóng dấu blockchain, hỗ trợ xuất file PDF chuẩn khổ ngang A4 phục vụ in ấn.### 🔌 D. Liên kết dữ liệu không kẽ hở giữa các vai trò
* **Điểm sức khỏe nhóm (Health Score)**: Tính toán tự động dựa trên tỷ lệ Task hoàn thành và trừ điểm trễ hạn (Overdue Tasks).
* **Nhận xét của giảng viên**: Khi Giảng viên gửi nhận xét tại Dashboard, dữ liệu lập tức ghi xuống bảng `ProjectComment` ở database và hiển thị trực tiếp tại **Phòng trưng bày dự án (Project Showcase)** dưới nhãn **GIẢNG VIÊN** để sinh viên theo dõi.

### 🧠 E. AI Cố Vấn Toàn Năng (Omnipotent AI Diagnostic Hub)
* **Khả năng tổng hợp cực đại**: Tự động đọc và phân tích toàn bộ cơ sở dữ liệu thực tế của nhóm:
  * **Tài liệu chiến lược**: Đọc & phân tích cấu trúc 9 thành tố của Business Model Canvas (BMC) và dàn ý chi tiết Slide Outline của dự án.
  * **Tiến độ & Đóng góp thành viên**: Đọc thống kê đầu việc (Task) được giao, số lượng task hoàn thành, đang làm, chưa làm của từng thành viên, kèm theo điểm số đánh giá chéo trung bình từ đồng đội (Peer Evaluation).
  * **Báo cáo tuần & Sức khỏe tài chính**: Đọc lịch sử achievements/blockers tuần và bảng điểm hòa vốn tài chính (LTV/CAC, Fixed/Variable Costs).
* **Interactive Chatbot**: Cho phép người dùng chat trực tiếp với AI để hỏi thêm về tiến độ công việc, lỗ hổng tài liệu, giải pháp xử lý khó khăn hoặc chỉ số tài chính của nhóm.

---

## 🔑 4. DANH SÁCH TÀI KHỎN ĐỂ TEST DEMO (ĐÃ CÓ SẴN)

* **Mật khẩu mặc định cho toàn bộ tài khoản:** **`password123`**
* **Lưu ý Session**: Để thuận tiện cho buổi thuyết trình (demo) bắt đầu ở trạng thái khách (guest) nhằm trình bày luồng Đăng nhập/Đăng ký, hệ thống lưu token đăng nhập bằng `sessionStorage`. Đóng tab/trình duyệt và mở lại sẽ đưa hệ thống về trạng thái chưa đăng nhập (không bị tự động đăng nhập vào tài khoản cũ).

| Vai trò (Role) | Họ và tên (Trong database) | Email đăng nhập | Trang giao diện chính | Mục đích demo |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị IT (Admin)** | Nguyễn Đức Duy (Admin IT) | **`david@example.com`** | `/admin` | Duyệt giao dịch dòng tiền thanh toán nâng cấp gói, khóa hoặc xóa tài khoản người dùng. |
| **Giảng viên (Manager)** | Phạm Thị Lan (Giảng viên) | **`carol@example.com`** | `/manager` | Giám sát báo cáo tuần, chấm điểm nhóm học phần, chẩn đoán AI sức khỏe nhóm và gửi nhận xét hướng dẫn. |
| **Quản lý khoa (Dean)** | Trần Thị Minh (Quản lý Khoa) | **`emma@example.com`** | `/dashboard` | Xem tiến độ tổng quan toàn khoa, chẩn đoán AI đề xuất chiến lược giảng dạy. |
| **Trưởng nhóm (Leader)** | Nguyễn Văn An (Trưởng nhóm) | **`alice@example.com`** | `/dashboard` | Quản lý nhóm (phê duyệt thành viên rời nhóm), mua/nâng cấp gói nhóm, giao việc Kanban, nộp báo cáo tuần. |
| **Sinh viên (Member)** | Trần Thị Bích (Thành viên) | **`bob@example.com`** | `/dashboard` | Sinh viên thành viên thường, cập nhật trạng thái công việc, xin rời nhóm (chờ duyệt). |
| **Sinh viên (Member)** | Lê Hoàng Minh (Thành viên) | **`frank@example.com`** | `/dashboard` | Thành viên nhóm thường khác, phục vụ thử nghiệm phân công việc. |

---

## 🧪 5. KỊCH BẢN KIỂM THỬ DEMO CHI TIẾT (STEP-BY-STEP FLOWS)

Dưới đây là 5 kịch bản hoàn hảo nhất để chạy demo trực tiếp trong buổi thuyết trình:

### 🎬 Kịch bản 1: Chặn Giới Hạn AI & Hiển Thị Popup Nâng Cấp (Paywall)
1. Đăng nhập tài khoản sinh viên miễn phí: **`frank@example.com`** / `password123`.
2. Vào **Bộ công cụ Startup** → **Mô hình Canvas AI** hoặc **Ý tưởng AI**.
3. Bấm tạo ý tưởng 3 lần (lượt dùng thực tế sẽ được ghi nhận vào bảng `ai_usages` trong DB).
4. Ở lần bấm thứ 4, hệ thống lập tức chặn lại và mở ra **Popup khóa Premium** được thiết kế bóng bẩy, hướng dẫn người dùng nhấn "Nâng cấp Premium" để chuyển hướng sang `/pricing`.
5. Vào **Chứng nhận khởi nghiệp** (Startup Certificate) → Hệ thống sẽ hiển thị màn hình khóa Premium và nút kêu gọi nâng cấp.

### 🎬 Kịch bản 2: Đăng Ký Gói Nhóm & Thanh Toán VietQR Tự Động
1. Đăng nhập tài khoản Trưởng nhóm: **`alice@example.com`** / `password123`.
2. Truy cập trang **Nâng cấp (Pricing)** → Xem biểu giá 5 cột (chú ý giá gạch ngang chim mồi của gói nhóm).
3. Bấm **Nâng cấp ngay** ở gói **Team Premium** → Hiển thị thông tin chuyển khoản MB Bank cùng mã QR chứa mã giao dịch động (Ví dụ: `SC12345678`).
4. Bấm nút **Xác nhận đã chuyển khoản & Đợi kích hoạt** → Hệ thống chuyển sang màn hình chờ xoay tròn và chạy Polling kiểm tra tự động.
5. *Phục vụ demo duyệt tiền*: Đăng nhập tài khoản Admin **`david@example.com`**, vào **Quản trị hệ thống** → **Dòng tiền giao dịch** → Tìm đơn thanh toán tương ứng và bấm **Xác nhận**.
6. Quay lại màn hình của Alice: Màn hình chờ tự động chuyển sang trạng thái **"Nâng cấp thành công! 🎉"** đẹp mắt mà không cần tải lại trang. Toàn bộ thành viên nhóm được nâng cấp Premium và mở khóa giới hạn AI.

### 🎬 Kịch bản 3: Báo Cáo Tuần, Chẩn Đoán AI & Giảng Viên Góp Ý
1. Đăng nhập tài khoản Trưởng nhóm **`alice@example.com`**, vào mục **Báo cáo tuần (Weekly Check-in)**.
2. Nhập báo cáo tuần mới (Thành tựu, kế hoạch, khó khăn) và bấm gửi.
3. Trí tuệ nhân tạo Gemini AI tự động quét báo cáo, đưa ra tóm tắt chẩn đoán và lời khuyên gỡ khó khăn, lưu vào bảng `weekly_reports`.
4. Đăng nhập tài khoản Giảng viên **`carol@example.com`**, vào trang **Manager Dashboard**.
5. Nhìn thấy báo cáo vừa nộp của nhóm, Giảng viên sử dụng **Gemini AI Team Inspector** để quét và cho điểm sức khỏe dự án.
6. Giảng viên nhập ý kiến phản hồi tại form bên dưới và bấm gửi. Nhận xét này lập tức lưu vào database.
7. Đăng nhập tài khoản sinh viên bất kỳ, vào **Phòng Trưng Bày Dự Án** → Chọn nhóm của mình → Mục **Bình luận & Phản biện** sẽ thấy ngay nhận xét của Giảng viên vừa viết.

### 🎬 Kịch bản 4: Cơ Chế Xin Rời Nhóm Bảo Mật & Quản Lý Thành Viên
1. Đăng nhập tài khoản Thành viên **`bob@example.com`** (Bob đang thuộc nhóm của Alice).
2. Tại màn hình Dashboard, Bob nhấn **Yêu cầu rời nhóm** → Hệ thống tạo một yêu cầu xin rời nhóm ở trạng thái `pending` và gửi thông báo cho Trưởng nhóm Alice. Lúc này Bob vẫn nằm trong nhóm để đảm bảo công việc không bị gián đoạn.
3. Đăng nhập tài khoản Trưởng nhóm **`alice@example.com`**, truy cập trang **Quản lý thành viên (Team Management)** (Đảm bảo vai trò member của trưởng nhóm truy cập mượt mà không bị chuyển hướng).
4. Alice sẽ thấy thẻ cảnh báo màu đỏ hiển thị đơn xin rời nhóm của Bob. Alice nhấn **Đồng ý (Approve)** → Bob chính thức bị rút tên ra khỏi nhóm.
5. Alice cũng có thể thực hiện quản lý nhân sự: thêm thành viên mới hoặc điều chỉnh tên định hướng của nhóm tại đây.

### 🎬 Kịch bản 5: Chẩn Đoán Cố Vấn AI Toàn Năng (Global Project Audit)
1. Đăng nhập tài khoản Trưởng nhóm **`alice@example.com`**, truy cập mục **Phân tích/Cố vấn AI (Analytics)**.
2. Hệ thống sẽ hiển thị bảng đóng góp thực tế của các thành viên: Tỷ lệ hoàn thành công việc, số lượng đầu việc, và điểm đánh giá chéo từ đồng đội.
3. Nhấn **"Kích hoạt Chẩn đoán AI Toàn Năng"** → Trí tuệ nhân tạo sẽ quét qua: Business Model Canvas của nhóm, Slide outline, Báo cáo tuần, Tiến độ công việc và điểm Peer Evaluation của các thành viên để xuất ra báo cáo kiểm toán toàn diện 4 phần.
4. Nhập câu hỏi vào chatbot ở góc dưới: *"Tại sao điểm đóng góp của Trần Thị Bích lại thấp hơn Lê Hoàng Minh?"* hoặc *"Kế hoạch tài chính của nhóm đã hợp lý chưa?"* → AI Cố Vấn sẽ đọc dữ liệu và trả lời tức thì một cách chi tiết.

---
Chúc bạn có một buổi thuyết trình dự án thành công rực rỡ! 🚀
