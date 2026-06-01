const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

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
    model = 'gemini-2.0-flash',
    retries = 3
) => {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${getKey()}`

    const body = {
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 16000, temperature: 0.2 },
    }

    if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] }
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 55000)

        try {
            const res = await fetch(url, {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.status === 429) {
                if (attempt === retries) throw new Error('Gemini rate limit exceeded. Please wait 60 seconds and try again.')
                const backoffs = [20000, 45000, 65000]
                const backoff = backoffs[attempt] || 65000
                console.warn(`Gemini 429 — retrying in ${backoff / 1000}s (attempt ${attempt + 1})`)
                await sleep(backoff)
                continue
            }

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
    model = 'gemini-2.0-flash',
    retries = 2
) => {
    const url = `${GEMINI_BASE}/${model}:streamGenerateContent?key=${getKey()}&alt=sse`

    const body = {
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 16000, temperature: 0.2 },
    }

    if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] }
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (res.status === 429) {
            if (attempt === retries) throw new Error('RATE_LIMIT')
            const backoffs = [20000, 45000]
            const backoff = backoffs[attempt] || 45000
            console.warn(`Gemini stream 429 — retrying in ${backoff / 1000}s`)
            await sleep(backoff)
            continue
        }

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Gemini Stream API error: ${err}`)
        }

        return res.body
    }
}
