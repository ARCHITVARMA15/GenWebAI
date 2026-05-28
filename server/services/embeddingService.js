import { load } from 'cheerio'

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'

export function extractTextChunks(htmlContent) {
    const $ = load(htmlContent)
    $('script').remove()
    $('style').remove()
    $('head').remove()
    const rawText = $('body').text().replace(/\s+/g, ' ').trim()

    const sentences = rawText.split(/(?<=[.!?])\s+/)
    const chunks = []
    let currentChunk = []
    let wordCount = 0

    for (const sentence of sentences) {
        const words = sentence.split(/\s+/).length
        if (wordCount + words <= 200) {
            currentChunk.push(sentence)
            wordCount += words
        } else {
            if (currentChunk.length > 0) chunks.push(currentChunk.join(' '))
            currentChunk = [sentence]
            wordCount = words
        }
    }
    if (currentChunk.length > 0) chunks.push(currentChunk.join(' '))

    return chunks.filter(c => c.split(/\s+/).length >= 8)
}

export async function embedSingleText(text) {
    try {
        const res = await fetch(VOYAGE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input: [text], model: 'voyage-02' })
        })
        const data = await res.json()
        return data.data[0].embedding
    } catch (err) {
        throw new Error('Voyage embedding failed: ' + err.message)
    }
}

export async function embedAllChunks(chunks) {
    const BATCH_SIZE = 8
    const results = []
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE)

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchIndex = Math.floor(i / BATCH_SIZE)
        const batch = chunks.slice(i, i + BATCH_SIZE)
        console.log(`Embedded batch ${batchIndex + 1}/${totalBatches}`)
        const embedded = await Promise.all(
            batch.map(async (text) => ({ text, embedding: await embedSingleText(text) }))
        )
        results.push(...embedded)
        if (batchIndex < totalBatches - 1) await new Promise(r => setTimeout(r, 200))
    }
    return results
}

export function cosineSimilarity(vecA, vecB) {
    let dot = 0, magA = 0, magB = 0
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i]
        magA += vecA[i] * vecA[i]
        magB += vecB[i] * vecB[i]
    }
    const magnitude = Math.sqrt(magA) * Math.sqrt(magB)
    if (magnitude === 0) return 0
    return dot / magnitude
}

export function findRelevantChunks(questionEmbedding, storedChunks, topK = 3) {
    if (!storedChunks || storedChunks.length === 0) return null
    const scored = storedChunks.map(chunk => ({
        text: chunk.text,
        score: cosineSimilarity(questionEmbedding, chunk.embedding)
    }))
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topK).map(c => c.text).join('\n\n---\n\n')
}

export async function generateAndStoreEmbeddings(websiteId, htmlContent) {
    try {
        const chunks = extractTextChunks(htmlContent)
        if (chunks.length === 0) {
            console.log('No chunks extracted, skipping embedding')
            return
        }
        const embeddedChunks = await embedAllChunks(chunks)
        const { default: WebsiteEmbedding } = await import('../models/WebsiteEmbedding.js')
        await WebsiteEmbedding.findOneAndUpdate(
            { websiteId },
            { websiteId, chunks: embeddedChunks, embeddedAt: new Date() },
            { upsert: true, new: true }
        )
        console.log(`Stored ${embeddedChunks.length} embedded chunks for website ${websiteId}`)
    } catch (err) {
        console.error('Embedding generation failed:', err.message)
    }
}
