import WebsiteVersion from '../models/websiteVersion.model.js'
import Website from '../models/website.model.js'
import { saveVersion } from '../utils/saveVersion.js'

export const getVersions = async (req, res) => {
    try {
        const website = await Website.findOne({ _id: req.params.id, user: req.user._id })
        if (!website) return res.status(404).json({ success: false, message: 'Website not found' })

        const versions = await WebsiteVersion.find({ website: req.params.id })
            .select('-content')
            .sort({ versionNumber: -1 })

        return res.status(200).json({ success: true, data: versions })
    } catch (error) {
        return res.status(500).json({ success: false, message: `get versions error: ${error}` })
    }
}

export const getVersionContent = async (req, res) => {
    try {
        const website = await Website.findOne({ _id: req.params.id, user: req.user._id })
        if (!website) return res.status(404).json({ success: false, message: 'Website not found' })

        const version = await WebsiteVersion.findOne({
            website: req.params.id,
            versionNumber: Number(req.params.versionNumber)
        })
        if (!version) return res.status(404).json({ success: false, message: 'Version not found' })

        return res.status(200).json({ success: true, data: { content: version.content, versionNumber: version.versionNumber } })
    } catch (error) {
        return res.status(500).json({ success: false, message: `get version content error: ${error}` })
    }
}

export const rollback = async (req, res) => {
    try {
        const website = await Website.findOne({ _id: req.params.id, user: req.user._id })
        if (!website) return res.status(404).json({ success: false, message: 'Website not found' })

        const version = await WebsiteVersion.findOne({
            website: req.params.id,
            versionNumber: Number(req.params.versionNumber)
        })
        if (!version) return res.status(404).json({ success: false, message: 'Version not found' })

        await saveVersion(website._id, req.user._id, website.latestCode, `Before rollback to v${version.versionNumber}`)

        website.latestCode = version.content
        await website.save()

        return res.status(200).json({ success: true, data: { code: version.content } })
    } catch (error) {
        return res.status(500).json({ success: false, message: `rollback error: ${error}` })
    }
}
