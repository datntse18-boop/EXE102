import { useEffect, useState, useRef } from 'react'
import { teamService, projectService } from '../../services/apiServices'
import { useAuth } from '../../contexts/AuthContext'
import { Award, ShieldCheck, Download, Printer, Crown, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StartupCertificate() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [founderName, setFounderName] = useState(user?.name || '')
  const [issueDate, setIssueDate] = useState(new Date().toLocaleDateString('vi-VN'))

  const isPremium = user?.subscription === 'premium' || user?.subscription === 'enterprise' || user?.role === 'admin'

  // Load teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getTeams()
        setTeams(data)
        if (data.length > 0) {
          setSelectedTeamId(data[0].id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchTeams()
  }, [])

  // Load project
  useEffect(() => {
    if (!selectedTeamId) return
    const fetchProject = async () => {
      setLoading(true)
      try {
        const projData = await projectService.getProjects({ teamId: selectedTeamId })
        if (projData.length > 0) {
          setProject(projData[0])
        } else {
          setProject(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [selectedTeamId])

  const handlePrint = () => {
    window.print()
  }

  if (!isPremium) {
    return (
      <div className="bg-[#13131C] border border-orange-500/20 rounded-3xl p-10 text-center max-w-xl mx-auto space-y-6 shadow-2xl relative overflow-hidden my-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,0,0.08),transparent_60%)] pointer-events-none" />
        <div className="inline-flex p-3 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF6B00] animate-bounce">
          <Crown className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF6B00]" />
            Tính Năng Premium Pro
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
            Chứng nhận Khởi nghiệp là tính năng dành riêng cho thành viên gói **Pro Premium**. 
            Hãy nâng cấp tài khoản để cấp chứng chỉ chính thức cho dự án của bạn!
          </p>
        </div>
        <div>
          <Link 
            to="/pricing"
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white rounded-xl text-xs font-bold hover:shadow-lg transition hover:-translate-y-0.5"
          >
            Nâng cấp gói Premium
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10 print-container">
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, nav, header, button, .no-print, .top-nav, .sidebar {
            display: none !important;
          }
          .cert-outer-border {
            border: 10px double #C5A880 !important;
            background: #0B0B0F !important;
            color: white !important;
            padding: 40px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* Editor & Actions panel */}
      <div className="bg-white dark:bg-[#13131C] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 no-print">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-[#FF6B00]" />
          Cấu hình Chứng nhận Khởi nghiệp của bạn
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-gray-500 font-bold mb-1">Chọn nhóm dự án:</label>
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#FF6B00]"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-500 font-bold mb-1">Tên người sáng lập:</label>
            <input
              type="text"
              value={founderName}
              onChange={e => setFounderName(e.target.value)}
              placeholder="Nhập tên người nhận..."
              className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handlePrint}
              disabled={loading || !project}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-[#FF6B00] text-white rounded-xl text-xs font-bold hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              In / Tải PDF Chứng nhận
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-gray-400 no-print">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00] mr-2" /> Đang thiết lập phôi bằng...
        </div>
      ) : !project ? (
        <div className="bg-white dark:bg-[#13131C] rounded-2xl border border-gray-100 dark:border-gray-800 p-20 flex flex-col items-center justify-center text-center text-gray-400 shadow-sm no-print">
          <AlertCircle className="w-12 h-12 text-gray-250 dark:text-gray-700 mb-3" />
          <h4 className="font-bold text-gray-750 dark:text-gray-300 text-xs">Không tìm thấy dự án</h4>
          <p className="text-[10px] text-gray-400 mt-1">Nhóm của bạn cần khởi tạo 1 dự án để cấp chứng nhận.</p>
        </div>
      ) : (
        /* Certificate Preview */
        <div className="max-w-3xl mx-auto">
          {/* Certificate Container */}
          <div className="cert-outer-border bg-[#0B0B0F] border-[12px] border-double border-[#C5A880] rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden shadow-2xl min-h-[500px] flex flex-col justify-between select-none">
            
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.05),transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-[#C5A880]/40 rounded-tl-xl m-4" />
            <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-[#C5A880]/40 rounded-tr-xl m-4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-[#C5A880]/40 rounded-bl-xl m-4" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-[#C5A880]/40 rounded-br-xl m-4" />

            {/* Header logo / seal */}
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C5A880] to-[#E3CBB0] text-[#0B0B0F] flex items-center justify-center shadow-lg border-4 border-[#0B0B0F] outline outline-1 outline-[#C5A880]">
                <Award className="w-7 h-7" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#C5A880]">
                StudyConnect Accelerator Program
              </span>
            </div>

            {/* Title */}
            <div className="space-y-3 my-6 relative z-10">
              <h1 className="text-3xl md:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-[#E3CBB0] via-[#C5A880] to-[#E3CBB0] tracking-wide uppercase leading-none">
                Chứng Nhận Tốt Nghiệp
              </h1>
              <p className="text-[10px] italic text-gray-400 uppercase tracking-widest">
                Startup Incubator Completion Certificate
              </p>
            </div>

            {/* Body */}
            <div className="space-y-4 relative z-10 max-w-xl mx-auto my-2 text-xs">
              <p className="text-gray-400 italic">Chứng nhận này được trao một cách trang trọng cho</p>
              <h2 className="text-xl md:text-2xl font-black font-serif text-white border-b border-[#C5A880]/30 pb-2 tracking-wide">
                {founderName}
              </h2>
              <p className="text-gray-300 leading-relaxed font-medium">
                Đồng sáng lập dự án <strong className="text-[#C5A880] font-black">{project.name}</strong> thuộc nhóm <strong className="text-white">{teams.find(t => t.id === selectedTeamId)?.name || 'N/A'}</strong>. 
                Đã hoàn thành xuất sắc tất cả các giai đoạn ươm tạo, bao gồm thiết lập mô hình kinh doanh Canvas AI, khảo sát thị trường thực nghiệm, phân tích tài chính khả thi, và pitching gọi vốn xuất sắc tại Demo Day.
              </p>
            </div>

            {/* Signature & Date */}
            <div className="flex justify-between items-end mt-10 relative z-10 text-xs px-4">
              <div className="text-left space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Ngày cấp</span>
                <span className="font-mono text-gray-300 font-bold">{issueDate}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-1 text-emerald-400">
                  <ShieldCheck className="w-9 h-9" />
                </div>
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider block">Xác thực Blockchain</span>
                <span className="text-[7px] text-[#C5A880] font-mono">ID: SC-{project.id.toUpperCase().substring(0, 8)}</span>
              </div>

              <div className="text-right space-y-1.5">
                <div className="font-serif italic text-sm text-[#C5A880] mr-2">StudyConnect AI</div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block border-t border-gray-800 pt-1">
                  Đại diện Ban Điều Hành
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
