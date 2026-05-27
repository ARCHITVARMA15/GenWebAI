import express from 'express'
import multer from 'multer'
import isAuth from '../middlewares/isAuth.js'
import { captureScreenshot } from '../services/screenshotService.js'
import { cloneFromImage } from '../services/visionCloneService.js'
import Website from '../models/website.model.js'
import User from '../models/user.model.js'

const router = express.Router()

const CLONE_CREDITS = 3

const storage = multer.memoryStorage()
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp']
        if (allowed.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Only JPEG, PNG, and WebP images are allowed'))
        }
    },
})

router.post('/from-url', isAuth, async (req, res) => {
    try {
        let { url } = req.body

        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            return res.status(400).json({ message: 'url must start with http:// or https://' })
        }

        if (url.startsWith('http://')) {
            url = 'https://' + url.slice(7)
        }

        const user = await User.findById(req.user._id)
        if (!user) return res.status(401).json({ message: 'user not found' })

        if (user.credits < CLONE_CREDITS) {
            return res.status(400).json({ message: 'not enough credits to clone a website' })
        }

        let base64Image
        try {
            base64Image = await captureScreenshot(url)
        } catch (err) {
            return res.status(422).json({ message: 'Could not access that URL. Try uploading a screenshot instead.' })
        }

        const htmlContent = await cloneFromImage(base64Image)

        const website = await Website.create({
            user: user._id,
            title: `Clone of ${url}`.slice(0, 80),
            latestCode: htmlContent,
            sourceType: 'url-clone',
            sourceUrl: url,
            conversation: [{ role: 'ai', content: `Cloned from ${url}` }],
        })

        user.credits = user.credits - CLONE_CREDITS
        await user.save()

        return res.status(201).json({
            success: true,
            data: {
                websiteId: website._id,
                htmlContent,
                creditsLeft: user.credits,
            },
        })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Clone from URL failed' })
    }
})

router.post('/from-image', isAuth, upload.single('screenshot'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file' })
        }

        const user = await User.findById(req.user._id)
        if (!user) return res.status(401).json({ message: 'user not found' })

        if (user.credits < CLONE_CREDITS) {
            return res.status(400).json({ message: 'not enough credits to clone a website' })
        }

        const base64 = req.file.buffer.toString('base64')
        const htmlContent = await cloneFromImage(base64, req.file.mimetype)

        const website = await Website.create({
            user: user._id,
            title: 'Cloned from screenshot',
            latestCode: htmlContent,
            sourceType: 'image-clone',
            conversation: [{ role: 'ai', content: 'Cloned from uploaded screenshot' }],
        })

        user.credits = user.credits - CLONE_CREDITS
        await user.save()

        return res.status(201).json({
            success: true,
            data: {
                websiteId: website._id,
                htmlContent,
                creditsLeft: user.credits,
            },
        })
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Clone from image failed' })
    }
})

export default router
