import mongoose from 'mongoose'

const variantSchema = new mongoose.Schema(
    {
        htmlSnippet: String,
        description: String,
        visitors: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 }
    },
    { _id: false }
)

const experimentSchema = new mongoose.Schema(
    {
        websiteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Website',
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ['running', 'winner_a', 'winner_b', 'paused'],
            default: 'running'
        },
        startedAt: { type: Date, default: Date.now },
        concludedAt: Date,
        targetSection: String,
        variants: {
            a: { type: variantSchema, default: () => ({}) },
            b: { type: variantSchema, default: () => ({}) }
        },
        winnerVariant: { type: String, enum: ['a', 'b', null], default: null }
    },
    { timestamps: true }
)

// Compound index for fast lookup of running experiments by website
experimentSchema.index({ websiteId: 1, status: 1 })

const Experiment = mongoose.model('Experiment', experimentSchema)
export default Experiment
