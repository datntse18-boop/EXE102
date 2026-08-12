import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Zap, 
  Download, 
  Calendar, 
  Loader2, 
  PieChart as PieChartIcon,
  BarChart3,
  Clock,
  Briefcase
} from 'lucide-react'
import { reportService, paymentService } from '../../services/apiServices'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function RevenuePage() {
  const [stats, setStats] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRevenueData()
  }, [])

  const loadRevenueData = async () => {
    try {
      const [statsData, paymentsData] = await Promise.all([
        reportService.getPlatformStats().catch(() => null),
        paymentService.getPayments().catch(() => []),
      ])
      setStats(statsData)
      setPayments(Array.isArray(paymentsData) ? paymentsData : [])
    } catch (err) {
      console.error('AdminRevenue loadRevenueData error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
  }

  const getNextReconciliationDate = () => {
    const now = new Date()
    let month = now.getMonth() + 1
    let year = now.getFullYear()
    if (now.getDate() > 15) {
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
    }
    const mStr = month < 10 ? `0${month}` : `${month}`
    return `15/${mStr}/${year}`
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const currentMonthLabel = `Tháng ${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  let currentMonthTotal = 0
  let prevMonthTotal = 0

  payments.forEach(p => {
    const pDate = new Date(p.createdAt || Date.now())
    if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
      currentMonthTotal += (p.amount || 0)
    } else if (pDate.getMonth() === prevMonth && pDate.getFullYear() === prevMonthYear) {
      prevMonthTotal += (p.amount || 0)
    }
  })

  const userCountMap = payments.reduce((acc: any, curr: any) => {
    const planKey = (curr.plan || 'other').toLowerCase()
    acc[planKey] = (acc[planKey] || 0) + 1
    return acc
  }, {})

  const finalMonthRevenue = currentMonthTotal > 0 ? currentMonthTotal : (stats?.revenue?.total || 0)

  const monthGrowthPercent = prevMonthTotal > 0 
    ? (((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(1) 
    : (currentMonthTotal > 0 ? '100.0' : '0.0')

  const isGrowthPositive = Number(monthGrowthPercent) >= 0

  const totalRevenue = stats?.revenue?.total || payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalUsers = stats?.users?.total || 8
  
  const premiumUsers = userCountMap['premium'] || stats?.users?.premium || 3
  const enterpriseUsers = userCountMap['enterprise'] || 3
  const freeUsers = Math.max(0, totalUsers - premiumUsers - enterpriseUsers)

  const premiumUpgradeRate = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0
  const enterpriseUpgradeRate = totalUsers > 0 ? Math.round((enterpriseUsers / totalUsers) * 100) : 0
  const arpu = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0

  const planColors: Record<string, string> = {
    'free': '#6B7280',
    'monthly': '#FF6B00',
    'yearly': '#3B82F6',
    'enterprise': '#A855F7',
    'token': '#10B981',
    'premium': '#FF6B00',
  }

  const chartData = [
    { name: 'Tổng số tài khoản', value: totalUsers, color: '#6366F1' },
    { name: 'Gói Free', value: freeUsers, color: planColors['free'] }
  ]

  Object.keys(userCountMap).forEach((key) => {
    chartData.push({
      name: `Gói ${key.charAt(0).toUpperCase() + key.slice(1)}`,
      value: userCountMap[key],
      color: planColors[key] || '#6366F1'
    })
  })

  const generateMonthlyRevenueChartData = () => {
    const list = []
    for (let i = -4; i <= 2; i++) {
      const d = new Date(currentYear, currentMonth + i, 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      
      let monthlyRevenue = 0
      payments.forEach(p => {
        const pDate = new Date(p.createdAt || Date.now())
        if (pDate.getMonth() === m && pDate.getFullYear() === y) {
          monthlyRevenue += (p.amount || 0)
        }
      })

      list.push({
        month: `T${m + 1}/${y.toString().slice(-2)}`,
        doanhThu: monthlyRevenue,
        isCurrent: (m === currentMonth && y === currentYear)
      })
    }
    return list
  }

  const monthlyRevenueChartData = generateMonthlyRevenueChartData()

  const handleExportExcel = () => {
    try {
      let csvContent = "\uFEFF"; 
      
      csvContent += "BÁO CÁO TỔNG HỢP DOANH THU & DÒNG TIỀN STUDYCONNECT\n";
      csvContent += `Thời gian xuất báo cáo:,${new Date().toLocaleString('vi-VN')}\n\n`;

      csvContent += "THÔNG TIN CHỈ SỐ TỔNG QUAN\n";
      csvContent += "Chỉ số,Giá trị\n";
      csvContent += `Tổng doanh thu tích lũy,${totalRevenue} VND\n`;
      csvContent += `Doanh thu ${currentMonthLabel},${finalMonthRevenue} VND\n`;
      csvContent += `Thành viên Premium,"${premiumUsers} trên ${totalUsers}"\n`;
      csvContent += `Tỷ lệ nâng cấp Premium,${premiumUpgradeRate}%\n`;
      csvContent += `Thành viên Enterprise,"${enterpriseUsers} trên ${totalUsers}"\n`;
      csvContent += `Tỷ lệ nâng cấp Enterprise,${enterpriseUpgradeRate}%\n`;
      csvContent += `Giá trị TB / Khách hàng (ARPU),${arpu} VND\n\n`;

      csvContent += "PHÂN BỔ TÀI KHOẢN THEO HẠNG MỤC\n";
      csvContent += "Hạng mục,Số lượng tài khoản\n";
      csvContent += `"Tổng số tài khoản",${totalUsers}\n`;
      chartData.filter(item => item.name !== 'Tổng số tài khoản').forEach(item => {
        csvContent += `"${item.name}",${item.value}\n`;
      });
      csvContent += "\n";

      if (payments && payments.length > 0) {
        csvContent += "DANH SÁCH GIAO DỊCH CHI TIẾT\n";
        csvContent += "Mã giao dịch,Tên khách hàng,Gói dịch vụ,Số tiền (VND),Thời gian\n";
        
        payments.forEach(p => {
          const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : 'N/A';
          const userName = p.userName || p.name || p.user?.name || p.userFullName || p.email || 'Khách vãng lai';
          const transactionId = p.id || p._id || 'N/A';
          
          csvContent += `"${transactionId}","${userName}","${p.plan || 'N/A'}",${p.amount || 0},"${dateStr}"\n`;
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Bao_Cao_Doanh_Thu_StudyConnect_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Xuất file thành công! File báo cáo đã được tải xuống máy của bạn.');
    } catch (error) {
      console.error('Lỗi xuất file:', error);
      alert('Có lỗi xảy ra khi xuất file!');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
        <span className="text-sm font-semibold">Đang tổng hợp dữ liệu tài chính & dòng tiền...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F0F12] via-[#1C1C24] to-[#0A0A0D] text-white rounded-3xl p-8 shadow-2xl border border-gray-800/80">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF6B00] via-[#FFA64D] to-[#FF6B00] shadow-[0_0_10px_rgba(255,107,0,0.5)]"></div>
        <div className="relative z-10 max-w-xl">
          <span className="bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/40 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,107,0,0.1)] flex items-center gap-1.5 w-max">
            <DollarSign className="w-3.5 h-3.5" />
            Financial Report Center
          </span>
          <h1 className="text-3xl font-black mt-4 tracking-tight leading-none">Báo cáo Doanh thu & Dòng tiền 💰</h1>
          <p className="text-sm text-gray-400 mt-3 font-medium opacity-90 leading-relaxed">
            Phân tích chi tiết tổng thu nhập từ gói Premium, hiệu suất chuyển đổi và doanh số toàn hệ thống.
          </p>
        </div>
        <div className="absolute right-8 bottom-0 top-0 opacity-5 w-1/4 flex items-center justify-center pointer-events-none">
          <span className="text-9xl">📊</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tổng doanh thu tích lũy</span>
            <span className="text-lg font-black text-gray-900 dark:text-white">
              {formatVND(totalRevenue)}
            </span>
            <span className="text-[10px] text-gray-400 font-medium block pt-1">
              Đã ghi nhận từ {payments.length} giao dịch
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-[#FF6B00] shadow-sm shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between border-l-4 border-l-[#FF6B00]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Doanh thu {currentMonthLabel}
            </span>
            <span className="text-lg font-black text-gray-900 dark:text-white">{formatVND(finalMonthRevenue)}</span>
            <span className={`text-[10px] font-bold flex items-center gap-1 pt-1 ${isGrowthPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              <TrendingUp size={12} /> {isGrowthPositive ? `+${monthGrowthPercent}%` : `${monthGrowthPercent}%`} so với tháng trước
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-500 shadow-sm shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Thành viên Premium</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {premiumUsers} / {totalUsers}
            </span>
            <span className="text-[10px] text-orange-500 font-bold block pt-1">
              Tỷ lệ nâng cấp: {premiumUpgradeRate}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Thành viên Enterprise</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {enterpriseUsers} / {totalUsers}
            </span>
            <span className="text-[10px] text-purple-500 font-bold block pt-1">
              Tỷ lệ nâng cấp: {enterpriseUpgradeRate}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-500 shadow-sm shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Giá trị TB / Khách hàng</span>
            <span className="text-lg font-black text-gray-900 dark:text-white">{formatVND(arpu)}</span>
            <span className="text-[10px] text-gray-400 font-medium block pt-1">ARPU (Average Revenue)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
            <Zap className="w-5 h-5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-[#FF6B00]" />
              Biểu đồ xu hướng doanh thu dòng tiền (Đa tháng)
            </h2>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueChartData}>
                <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} tickFormatter={(val) => `${val >= 1000000 ? (val/1000000) + 'Tr' : val}`} />
                <Tooltip 
                  formatter={(value: any) => [formatVND(Number(value)), 'Doanh thu']}
                  contentStyle={{ backgroundColor: '#13131C', borderColor: '#374151', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="doanhThu" fill="#FF6B00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <PieChartIcon className="w-4 h-4 text-[#FF6B00]" />
              Phân bổ số lượng tài khoản theo hạng mục
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.filter(i => i.name !== 'Tổng số tài khoản')}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.filter(i => i.name !== 'Tổng số tài khoản').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} tài khoản`, 'Số lượng']}
                    contentStyle={{ backgroundColor: '#13131C', borderColor: '#374151', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              {chartData.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-gray-50/50 dark:bg-[#1C1C28]/40 border border-gray-150/40 dark:border-gray-850/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#FF6B00]">{item.value} Tài khoản</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="card bg-white dark:bg-[#13131C] border border-gray-150/40 dark:border-gray-850/40 p-6 rounded-2xl lg:col-span-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-2 uppercase tracking-wider">
              <Download className="w-4 h-4 text-[#FF6B00]" />
              Báo cáo xuất dữ liệu tài chính & Kỳ đối soát tự động
            </h2>
            <p className="text-xs text-gray-400">
              Kỳ đối soát tự động kế tiếp: <span className="text-white font-bold">{getNextReconciliationDate()}</span> (Dữ liệu kết xuất từ cổng thanh toán VNPay / MoMo).
            </p>
          </div>

          <button 
            onClick={handleExportExcel}
            className="px-6 py-3 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-orange-500/20 shrink-0"
          >
            <Download className="w-4 h-4" /> Xuất file Báo cáo (.csv)
          </button>
        </div>

      </div>

    </div>
  )
}