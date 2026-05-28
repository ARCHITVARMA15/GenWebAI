import express from 'express'
import rateLimit from 'express-rate-limit'
import { answerQuestion } from '../services/chatService.js'

const chatRouter = express.Router()

chatRouter.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    next()
})

chatRouter.use((req, res, next) => { if (req.method === 'OPTIONS') return res.sendStatus(200); next() })

const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { success: false, message: 'Too many messages. Please wait a moment.' }
})

chatRouter.post('/:websiteId', chatLimiter, async (req, res) => {
    try {
        const { question, history } = req.body

        if (!question || typeof question !== 'string') {
            return res.status(400).json({ success: false, message: 'Question is required' })
        }
        if (question.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Question cannot be empty' })
        }
        if (question.length > 500) {
            return res.status(400).json({ success: false, message: 'Question too long (max 500 characters)' })
        }
        if (history && !Array.isArray(history)) {
            return res.status(400).json({ success: false, message: 'History must be an array' })
        }

        const safeHistory = (history || [])
            .filter(m => m && typeof m.role === 'string' && typeof m.content === 'string')
            .filter(m => ['user', 'assistant'].includes(m.role))
            .slice(-10)

        const answer = await answerQuestion(req.params.websiteId, question.trim(), safeHistory)
        return res.json({ success: true, answer })
    } catch (err) {
        console.error('Chat route error:', err)
        return res.status(500).json({ success: false, message: 'Chat service unavailable' })
    }
})

export default chatRouter
