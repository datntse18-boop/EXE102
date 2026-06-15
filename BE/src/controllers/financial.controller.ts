import { Response } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// GET /api/projects/:projectId/financial
export const getFinancialModel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params as { projectId: string }
    let financial = await prisma.financialModel.findUnique({
      where: { projectId }
    })

    if (!financial) {
      // Create a default one if not exists
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

// PUT /api/projects/:projectId/financial
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
