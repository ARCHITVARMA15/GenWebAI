import mongoose from 'mongoose'

const brandKitSchema = new mongoose.Schema({
    websiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        unique: true,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    businessName: String,
    tagline: String,
    personality: [String],
    targetAudience: String,
    primaryColor: String,
    secondaryColor: String,
    accentColor: String,
    backgroundColor: String,
    textColor: String,
    headingFont: String,
    bodyFont: String,
    logoSvg: String,
    faviconSvg: String,
    googleFontsUrl: String,
    industryKeywords: [String],
    logoStyle: String,
    logoShape: String,
    prompt: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

const BrandKit = mongoose.model('BrandKit', brandKitSchema)
export default BrandKit
