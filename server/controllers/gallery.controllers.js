import Website from '../models/website.model.js'

export const publishWebsite = async (req, res) => {
    try {
        const { tags = [] } = req.body
        const website = await Website.findOne({ _id: req.params.id, user: req.user._id })
        if (!website) return res.status(404).json({ message: 'Website not found' })

        website.isPublished = true
        website.publishedAt = new Date()
        website.tags = Array.isArray(tags)
            ? [...new Set(tags.slice(0, 10).map(t => t.toLowerCase().trim()).filter(Boolean))]
            : []
        await website.save()

        return res.json({ success: true, website: { _id: website._id, isPublished: true, tags: website.tags } })
    } catch (error) {
        return res.status(500).json({ message: `publish error: ${error}` })
    }
}

export const unpublishWebsite = async (req, res) => {
    try {
        const website = await Website.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isPublished: false },
            { new: true }
        )
        if (!website) return res.status(404).json({ message: 'Website not found' })
        return res.json({ success: true })
    } catch (error) {
        return res.status(500).json({ message: `unpublish error: ${error}` })
    }
}

export const getGallery = async (req, res) => {
    try {
        const { sort = 'top', tag, page = 1, limit = 12 } = req.query
        const query = { isPublished: true }
        if (tag) query.tags = tag.toLowerCase().trim()

        const sortOption = sort === 'new' ? { publishedAt: -1 } : { upvotes: -1, publishedAt: -1 }
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const lim = Math.min(parseInt(limit), 24)

        const [websites, total] = await Promise.all([
            Website.find(query, '-latestCode -conversation -upvotedBy')
                .populate('user', 'name avatar')
                .sort(sortOption)
                .skip(skip)
                .limit(lim)
                .lean(),
            Website.countDocuments(query)
        ])

        return res.json({ success: true, data: websites, total, page: parseInt(page), limit: lim })
    } catch (error) {
        return res.status(500).json({ message: `gallery error: ${error}` })
    }
}

export const upvoteWebsite = async (req, res) => {
    try {
        const userId = req.user._id
        const website = await Website.findOne({ _id: req.params.id, isPublished: true }, 'upvotedBy upvotes')
        if (!website) return res.status(404).json({ message: 'Website not found' })

        const hasUpvoted = website.upvotedBy.some(id => id.toString() === userId.toString())

        if (hasUpvoted) {
            const updated = await Website.findByIdAndUpdate(
                req.params.id,
                { $pull: { upvotedBy: userId }, $inc: { upvotes: -1 } },
                { new: true, select: 'upvotes' }
            )
            return res.json({ success: true, upvotes: updated.upvotes, hasUpvoted: false })
        } else {
            const updated = await Website.findByIdAndUpdate(
                req.params.id,
                { $addToSet: { upvotedBy: userId }, $inc: { upvotes: 1 } },
                { new: true, select: 'upvotes' }
            )
            return res.json({ success: true, upvotes: updated.upvotes, hasUpvoted: true })
        }
    } catch (error) {
        return res.status(500).json({ message: `upvote error: ${error}` })
    }
}

export const getMyVotes = async (req, res) => {
    try {
        const websites = await Website.find(
            { upvotedBy: req.user._id, isPublished: true },
            '_id'
        ).lean()
        return res.json({ success: true, data: websites.map(w => w._id.toString()) })
    } catch (error) {
        return res.status(500).json({ message: `my-votes error: ${error}` })
    }
}

export const getTags = async (req, res) => {
    try {
        const tags = await Website.distinct('tags', { isPublished: true })
        return res.json({ success: true, data: tags.filter(Boolean).sort() })
    } catch (error) {
        return res.status(500).json({ message: `tags error: ${error}` })
    }
}
