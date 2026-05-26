import mongoose from 'mongoose'

const websiteVersionSchema = new mongoose.Schema({
    website: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    versionNumber: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    changeDescription: {
        type: String,
        default: ''
    }
}, { timestamps: true })

websiteVersionSchema.index({ website: 1, versionNumber: 1 })

const WebsiteVersion = mongoose.model('WebsiteVersion', websiteVersionSchema)
export default WebsiteVersion
