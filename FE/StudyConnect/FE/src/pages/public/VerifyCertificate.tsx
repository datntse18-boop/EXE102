import { useState } from 'react'
import { projectService } from '../../services/apiServices'
import Card from '../../components/cards/Card'
import { ShieldCheck, XCircle, Search, Calendar, Award, User, RefreshCw, Link as LinkIcon, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function VerifyCertificate() {
  const [certId, setCertId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certId.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await projectService.verifyCert(certId)
      setResult(data)
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.message || 
        'Không tìm thấy chứng chỉ tương ứng hoặc mã xác thực không hợp lệ.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.06),transparent_65%)] pointer-events-none" />

      <div className="w-full max-w-2xl space-y-8 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-[#FF6B00] font-black text-xl hover:opacity-90">
            <span className="text-2xl">🎓</span> StudyConnect
          </Link>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2">
            Cổng Xác Thực Chứng Chỉ Khởi Nghiệp 🛡️
          </h1>
          <p className="text-xs text-gray-400 font-medium max-w-md mx-auto">
            Hệ thống kiểm tra chữ ký số mật mã xác thực tính chính danh của các dự án tốt nghiệp từ Vườn ươm tăng tốc khởi nghiệp StudyConnect.
          </p>
        </div>

        {/* Verification Form */}
        <Card className="bg-[#13131C] border border-gray-800 shadow-2xl p-6 rounded-3xl">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Nhập Mã Chứng Chỉ (Certificate ID)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Ví dụ: SC-A8F290B3"
                  value={certId}
                  onChange={e => setCertId(e.target.value)}
                  className="w-full bg-[#1C1C28]/80 border border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-[#FF6B00] text-white font-mono placeholder-gray-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-[#FF6B00] hover:shadow-lg text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang kiểm tra chữ ký số...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Xác minh chứng chỉ
                </>
              )}
            </button>
          </form>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div className="bg-[#13131C] border-2 border-emerald-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-fadeIn">
            
            {/* Valid Badge Overlay */}
            <div className="absolute top-6 right-6 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Check className="w-3.5 h-3.5" /> Đã xác thực chữ ký
            </div>

            <div className="flex gap-4 items-start border-b border-gray-850 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl shadow-sm shrink-0">
                🏆
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Mã chứng nhận</span>
                <span className="font-mono text-sm font-bold text-[#C5A880]">{result.certificateId}</span>
              </div>
            </div>

            {/* Certificate Meta Details */}
            <div className="grid md:grid-cols-2 gap-4 text-xs font-bold">
              <div className="space-y-1">
                <span className="text-gray-500 font-bold text-[10px] uppercase">Dự án tốt nghiệp</span>
                <p className="text-white text-xs font-black">{result.projectName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 font-bold text-[10px] uppercase">Nhóm khởi nghiệp</span>
                <p className="text-white text-xs font-black">{result.teamName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 font-bold text-[10px] uppercase">Thành viên sáng lập</span>
                <p className="text-white text-xs font-black leading-relaxed">
                  {result.founders.join(', ')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 font-bold text-[10px] uppercase">Ngày cấp chính thức</span>
                <p className="text-white text-xs font-black">{result.issueDate}</p>
              </div>
            </div>

            {/* Cryptographic Signature details */}
            <div className="bg-[#1C1C28]/60 border border-gray-850 p-4 rounded-2xl space-y-2.5 font-mono text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#FF6B00]" /> Trạng thái mã hóa:
                </span>
                <span className="text-emerald-400 font-extrabold">{result.status}</span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 block text-[9px] uppercase font-bold">Chữ ký số (SHA-256 Hash Signature)</span>
                <p className="text-gray-400 break-all leading-normal bg-black/30 p-2.5 rounded-xl border border-gray-900 select-all">
                  {result.cryptoHash}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-center gap-4 text-xs font-black">
          <Link to="/" className="text-gray-500 hover:text-white transition">
            ← Trở lại trang chủ
          </Link>
          <span className="text-gray-700">|</span>
          <Link to="/login" className="text-[#FF6B00] hover:underline transition">
            Đăng nhập Hệ thống →
          </Link>
        </div>

      </div>
    </div>
  )
}
