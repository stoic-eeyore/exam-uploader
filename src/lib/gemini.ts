import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY')
}

export const genAI = new GoogleGenerativeAI(apiKey)

export const geminiModel = genAI.getGenerativeModel({
  //model: 'gemini-2.5-flash',
  //model: 'gemini-2.0-flash-lite',
  //model: 'gemini-2.0-flash',
  model: 'gemini-3-flash-preview',
})
