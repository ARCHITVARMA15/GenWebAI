import WebsiteVersion from '../models/websiteVersion.model.js'

export const saveVersion = async (websiteId, userId, content, changeDescription = '') => {
    try {
        const count = await WebsiteVersion.countDocuments({ website: websiteId })
        const versionNumber = count + 1

        await WebsiteVersion.create({
            website: websiteId,
            user: userId,
            versionNumber,
            content,
            changeDescription
        })

        if (count >= 20) {
            const oldest = await WebsiteVersion.findOne({ website: websiteId }).sort({ versionNumber: 1 })
            if (oldest) await oldest.deleteOne()
        }
    } catch (error) {
        console.error(`saveVersion error: ${error}`)
    }
}
