import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { getGeminiModel } from '../utils/gemini'

// GET /api/financial/:projectId hoặc /api/projects/:projectId/financial
export const getFinancialModel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    let financial = await prisma.financialModel.findUnique({
      where: { projectId }
    })

    if (!financial) {
      financial = await prisma.financialModel.create({
        data: {
          projectId,
          fixedCosts: 0,
          variableCosts: 0,
          sellingPrice: 0,
          projectedSales: 0,
          cac: 0,
          ltv: 0
        }
      })
    }

    res.json({ success: true, data: financial })
  } catch (err) {
    console.error('Get Financial Model Error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PUT /api/financial/:projectId hoặc /api/projects/:projectId/financial
export const saveFinancialModel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    const { fixedCosts, variableCosts, sellingPrice, projectedSales, cac, ltv, triggerAI } = req.body

    const fCosts = Number(fixedCosts || 0)
    const vCosts = Number(variableCosts || 0)
    const sPrice = Number(sellingPrice || 0)
    const pSales = Number(projectedSales || 0)
    const customerAcqCost = Number(cac || 0)
    const customerLtv = Number(ltv || 0)

    let aiReviewText = null

    if (triggerAI) {
      const breakeven = sPrice > vCosts ? (fCosts / (sPrice - vCosts)) : 0
      const monthlyProfit = (sPrice - vCosts) * pSales - fCosts

      const prompt = `Bạn là cố vấn tài chính AI của StudyConnect.
Hãy đánh giá mức độ khả thi của mô hình tài chính sau đây dành cho một dự án startup sinh viên:
- Chi phí cố định hàng tháng: ${fCosts.toLocaleString('vi-VN')} VNĐ
- Chi phí biến đổi trên mỗi sản phẩm: ${vCosts.toLocaleString('vi-VN')} VNĐ
- Giá bán đề xuất: ${sPrice.toLocaleString('vi-VN')} VNĐ
- Sản lượng bán dự kiến hàng tháng: ${pSales.toLocaleString('vi-VN')} sản phẩm
- Điểm hòa vốn sản lượng: ${breakeven.toFixed(1)} sản phẩm/tháng
- Lợi nhuận gộp dự kiến hàng tháng: ${monthlyProfit.toLocaleString('vi-VN')} VNĐ
- Chi phí sở hữu khách hàng (CAC): ${customerAcqCost.toLocaleString('vi-VN')} VNĐ
- Giá trị vòng đời khách hàng (LTV): ${customerLtv.toLocaleString('vi-VN')} VNĐ

Nhiệm vụ:
Hãy đưa ra 3-4 câu nhận xét cụ thể, ngắn gọn bằng tiếng Việt:
1. Đánh giá tính khả thi về mức giá bán và tỉ lệ chi phí.
2. Điểm hòa vốn sản lượng có quá cao so với sản lượng dự kiến?
3. Chỉ số LTV/CAC đã lành mạnh chưa (tỉ lệ vàng thường > 3)?
4. Đề xuất trực tiếp cách tối ưu hóa chi phí hoặc doanh thu.`

      const model = getGeminiModel(req)
      const result = await model.generateContent(prompt)
      aiReviewText = result.response.text().trim()
    }

    const updateData: any = {
      fixedCosts: fCosts,
      variableCosts: vCosts,
      sellingPrice: sPrice,
      projectedSales: pSales,
      cac: customerAcqCost,
      ltv: customerLtv
    }

    if (aiReviewText) {
      updateData.aiReview = aiReviewText
    }

    const financial = await prisma.financialModel.update({
      where: { projectId },
      data: updateData
    })

    res.json({ success: true, data: financial })
  } catch (err) {
    console.error('Save Financial Model Error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/financial/revenue/summary — Thống kê tổng doanh thu (Dành cho Admin/Manager/Leader)
export const getRevenueSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'completed' },
      select: { amount: true, plan: true, createdAt: true }
    })

    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0)
    
    const revenueByPlan = payments.reduce((acc: Record<string, number>, curr) => {
      acc[curr.plan] = (acc[curr.plan] || 0) + curr.amount
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions: payments.length,
        revenueByPlan,
      }
    })
  } catch (err) {
    console.error('Get Revenue Summary Error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/financial/revenue/details — Chi tiết doanh thu hệ thống
export const getRevenueDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, plan } = req.query
    const where: any = { status: 'completed' }

    if (plan && plan !== 'all') {
      where.plan = plan
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(String(startDate))
      if (endDate) where.createdAt.lte = new Date(String(endDate))
    }

    const details = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: details })
  } catch (err) {
    console.error('Get Revenue Details Error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// GET /api/financial/transactions — Lịch sử giao dịch toàn hệ thống
export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: String(search), mode: 'insensitive' } } },
        { user: { phone: { contains: String(search), mode: 'insensitive' } } }
      ]
    }

    const transactions = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: transactions })
  } catch (err) {
    console.error('Get Transaction History Error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}