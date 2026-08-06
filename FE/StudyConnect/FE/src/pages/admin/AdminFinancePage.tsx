import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, Download, Filter } from 'lucide-react'

export default function AdminFinancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#13131C] to-[#0B0B0F] border border-orange-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
            FINANCE & REVENUE CENTER
          </span>
          <h1 className="text-2xl font-black text-white mt-2 flex items-center gap-2">
            Báo cáo Tài chính & Doanh thu <DollarSign className="w-6 h-6 text-[#FF6B00]" />
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Quản lý dòng tiền, theo dõi doanh thu gói Premium và lịch sử thanh toán toàn hệ thống.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-[#13131C] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Tổng doanh thu</p>
            <h3 className="text-2xl font-black text-white mt-1">2.384.300 ₫</h3>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <ArrowUpRight size={12} /> +15.4% so với tháng trước
            </span>
          </div>
          <div className="p-3 bg-orange-500/10 text-[#FF6B00] rounded-xl border border-orange-500/20">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card bg-[#13131C] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Giao dịch tháng này</p>
            <h3 className="text-2xl font-black text-white mt-1">42 lượt</h3>
            <span className="text-[10px] text-gray-400 mt-1 block">
              Trung bình 56.700 ₫ / đơn
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="card bg-[#13131C] border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Tỷ lệ nâng cấp Premium</p>
            <h3 className="text-2xl font-black text-white mt-1">43%</h3>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> Tăng trưởng ổn định
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="card bg-[#13131C] border border-gray-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#FF6B00]" />
            Lịch sử giao dịch gần đây
          </h2>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-semibold border border-white/10 transition">
            <Download size={14} /> Xuất Báo Cáo
          </button>
        </div>

        {/* Bảng nhật ký giao dịch */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Gói dịch vụ</th>
                <th className="p-3">Số tiền</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-white/5 transition">
                <td className="p-3 font-semibold text-white">Nguyễn Văn A</td>
                <td className="p-3">Premium Tháng</td>
                <td className="p-3 text-emerald-400 font-bold">99.000 ₫</td>
                <td className="p-3 text-gray-400">07/08/2026 09:30</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Thành công
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition">
                <td className="p-3 font-semibold text-white">Trần Thị B</td>
                <td className="p-3">Premium Năm</td>
                <td className="p-3 text-emerald-400 font-bold">899.000 ₫</td>
                <td className="p-3 text-gray-400">06/08/2026 14:15</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Thành công
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}