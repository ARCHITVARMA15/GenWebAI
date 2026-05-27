import express from 'express'
import isAuth from '../middlewares/isAuth.js'
import { generateBrandKit } from '../services/brandKitService.js'
import { generateBrandedWebsite } from '../services/brandedWebsiteService.js'
import Website from '../models/website.model.js'
import BrandKit from '../models/brandKit.model.js'
import User from '../models/user.model.js'

const router = express.Router()

const BRAND_CREDITS = 15

router.post('/generate', isAuth, async (req, res) => {
    try {
        const { prompt } = req.body

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ message: 'prompt is required' })
        }
        const trimmed = prompt.trim()
        if (trimmed.length < 10) {
            return res.status(400).json({ message: 'Prompt must be at least 10 characters' })
        }
        if (trimmed.length > 500) {
            return res.status(400).json({ message: 'Prompt must be under 500 characters' })
        }

        const user = await User.findById(req.user._id)
        if (!user) return res.status(401).json({ message: 'user not found' })

        if (user.credits < BRAND_CREDITS) {
            return res.status(400).json({ message: 'not enough credits to generate a brand kit' })
        }

        // Step 1: Generate brand kit (DNA + logo — sequential inside the service)
        const brandKit = await generateBrandKit(trimmed)

        // Step 2: Generate branded website (needs brandKit data)
        const htmlContent = await generateBrandedWebsite(trimmed, brandKit)

        // Step 3: Save Website document
        const website = await Website.create({
            user: user._id,
            title: brandKit.businessName || trimmed.slice(0, 60),
            latestCode: htmlContent,
            isBranded: true,
            brandPrimaryColor: brandKit.primaryColor,
            brandLogoSvg: brandKit.logoSvg,
            conversation: [
                { role: 'ai', content: `Brand kit generated for: ${brandKit.businessName}` },
                { role: 'user', content: trimmed },
            ],
        })

        // Step 4: Save BrandKit document
        const { logoSvg, faviconSvg, ...brandDataWithoutSvg } = brandKit
        await BrandKit.create({
            websiteId: website._id,
            userId: user._id,
            ...brandDataWithoutSvg,
            logoSvg,
            faviconSvg,
            prompt: trimmed,
        })

        // Deduct credits
        user.credits = user.credits - BRAND_CREDITS
        await user.save()

        return res.status(201).json({
            websiteId: website._id,
            brandKit: brandDataWithoutSvg,
            logoSvg,
            htmlContent,
            creditsLeft: user.credits,
        })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Brand kit generation failed' })
    }
})

router.get('/:websiteId', isAuth, async (req, res) => {
    try {
        const brandKit = await BrandKit.findOne({
            websiteId: req.params.websiteId,
            userId: req.user._id,
        })
        if (!brandKit) return res.status(404).json({ message: 'Brand kit not found' })
        return res.status(200).json(brandKit)
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Failed to fetch brand kit' })
    }
})

router.post('/:websiteId/regenerate-logo', isAuth, async (req, res) => {
    try {
        const brandKitDoc = await BrandKit.findOne({
            websiteId: req.params.websiteId,
            userId: req.user._id,
        })
        if (!brandKitDoc) return res.status(404).json({ message: 'Brand kit not found' })

        const { generateBrandKit: regen } = await import('../services/brandKitService.js')
        const fresh = await regen(brandKitDoc.prompt)

        brandKitDoc.logoSvg = fresh.logoSvg
        brandKitDoc.faviconSvg = fresh.faviconSvg
        await brandKitDoc.save()

        await Website.findByIdAndUpdate(req.params.websiteId, { brandLogoSvg: fresh.logoSvg })

        return res.status(200).json({ logoSvg: fresh.logoSvg })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Logo regeneration failed' })
    }
})

export default router
