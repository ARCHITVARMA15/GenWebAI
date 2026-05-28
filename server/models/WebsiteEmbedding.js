import mongoose from 'mongoose'

const websiteEmbeddingSchema = new mongoose.Schema({
    websiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
        required: true,
        unique: true,
        index: true
    },
    chunks: [{
        text: { type: String, required: true },
        embedding: { type: [Number], required: true }
    }],
    embeddedAt: { type: Date, default: Date.now }
}, { timestamps: false })

const WebsiteEmbedding = mongoose.model('WebsiteEmbedding', websiteEmbeddingSchema)
export default WebsiteEmbedding
