import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({
  //model: 'gemini-2.5-flash',
  //model: 'gemini-2.0-flash-lite',
  //model: 'gemini-2.0-flash',
  model: 'gemini-3-flash-preview',
})
