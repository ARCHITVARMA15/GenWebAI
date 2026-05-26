import mongoose from 'mongoose'
import Website from '../models/website.model.js'
import User from '../models/user.model.js'

export const getOverview = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id)

        const [websites, user] = await Promise.all([
            Website.find({ user: userId }),
            User.findById(req.user._id)
        ])

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const websitesThisMonth = websites.filter(w => new Date(w.createdAt) >= startOfMonth).length
        const totalDeployments = websites.filter(w => w.deployed).length

        const mostRecentActivity = websites.reduce((latest, w) => {
            const d = new Date(w.updatedAt)
            return d > latest ? d : latest
        }, new Date(0))

        const stopwords = new Set([
            'a', 'an', 'the', 'for', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'of', 'with', 'is', 'it', 'my', 'your', 'our', 'that',
            'this', 'page', 'site', 'web', 'using', 'use', 'create', 'make',
            'build', 'called', 'like', 'some', 'from', 'into', 'have', 'been'
        ])
        const categoryCounts = {}
        websites.forEach(w => {
            (w.title || '').toLowerCase().split(/\s+/).forEach(word => {
                const clean = word.replace(/[^a-z]/g, '')
                if (clean.length > 3 && !stopwords.has(clean)) {
                    categoryCounts[clean] = (categoryCounts[clean] || 0) + 1
                }
            })
        })
        const topGeneratedCategories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))

        return res.json({
            success: true,
            data: {
                totalWebsitesCreated: websites.length,
                websitesThisMonth,
                totalDeployments,
                creditsRemaining: user?.credits ?? 0,
                plan: user?.plans ?? 'free',
                memberSince: user?.createdAt ?? null,
                mostRecentActivity: mostRecentActivity.getTime() === 0 ? null : mostRecentActivity,
                topGeneratedCategories
            }
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: `overview error: ${error}` })
    }
}

export const getActivity = async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 30, 90)
        const userId = new mongoose.Types.ObjectId(req.user._id)

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        const raw = await Website.aggregate([
            { $match: { user: userId, createdAt: { $gte: startDate } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ])

        const dateMap = {}
        raw.forEach(r => { dateMap[r._id] = r.count })

        const result = []
        for (let i = 0; i < days; i++) {
            const d = new Date()
            d.setDate(d.getDate() - days + i + 1)
            const dateStr = d.toISOString().split('T')[0]
            result.push({ date: dateStr, count: dateMap[dateStr] || 0 })
        }

        return res.json({ success: true, data: result })
    } catch (error) {
        return res.status(500).json({ success: false, message: `activity error: ${error}` })
    }
}

export const getWebsiteStats = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id)

        const stats = await Website.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: null,
                    deployed: { $sum: { $cond: ['$deployed', 1, 0] } },
                    total: { $sum: 1 },
                    averageGenerationLength: { $avg: { $strLenCP: '$latestCode' } }
                }
            }
        ])

        const s = stats[0] || { deployed: 0, total: 0, averageGenerationLength: 0 }
        return res.json({
            success: true,
            data: {
                deployed: s.deployed,
                drafts: s.total - s.deployed,
                averageGenerationLength: Math.round(s.averageGenerationLength || 0)
            }
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: `website stats error: ${error}` })
    }
}
