import express from 'express'
import rateLimit from 'express-rate-limit'
import Experiment from '../models/Experiment.js'

const trackingRouter = express.Router()

// CORS wildcard — tracking is called from visitor browsers on any external domain
trackingRouter.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    next()
})
trackingRouter.options('*', (req, res) => res.sendStatus(200))

const trackingLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many tracking events' }
})

// POST /api/track/visit
// Fire-and-forget: respond 200 immediately, DB write happens asynchronously.
// A tracking failure must NEVER break the visitor's generated website.
trackingRouter.post('/visit', trackingLimiter, (req, res) => {
    res.status(200).json({ ok: true })

    const { websiteId, variantServed } = req.body || {}
    if (!websiteId || !['a', 'b'].includes(variantServed)) return

    Experiment.findOneAndUpdate(
        { websiteId, status: 'running' },
        { $inc: { [`variants.${variantServed}.visitors`]: 1 } },
        { upsert: false }
    ).catch(() => {})
})

// POST /api/track/click
trackingRouter.post('/click', trackingLimiter, (req, res) => {
    res.status(200).json({ ok: true })

    const { websiteId, variantServed } = req.body || {}
    if (!websiteId || !['a', 'b'].includes(variantServed)) return

    Experiment.findOneAndUpdate(
        { websiteId, status: 'running' },
        { $inc: { [`variants.${variantServed}.clicks`]: 1 } },
        { upsert: false }
    ).catch(() => {})
})

export default trackingRouter
