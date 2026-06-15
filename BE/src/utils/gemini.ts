import { GoogleGenerativeAI } from '@google/generative-ai'
import { Request } from 'express'

export const getGeminiModel = (req?: Request, modelName: string = 'gemini-2.5-flash') => {
  let apiKey = process.env.GEMINI_API_KEY

  if (req && req.headers) {
    const headerKey = req.headers['x-gemini-key'] || req.headers['authorization-gemini']
    if (headerKey && typeof headerKey === 'string' && headerKey.trim() !== '') {
      apiKey = headerKey.trim()
    }
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your env or settings.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: modelName })
}
