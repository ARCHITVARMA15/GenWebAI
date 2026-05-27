import mongoose from 'mongoose'

const assetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    name: { type: String, required: true },
    format: { type: String },
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
}, { timestamps: true })

const Asset = mongoose.model('Asset', assetSchema)
export default Asset
