const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

// Round-robin pool: on 429, immediately try the next model instead of waiting.
// Ordered by instruction-following quality for JSON format compliance.
const FREE_MODELS = [
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-120b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'qwen/qwen3-coder:free',
]

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const openRouterFetch = (prompt, model, stream = false) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)

    return fetch(openRouterUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:5000',
            'X-Title': 'AIWebsiteBuilder',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You must return ONLY valid raw JSON.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 16000,
            ...(stream ? { stream: true } : {}),
        }),
    }).finally(() => clearTimeout(timeout))
}

const openRouterFetchCustom = (prompt, systemContent, model, stream = false) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)

    return fetch(openRouterUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:5000',
            'X-Title': 'AIWebsiteBuilder',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 16000,
            ...(stream ? { stream: true } : {}),
        }),
    }).finally(() => clearTimeout(timeout))
}

export const generateResponse = async (prompt, _modelId, systemContent = 'You must return ONLY valid raw JSON.') => {
    for (let pass = 0; pass < 2; pass++) {
        for (const model of FREE_MODELS) {
            try {
                const res = await openRouterFetchCustom(prompt, systemContent, model, false)
                if (res.status === 429) {
                    console.warn(`OpenRouter 429 on ${model} — trying next model`)
                    continue
                }
                if (!res.ok) {
                    const err = await res.text()
                    console.warn(`OpenRouter error on ${model}: ${err.slice(0, 120)} — trying next`)
                    continue
                }
                const data = await res.json()
                return data.choices[0].message.content
            } catch (e) {
                console.warn(`OpenRouter fetch error on ${model}: ${e.message}`)
            }
        }
        if (pass === 0) {
            console.warn('All models rate-limited — waiting 20s before round 2')
            await sleep(20000)
        }
    }
    throw new Error('All AI models are currently rate-limited. Please wait 30 seconds and try again.')
}

const VISION_MODELS = [
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
]

export const generateVisionResponse = async (base64Image, mimeType, textPrompt) => {
    for (let pass = 0; pass < 2; pass++) {
        for (const model of VISION_MODELS) {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 90000)
            try {
                const res = await fetch(openRouterUrl, {
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:5000',
                        'X-Title': 'AIWebsiteBuilder',
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{
                            role: 'user',
                            content: [
                                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                                { type: 'text', text: textPrompt },
                            ],
                        }],
                        max_tokens: 16000,
                    }),
                }).finally(() => clearTimeout(timeout))

                if (res.status === 429) {
                    console.warn(`Vision 429 on ${model} — trying next`)
                    continue
                }
                if (!res.ok) {
                    const err = await res.text()
                    console.warn(`Vision error on ${model}: ${err.slice(0, 120)} — trying next`)
                    continue
                }
                const data = await res.json()
                return data.choices[0].message.content
            } catch (e) {
                console.warn(`Vision fetch error on ${model}: ${e.message}`)
            }
        }
        if (pass === 0) {
            console.warn('All vision models rate-limited — waiting 20s before round 2')
            await sleep(20000)
        }
    }
    throw new Error('All vision models are currently rate-limited. Please try again shortly.')
}

export const generateResponseStream = async (prompt, _modelId) => {
    for (let pass = 0; pass < 2; pass++) {
        for (const model of FREE_MODELS) {
            try {
                const res = await openRouterFetch(prompt, model, true)
                if (res.status === 429) {
                    console.warn(`OpenRouter stream 429 on ${model} — trying next model`)
                    continue
                }
                if (!res.ok) {
                    const err = await res.text()
                    console.warn(`OpenRouter stream error on ${model}: ${err.slice(0, 120)} — trying next`)
                    continue
                }
                console.log(`Streaming with model: ${model}`)
                return res.body
            } catch (e) {
                console.warn(`OpenRouter stream fetch error on ${model}: ${e.message}`)
            }
        }
        if (pass === 0) {
            console.warn('All stream models rate-limited — waiting 20s before round 2')
            await sleep(20000)
        }
    }
    throw new Error('All AI models are currently rate-limited. Please wait 30 seconds and try again.')
}
