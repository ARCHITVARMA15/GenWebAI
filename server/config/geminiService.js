const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const getKey = () => {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY is not set in .env')
    return key
}

/**
 * Standard (non-streaming) text generation via Gemini.
 * @param {string} userPrompt
 * @param {string} systemPrompt
 * @param {string} model  e.g. 'gemini-2.0-flash' | 'gemini-1.5-pro'
 * @returns {Promise<string>} raw text response
 */
export const generateWithGemini = async (
    userPrompt,
    systemPrompt = '',
    model = 'gemini-2.0-flash'
) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    try {
        const url = `${GEMINI_BASE}/${model}:generateContent?key=${getKey()}`

        const body = {
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { maxOutputTokens: 16000, temperature: 0.2 },
        }

        if (systemPrompt) {
            body.systemInstruction = { parts: [{ text: systemPrompt }] }
        }

        const res = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Gemini API error: ${err}`)
        }

        const data = await res.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } finally {
        clearTimeout(timeout)
    }
}

/**
 * Vision generation — send an image + text prompt to Gemini.
 * @param {string} base64Image  raw base64 (no data URI prefix)
 * @param {string} mimeType     e.g. 'image/png'
 * @param {string} textPrompt
 * @param {string} model
 * @returns {Promise<string>}
 */
export const generateWithGeminiVision = async (
    base64Image,
    mimeType = 'image/png',
    textPrompt,
    model = 'gemini-2.0-flash'
) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)

    try {
        const url = `${GEMINI_BASE}/${model}:generateContent?key=${getKey()}`

        const body = {
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    { text: textPrompt },
                ],
            }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
        }

        const res = await fetch(url, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Gemini Vision API error: ${err}`)
        }

        const data = await res.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } finally {
        clearTimeout(timeout)
    }
}

/**
 * Server-Sent Events streaming text generation via Gemini.
 * Returns the raw ReadableStream body for the caller to consume.
 * Each SSE chunk: data: { candidates: [{ content: { parts: [{ text }] } }] }
 * @param {string} userPrompt
 * @param {string} systemPrompt
 * @param {string} model
 * @returns {Promise<ReadableStream>}
 */
export const generateWithGeminiStream = async (
    userPrompt,
    systemPrompt = '',
    model = 'gemini-2.0-flash'
) => {
    const url = `${GEMINI_BASE}/${model}:streamGenerateContent?key=${getKey()}&alt=sse`

    const body = {
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 16000, temperature: 0.2 },
    }

    if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] }
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Gemini Stream API error: ${err}`)
    }

    return res.body
}
