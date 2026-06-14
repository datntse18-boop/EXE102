import { useState } from 'react'
import Card from '../../components/cards/Card'

export default function Syllabus() {
  const [activeCourse, setActiveCourse] = useState<'exe101' | 'exe201'>('exe101')

  const exe101 = {
    code: 'EXE101',
    name: 'Experiential Entrepreneurship 1 - Trải nghiệm khởi nghiệp 1',
    credits: 3,
    prerequisite: 'Không có',
    allocation: '150 giờ (15h online tự học, 10 buổi lên lớp x 2.25h, 3 buổi seminar x 2.25h, 2 buổi mentoring x 2.25h, 102h tự học)',
    description: 'Môn học cung cấp kiến thức nền tảng và bài học thực tế để khởi nghiệp hiệu quả. Học viên được chia nhóm từ 4-6 người từ ít nhất 2 chuyên ngành khác nhau, cùng nhau lên ý tưởng, làm nghiên cứu thị trường, xây dựng Business Model Canvas, lập nguyên mẫu thử nghiệm và thuyết trình dự án.',
    tasks: [
      'Tham gia tối thiểu 80% thời gian lên lớp, seminar và mentoring.',
      'Làm bài tập cá nhân và nhóm đầy đủ, nộp đúng hạn.',
      'Thành lập nhóm 4-6 thành viên (bắt buộc tối thiểu 2 chuyên ngành khác nhau).',
      'Đọc tài liệu Y Combinator Startup School và sách The Lean Startup.'
    ],
    assessments: [
      { name: 'Constructivism Presentations', weight: '15%', criteria: 'Lên lớp và tranh biện các câu hỏi thảo luận hàng tuần cá nhân/nhóm.' },
      { name: 'Group Assignment 1 (Checkpoint 1)', weight: '10%', criteria: 'Thành lập nhóm, phân chia vai trò (CEO, CTO, CMO,...) và thuyết trình chọn ý tưởng khởi nghiệp.' },
      { name: 'Group Assignment 2 (Checkpoint 2)', weight: '20%', criteria: 'Xác định vấn đề & Khảo sát thị trường: Thực hiện khảo sát > 100 khách hàng hoặc phỏng vấn 2 chuyên gia ngành; phân tích quy mô thị trường (TAM, SAM, SOM) và đối thủ cạnh tranh.' },
      { name: 'Group Assignment 3 (Checkpoint 3)', weight: '15%', criteria: 'Mô tả chi tiết sản phẩm/dịch vụ, công cụ công nghệ và xây dựng bản đồ mô hình kinh doanh Canvas (BMC).' },
      { name: 'Presentation (Checkpoint 4)', weight: '40%', criteria: 'Xây dựng Pitch Deck sơ bộ và thuyết trình thuyết phục trước hội đồng giám khảo (Giảng viên & Mentor).' }
    ],
    sessions: [
      { no: 1, name: 'Week 1: Spark and nurture entrepreneurial spirit', type: 'Instructor Coaching', tasks: 'Xem video Sam Altman - Why to Start a Startup; Thành lập nhóm 4-6 người (từ 2+ chuyên ngành).' },
      { no: 2, name: 'Week 1: Seminar 1 - Be Successful in Your Own Way', type: 'Guest Speaker', tasks: 'Giao lưu với doanh nhân khách mời, đặt câu hỏi thực tế.' },
      { no: 3, name: 'Week 2: Form a Winning Team', type: 'Instructor Coaching', tasks: 'Xem video YC - How to Find the Right Co-founder; Thảo luận phân chia vai trò và chuẩn bị ý tưởng.' },
      { no: 4, name: 'Week 3: Develop and Evaluate a Startup Idea', type: 'Instructor Coaching', tasks: 'Thuyết trình ý tưởng khởi nghiệp trước lớp; Xem video YC - How to Evaluate Startup Ideas.' },
      { no: 5, name: 'Week 3: Seminar 2 - Choosing a Startup Idea', type: 'Guest Speaker', tasks: 'Lắng nghe khách mời chia sẻ kinh nghiệm chọn và thẩm định ý tưởng.' },
      { no: 6, name: 'Week 3: Mentoring 1', type: 'Mentor Session', tasks: 'Họp với Mentor của nhóm để nhận định hướng ban đầu cho ý tưởng.' },
      { no: 7, name: 'Week 4: Understand Customer and Find Market-fit', type: 'Instructor Coaching', tasks: 'Xem video YC - How to Talk to Users; Chuẩn bị bảng câu hỏi khảo sát khách hàng.' },
      { no: 8, name: 'Week 5: Market Research', type: 'Instructor Coaching', tasks: 'Thuyết trình kết quả nghiên cứu thị trường của nhóm (Pain points, TAM/SAM/SOM, đối thủ).' },
      { no: 9, name: 'Week 5: Mentoring 2', type: 'Mentor Session', tasks: 'Mentor đánh giá kết quả khảo sát và chỉnh sửa định vị giá trị sản phẩm.' },
      { no: 10, name: 'Week 6: Build Product & MVP Plan', type: 'Instructor Coaching', tasks: 'Xem video YC - How to Plan an MVP; Lên kế hoạch phát triển nguyên mẫu thử nghiệm.' },
      { no: 11, name: 'Week 6: Mentoring 3', type: 'Mentor Session', tasks: 'Phát triển mô tả sản phẩm và nhận góp ý về kỹ thuật tạo prototype.' },
      { no: 12, name: 'Week 7: Business Model', type: 'Instructor Coaching', tasks: 'Xem video YC - Pricing 101; Xây dựng bản mô hình kinh doanh Canvas (BMC).' },
      { no: 13, name: 'Week 8: Fundraising', type: 'Instructor Coaching', tasks: 'Xem video YC - Modern Startup Funding; Tìm hiểu quy trình gọi vốn hạt giống (Seed round).' },
      { no: 14, name: 'Week 8: Seminar 3 - MVP & Shorten Time-To-Market', type: 'Guest Speaker', tasks: 'Seminar chuyên đề về rút ngắn thời gian đưa sản phẩm ra thị trường.' },
      { no: 15, name: 'Week 8: Mentoring 4', type: 'Mentor Session', tasks: 'Mentor đánh giá mô hình kinh doanh và chiến lược định giá sản phẩm.' },
      { no: 16, name: 'Week 9: Manage a Startup & Finances', type: 'Instructor Coaching', tasks: 'Tìm hiểu về pháp lý khởi nghiệp, cách quản lý tài chính dòng tiền.' },
      { no: 17, name: 'Week 9: Mentoring 5', type: 'Mentor Session', tasks: 'Mentor duyệt Pitch Deck thử nghiệm và chuẩn bị cho buổi bảo vệ.' },
      { no: 18, name: 'Week 10: Pitching presentation', type: 'Final Defense', tasks: 'Thuyết trình dự án và trình diễn prototype trước hội đồng chấm điểm để qua môn.' }
    ]
  }

  const exe201 = {
    code: 'EXE201',
    name: 'Experiential Entrepreneurship 2 - Trải nghiệm khởi nghiệp 2',
    credits: 3,
    prerequisite: 'EXE101',
    allocation: '150 giờ (Phát triển sản phẩm và trực tiếp bán hàng/tiếp cận khách hàng thực tế)',
    description: 'Học viên tiếp tục phát triển sản phẩm/dịch vụ từ ý tưởng của EXE101, triển khai chiến dịch tiếp cận khách hàng, chạy các kênh quảng cáo, đo lường KPI bán hàng và nộp chứng cứ doanh thu (proof of sales) thực tế.',
    tasks: [
      'Tham gia tối thiểu 80% thời gian lên lớp và mentoring.',
      'Sản xuất phiên bản sản phẩm chạy tốt và có thể đưa ra thị trường bán.',
      'Thu thập ít nhất 10 khách hàng đầu tiên và phân tích phản hồi của họ.',
      'Nộp kết quả bán hàng kèm chứng từ đối chiếu (Hóa đơn, sao kê ngân hàng,...).'
    ],
    assessments: [
      { name: 'Outcome 1: Product/Service Demonstration', weight: '40%', criteria: 'Trình diễn sản phẩm/dịch vụ thực tế chạy ổn định và sẵn sàng tung ra thị trường.' },
      { name: 'Outcome 2: Customer Acquisition Plan', weight: '20%', criteria: 'Bản kế hoạch tiếp cận khách hàng và thuyết trình về các kênh phân phối lựa chọn.' },
      { name: 'Outcome 3: Sales Results & Proofs', weight: '40%', criteria: 'Báo cáo kết quả doanh thu thực tế, hóa đơn, bằng chứng thanh toán và thuyết trình bài học kinh nghiệm rút ra.' }
    ],
    sessions: [
      { no: 1, name: 'Week 1: Design for Startups - Part 1', type: 'Instructor Coaching', tasks: 'Xem video YC - Design for Startups; Trình bày kế hoạch thực thi và timeline của nhóm.' },
      { no: 2, name: 'Week 1: Seminar 1 - Scaling & Execution', type: 'Guest Speaker', tasks: 'Lắng nghe khách mời chia sẻ về chuyển giao từ ý tưởng sang vận hành.' },
      { no: 3, name: 'Week 2: Design for Startups - Part 2', type: 'Instructor Coaching', tasks: 'Báo cáo tiến trình xây dựng sản phẩm và thử nghiệm giao diện thực tế.' },
      { no: 4, name: 'Week 3: Building Product & Launch channels', type: 'Instructor Coaching', tasks: 'Chuẩn bị danh sách các kênh phân phối sẽ chạy thử nghiệm (Social, Website, Direct).' },
      { no: 5, name: 'Week 3: Seminar 2 - Product Development', type: 'Guest Speaker', tasks: 'Seminar cách tối ưu hóa sản phẩm dựa trên trải nghiệm người dùng.' },
      { no: 6, name: 'Week 3: Mentoring 1', type: 'Mentor Session', tasks: 'Mentoring về thiết kế giao diện/quy trình và chiến lược tiếp cận khách hàng.' },
      { no: 7, name: 'Week 4: How to Launch (Again and Again)', type: 'Instructor Coaching', tasks: 'Xem video YC - How to Launch; Báo cáo chọn kênh chính thức để tung sản phẩm.' },
      { no: 8, name: 'Week 5: How to get your first ten customers', type: 'Instructor Coaching', tasks: 'Báo cáo Outcome 2: Trình bày tình hình ra mắt sản phẩm (phản hồi khách hàng đầu tiên).' },
      { no: 9, name: 'Week 5: Mentoring 2', type: 'Mentor Session', tasks: 'Mentor tư vấn cách giải quyết khó khăn khi tiếp cận 10 khách hàng đầu.' },
      { no: 10, name: 'Week 6: How to Get Users and Grow', type: 'Instructor Coaching', tasks: 'Triển khai tiếp cận khách hàng diện rộng; Cải tiến sản phẩm theo phản hồi.' },
      { no: 11, name: 'Week 6: Mentoring 3', type: 'Mentor Session', tasks: 'Mentor đánh giá chỉ số tăng trưởng và tư vấn cách tối ưu chi phí tiếp thị.' },
      { no: 12, name: 'Week 7: How to Sell', type: 'Instructor Coaching', tasks: 'Gửi khảo sát lấy ý kiến của tối thiểu 20 người dùng thực tế; Phân tích dữ liệu phản hồi.' },
      { no: 13, name: 'Week 8: How to Set KPIs and Goals', type: 'Instructor Coaching', tasks: 'Xác định các chỉ số đo lường hiệu quả cốt lõi (KPIs) và lập báo cáo cải tiến.' },
      { no: 14, name: 'Week 8: Seminar 3 - Startup Fundraising & Sales', type: 'Guest Speaker', tasks: 'Giao lưu về quy trình bán hàng B2B/B2C và nghệ thuật chốt hợp đồng.' },
      { no: 15, name: 'Week 8: Mentoring 4', type: 'Mentor Session', tasks: 'Mentor kiểm tra số liệu doanh thu thực tế và định hướng báo cáo tài chính.' },
      { no: 16, name: 'Week 9: Growth for Startups', type: 'Instructor Coaching', tasks: 'Trình bày kết quả tăng trưởng, lập báo cáo cuối kỳ.' },
      { no: 17, name: 'Week 9: Mentoring 5', type: 'Mentor Session', tasks: 'Duyệt Pitch Deck kết quả kinh doanh cuối cùng.' },
      { no: 18, name: 'Week 10: Final Evaluation', type: 'Final Defense', tasks: 'Thuyết trình kết quả dự án khởi nghiệp và chứng từ doanh thu thực tế trước hội đồng giám khảo.' }
    ]
  }

  const course = activeCourse === 'exe101' ? exe101 : exe201

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Syllabus</h1>
          <p className="text-sm text-gray-500">Thông tin chương trình học Experiential Entrepreneurship (EXE)</p>
        </div>
        
        {/* Course Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveCourse('exe101')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${activeCourse === 'exe101' ? 'bg-[#FF6B00] text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
          >
            EXE101
          </button>
          <button
            onClick={() => setActiveCourse('exe201')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${activeCourse === 'exe201' ? 'bg-[#FF6B00] text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}
          >
            EXE201
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left/Middle Column: Description and sessions */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-[#FF6B00]">
              📚 {course.name} ({course.code})
            </h2>
            <div className="space-y-4 text-sm text-gray-700">
              <p>{course.description}</p>
              
              <div className="grid grid-cols-2 gap-4 bg-[#FFF4E8] p-4 rounded-lg border border-[#FFE0C2]">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">Số tín chỉ</span>
                  <strong className="text-gray-800">{course.credits} Tín chỉ</strong>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">Môn tiên quyết</span>
                  <strong className="text-gray-800">{course.prerequisite}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-500 font-semibold block">Phân bổ thời gian</span>
                  <strong className="text-gray-800">{course.allocation}</strong>
                </div>
              </div>
            </div>
          </Card>

          {/* Session details */}
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-[#FF6B00]">
              📅 Lịch trình chi tiết các buổi học
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {course.sessions.map(s => (
                <div key={s.no} className="p-3 rounded-lg border border-gray-100 hover:bg-[#FFF4E8]/20 transition flex items-start gap-3">
                  <span className="font-bold text-xs bg-[#FF6B00] text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {s.no}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800">{s.name}</h4>
                    <span className="text-[10px] font-semibold text-[#FF6B00] bg-[#FFF4E8] px-1.5 py-0.5 rounded inline-block mt-1">
                      {s.type}
                    </span>
                    <p className="text-xs text-gray-600 mt-2"><strong>Nhiệm vụ sinh viên:</strong> {s.tasks}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Student tasks and Assessments */}
        <div className="md:col-span-1 space-y-6">
          {/* Student tasks */}
          <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              📌 Nhiệm vụ cốt lõi
            </h2>
            <ul className="space-y-2 text-xs text-gray-700">
              {course.tasks.map((t, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-[#FF6B00]">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Assessments */}
          <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              🎯 Cách tính điểm môn học
            </h2>
            <div className="space-y-4">
              {course.assessments.map((a, i) => (
                <div key={i} className="text-xs border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center font-bold mb-1">
                    <span className="text-gray-800">{a.name}</span>
                    <span className="text-[#FF6B00] bg-[#FFF4E8] px-1.5 py-0.5 rounded">{a.weight}</span>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">{a.criteria}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
