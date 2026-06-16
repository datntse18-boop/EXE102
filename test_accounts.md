# 🔑 DANH SÁCH TÀI KHOẢN THỬ NGHIỆM (DEMO ACCOUNTS)

Dưới đây là danh sách các tài khoản có sẵn trong cơ sở dữ liệu để bạn kiểm thử các vai trò (roles) khác nhau trong hệ thống StudyConnect. 

> [!NOTE]
> Mật khẩu mặc định cho tất cả các tài khoản dưới đây là: **`password123`**

---

## 📋 Thông tin chi tiết các tài khoản

| Vai trò (Role) | Họ và tên | Email đăng nhập | Trang giao diện chính | Mô tả quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Giảng viên (Manager)** | Carol Williams | `carol@example.com` | `/manager` | Giám sát các nhóm lớp học, theo dõi báo cáo tuần, mở lịch hẹn cố vấn (mentorship), chấm điểm & xem sổ điểm lớp học. |
| **Quản trị IT (Admin)** | David Brown | `david@example.com` | `/admin` | Toàn quyền kiểm soát hệ thống, quản lý tài khoản người dùng, cấu hình gói dịch vụ (subscriptions), theo dõi dòng tiền & báo cáo. |
| **Quản lý (Dean / Leader)** | Emma Davis | `emma@example.com` | `/dashboard` | Trưởng khoa / Quản lý chung. Xem báo cáo tuần toàn khoa, sổ điểm toàn khoa, và danh sách trưng bày các dự án nổi bật. |
| **Sinh viên (Member)** | Alice Johnson | `alice@example.com` | `/dashboard` | Sinh viên / Học viên. Tham gia nhóm, sử dụng công cụ thiết lập ý tưởng bằng AI (Idea Generator), bảng công việc Kanban, nộp báo cáo tuần & đặt lịch hẹn cố vấn. |
| **Trưởng nhóm (Student Leader)** | Bob Smith | `bob@example.com` | `/dashboard` | Sinh viên làm trưởng nhóm EduMatch AI. Có thêm quyền quản lý thành viên nhóm và kết nối nhóm vào lớp học. |

---

## 💡 Hướng dẫn đăng nhập
1. Truy cập trang đăng nhập tại: [http://localhost:5173/login](http://localhost:5173/login)
2. Nhập Email tương ứng ở bảng trên.
3. Nhập mật khẩu: `password123`
4. Hệ thống sẽ tự động xác thực và đưa bạn đến trang giao diện phù hợp với vai trò của tài khoản đó.
