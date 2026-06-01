import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY')
}

export const genAI = new GoogleGenerativeAI(apiKey)

export const geminiModel = genAI.getGenerativeModel({
  model: modelName,
})
