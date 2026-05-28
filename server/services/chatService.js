import Groq from 'groq-sdk'
import { embedSingleText, findRelevantChunks } from './embeddingService.js'
import WebsiteEmbedding from '../models/WebsiteEmbedding.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function answerQuestion(websiteId, question, conversationHistory = []) {
    try {
        const embeddingDoc = await WebsiteEmbedding.findOne({ websiteId })
        if (!embeddingDoc || embeddingDoc.chunks.length === 0) {
            return "I don't have enough information about this website yet. Please try again in a moment."
        }

        const questionEmbedding = await embedSingleText(question)
        const relevantContext = findRelevantChunks(questionEmbedding, embeddingDoc.chunks, 3)
        if (!relevantContext) {
            return "I couldn't find relevant information to answer that question."
        }

        const systemMessage = {
            role: 'system',
            content: `You are a helpful assistant for a website. Your job is to answer visitor questions using ONLY the website content provided below. Be friendly, concise, and helpful. If the answer is not in the content, say: "I don't have that information, but you can contact us directly." Never make up information that isn't in the content.\n\nWebsite content:\n${relevantContext}`
        }

        const recentHistory = conversationHistory.slice(-6)
        const userMessage = { role: 'user', content: question }
        const messages = [systemMessage, ...recentHistory, userMessage]

        const response = await groq.chat.completions.create({
            model: 'llama3-8b-8192',
            messages,
            max_tokens: 400,
            temperature: 0.4
        })
        return response.choices[0].message.content.trim()
    } catch (err) {
        console.error('Chat answer failed:', err.message)
        return "Sorry, I'm having trouble answering right now. Please try again."
    }
}
