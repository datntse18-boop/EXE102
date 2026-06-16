import { Link } from 'react-router-dom'
import { Sparkles, Users, Calendar, TrendingUp } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#060608] text-gray-300 relative overflow-hidden font-sans">
      
      {/* Abstract Background Blurs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative text-center pt-24 pb-20 max-w-4xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/15 text-[#FF6B00] text-xs font-bold mb-6 animate-pulse">
          <Sparkles size={12} />
          <span>Nền tảng Quản lý & Cố vấn Dự án EXE thông minh</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none mb-6">
          Kết nối Học viên & <br />
          <span className="bg-gradient-to-r from-[#FF6B00] via-[#FF801A] to-amber-400 bg-clip-text text-transparent">
            Khởi nghiệp EXE Đỉnh cao
          </span>
        </h1>
        
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Giải pháp chuyển đổi số toàn diện cho học phần EXE. Giúp sinh viên tìm kiếm đồng đội, 
          lên ý tưởng bằng AI, chuẩn hóa mô hình kinh doanh và kết nối trực tiếp với Giảng viên & Mentor.
        </p>

        <div className="flex justify-center gap-4">
          <Link 
            to="/register" 
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#FF801A] text-white text-sm font-bold shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 hover:-translate-y-0.5 active:translate-y-0 transition duration-200"
          >
            Bắt đầu miễn phí
          </Link>
          <Link 
            to="/pricing" 
            className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold transition duration-200"
          >
            Bảng giá dịch vụ
          </Link>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black text-white">Tính năng cốt lõi cho Dự án</h2>
          <p className="text-xs text-gray-500 mt-2">Được thiết kế chuẩn cấu trúc môn học EXE thực chiến</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-[#0B0B0F]/80 border border-[#161622] rounded-3xl p-6 hover:border-orange-500/30 transition duration-300 shadow-xl group">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
              <Sparkles size={18} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2.5">AI Ý tưởng & Mentor</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Gemini 2.5 Flash hỗ trợ nghiên cứu vấn đề, đề xuất ý tưởng đột phá và cố vấn phản biện 24/7.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0B0B0F]/80 border border-[#161622] rounded-3xl p-6 hover:border-orange-500/30 transition duration-300 shadow-xl group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2.5">Bộ công cụ Startup</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Thiết lập Business Model Canvas (BMC), biểu đồ OKRs, dự toán tài chính và báo cáo tuần tự động.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0B0B0F]/80 border border-[#161622] rounded-3xl p-6 hover:border-orange-500/30 transition duration-300 shadow-xl group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
              <Calendar size={18} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2.5">Đặt lịch & Đánh giá</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Đồng bộ lịch hẹn với Giảng viên, viết sổ tay biên bản, chấm điểm học phần và tự đánh giá chéo.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-[#0B0B0F]/80 border border-[#161622] rounded-3xl p-6 hover:border-orange-500/30 transition duration-300 shadow-xl group">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
              <Users size={18} />
            </div>
            <h3 className="text-sm font-bold text-white mb-2.5">Mạng lưới Cộng đồng</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Giao lưu dự án xuất sắc, kêu gọi vốn ảo (Crowdfunding), tuyển dụng nhân sự chéo giữa các nhóm.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative max-w-4xl mx-auto px-6 py-16 text-center border-t border-[#161622] mt-10">
        <h2 className="text-2xl font-black text-white mb-4">Cách thức vận hành</h2>
        <p className="text-xs text-gray-400 leading-relaxed max-w-2xl mx-auto">
          Đăng ký tài khoản học viên, gia nhập lớp học bằng Mã lớp (Class Code), lập nhóm startup của riêng bạn, 
          sử dụng bộ công cụ AI thông minh và đồng hành cùng Mentor để biến ý tưởng thành sản phẩm thương mại thực tế.
        </p>
      </section>

    </div>
  )
}
