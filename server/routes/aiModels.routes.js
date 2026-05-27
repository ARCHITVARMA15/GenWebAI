import express from 'express'
import isAuth from '../middlewares/isAuth.js'
import aiModels from '../config/aiModels.js'

const aiModelsRouter = express.Router()

aiModelsRouter.get('/', isAuth, (req, res) => {
    const userPlan = req.user?.plans || 'free'
    const result = Object.entries(aiModels).map(([key, m]) => ({
        key,
        label: m.label,
        modelId: m.modelId,
        description: m.description,
        badge: m.badge,
        creditsPerGeneration: m.creditsPerGeneration,
        comingSoon: m.comingSoon || false,
        isAvailable: !m.comingSoon && m.available.includes(userPlan)
    }))
    return res.json({ success: true, data: result })
})

export default aiModelsRouter
