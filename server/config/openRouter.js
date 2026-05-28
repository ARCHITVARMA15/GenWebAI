const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

const defaultModel = "openrouter/owl-alpha";

export const generateResponse = async (prompt, modelId = defaultModel) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000)

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
                model: modelId,
                messages: [
                    { role: 'system', content: "You must return ONLY valid raw JSON." },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.2,
                max_tokens: 16000
            }),
        })

        if (!res.ok) {
            const error = await res.text()
            throw new Error(`OpenRouter API error: ${error}`)
        }
        const data = await res.json()
        return data.choices[0].message.content
    } finally {
        clearTimeout(timeout)
    }
}

export const generateResponseStream = async (prompt, modelId = defaultModel) => {
    const res = await fetch(openRouterUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:5000',
            'X-Title': 'AIWebsiteBuilder',
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: 'system', content: "You must return ONLY valid raw JSON." },
                { role: 'user', content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 8192,
            stream: true
        }),
    })
    if (!res.ok) {
        const error = await res.text()
        throw new Error(`OpenRouter API error: ${error}`)
    }
    return res.body
}
