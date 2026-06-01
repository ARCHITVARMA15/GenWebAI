import express from 'express'
import { load as cheerioLoad } from 'cheerio'
import Experiment from '../models/Experiment.js'
import Website from '../models/website.model.js'
import isAuth from '../middlewares/isAuth.js'
import { generateVariantB, calculateConfidence } from '../services/abTestingService.js'

const experimentsRouter = express.Router()

/**
 * Extracts the HTML for a named section (hero | cta | pricing) from a full HTML document.
 * Strategy: id match → class/tag match → first <section> fallback → first 3000 chars.
 * Uses cheerio for reliable DOM traversal over regex.
 */
function extractSection(html, section) {
    const $ = cheerioLoad(html)

    // 1. Try exact id match
    const byId = $(`#${section}`)
    if (byId.length) return $.html(byId.first())

    // 2. Try <section> or <div> whose id/class contains the section name
    const candidates = $('section, div').filter((_, el) => {
        const cls = ($(el).attr('class') || '').toLowerCase()
        const id = ($(el).attr('id') || '').toLowerCase()
        return cls.includes(section) || id.includes(section)
    })
    if (candidates.length) return $.html(candidates.first())

    // 3. Fallback: first <section> tag in body
    const firstSection = $('section').first()
    if (firstSection.length) return $.html(firstSection)

    // 4. Last resort: first 3000 characters of body content
    return html.slice(0, 3000)
}

/**
 * Replaces a named section in the full HTML document with new HTML.
 * Mirrors the extraction logic so we always replace what we extracted.
 */
function replaceSection(html, section, replacement) {
    const $ = cheerioLoad(html)

    const byId = $(`#${section}`)
    if (byId.length) { byId.first().replaceWith(replacement); return $.html() }

    const candidates = $('section, div').filter((_, el) => {
        const cls = ($(el).attr('class') || '').toLowerCase()
        const id = ($(el).attr('id') || '').toLowerCase()
        return cls.includes(section) || id.includes(section)
    })
    if (candidates.length) { candidates.first().replaceWith(replacement); return $.html() }

    return html
}

// POST /api/experiments/start
experimentsRouter.post('/start', isAuth, async (req, res) => {
    try {
        const { websiteId, targetSection } = req.body

        if (!websiteId || !targetSection) {
            return res.status(400).json({ message: 'websiteId and targetSection are required' })
        }
        if (!['hero', 'cta', 'pricing'].includes(targetSection)) {
            return res.status(400).json({ message: 'targetSection must be hero, cta, or pricing' })
        }

        const website = await Website.findOne({ _id: websiteId, user: req.user._id })
        if (!website) return res.status(404).json({ message: 'Website not found' })

        const existing = await Experiment.findOne({ websiteId, status: 'running' })
        if (existing) {
            return res.status(409).json({ message: 'An experiment is already running for this website', experimentId: existing._id })
        }

        const originalHtml = extractSection(website.latestCode, targetSection)
        const websiteContext = `Title: ${website.title}`

        const variantBHtml = await generateVariantB(originalHtml, targetSection, websiteContext)

        const experiment = await Experiment.create({
            websiteId,
            targetSection,
            variants: {
                a: { htmlSnippet: originalHtml, description: 'Original version' },
                b: { htmlSnippet: variantBHtml, description: 'AI variant — stronger CTA copy' }
            }
        })

        return res.status(201).json({
            experimentId: experiment._id,
            variantA_preview: originalHtml,
            variantB_preview: variantBHtml
        })
    } catch (err) {
        return res.status(500).json({ message: 'Failed to start experiment: ' + err.message })
    }
})

// GET /api/experiments/:websiteId/variant-b  (PUBLIC — called by injected script in live sites)
experimentsRouter.get('/:websiteId/variant-b', async (req, res) => {
    try {
        const experiment = await Experiment.findOne({
            websiteId: req.params.websiteId,
            status: 'running'
        }).sort({ startedAt: -1 })

        if (!experiment) return res.json({ active: false })

        return res.json({
            active: true,
            targetSection: experiment.targetSection,
            variantB_html: experiment.variants.b.htmlSnippet
        })
    } catch (err) {
        return res.status(500).json({ active: false })
    }
})

// GET /api/experiments/:websiteId/active
experimentsRouter.get('/:websiteId/active', isAuth, async (req, res) => {
    try {
        const website = await Website.findOne({ _id: req.params.websiteId, user: req.user._id })
        if (!website) return res.status(404).json({ message: 'Website not found' })

        const experiment = await Experiment.findOne({
            websiteId: req.params.websiteId,
            status: { $in: ['running', 'winner_a', 'winner_b'] }
        }).sort({ startedAt: -1 })

        if (!experiment) return res.json({ experiment: null, stats: null })

        const stats = calculateConfidence(
            experiment.variants.a.visitors,
            experiment.variants.a.clicks,
            experiment.variants.b.visitors,
            experiment.variants.b.clicks
        )

        return res.json({ experiment, stats })
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch experiment: ' + err.message })
    }
})

// POST /api/experiments/:experimentId/conclude
experimentsRouter.post('/:experimentId/conclude', isAuth, async (req, res) => {
    try {
        const { winner } = req.body
        if (!['a', 'b'].includes(winner)) {
            return res.status(400).json({ message: 'winner must be "a" or "b"' })
        }

        const experiment = await Experiment.findById(req.params.experimentId)
        if (!experiment) return res.status(404).json({ message: 'Experiment not found' })

        const website = await Website.findOne({ _id: experiment.websiteId, user: req.user._id })
        if (!website) return res.status(403).json({ message: 'Unauthorized' })

        experiment.status = winner === 'a' ? 'winner_a' : 'winner_b'
        experiment.concludedAt = new Date()
        experiment.winnerVariant = winner
        await experiment.save()

        // Phase 2: When variant B wins, apply its HTML back into the live website code
        if (winner === 'b' && experiment.variants.b.htmlSnippet) {
            const updatedCode = replaceSection(
                website.latestCode,
                experiment.targetSection,
                experiment.variants.b.htmlSnippet
            )
            await Website.findByIdAndUpdate(website._id, { latestCode: updatedCode })
        }

        return res.json({ success: true, status: experiment.status })
    } catch (err) {
        return res.status(500).json({ message: 'Failed to conclude experiment: ' + err.message })
    }
})

// DELETE /api/experiments/:experimentId  — sets status to paused
experimentsRouter.delete('/:experimentId', isAuth, async (req, res) => {
    try {
        const experiment = await Experiment.findById(req.params.experimentId)
        if (!experiment) return res.status(404).json({ message: 'Experiment not found' })

        const website = await Website.findOne({ _id: experiment.websiteId, user: req.user._id })
        if (!website) return res.status(403).json({ message: 'Unauthorized' })

        experiment.status = 'paused'
        await experiment.save()

        return res.json({ success: true })
    } catch (err) {
        return res.status(500).json({ message: 'Failed to stop experiment: ' + err.message })
    }
})

export default experimentsRouter
