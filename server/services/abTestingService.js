const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const AB_MODEL = 'openrouter/owl-alpha'

/**
 * Deterministically assigns a variant (a or b) to a session.
 * Pure function — same sessionId always returns the same variant across restarts.
 * Uses a 32-bit integer hash (djb2 variant) for uniform distribution.
 */
export const assignVariant = (sessionId) => {
    let hash = 0
    for (let i = 0; i < sessionId.length; i++) {
        hash = (hash << 5) - hash + sessionId.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash) % 2 === 0 ? 'a' : 'b'
}

/**
 * Calls OpenRouter with GPT-4o to generate a conversion-optimized variant B
 * for the given HTML section. Returns the raw HTML string.
 */
export const generateVariantB = async (originalHtml, targetSection, websiteContext) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    try {
        const res = await fetch(OPENROUTER_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:5000',
                'X-Title': 'AIWebsiteBuilder A/B Testing'
            },
            body: JSON.stringify({
                model: AB_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a conversion rate optimization expert. Return ONLY raw HTML with no markdown, no code fences, no explanation.'
                    },
                    {
                        role: 'user',
                        content: `Here is the ${targetSection} section of a website:\n${originalHtml}\n\nWebsite context: ${websiteContext}\n\nGenerate an alternative version of ONLY this section that:\n1. Has a stronger, more compelling headline\n2. Uses more action-oriented CTA button text\n3. Adds a subtle social proof element (e.g., '10,000+ sites built')\n4. Keeps the same Tailwind CSS styling approach\n5. Returns ONLY the HTML for this section, no explanation`
                    }
                ],
                temperature: 0.7,
                max_tokens: 4096
            })
        })

        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(`OpenRouter API error: ${errorText}`)
        }

        const data = await res.json()
        const raw = data.choices[0].message.content.trim()
        return raw.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim()
    } finally {
        clearTimeout(timeout)
    }
}

/**
 * Z-test approximation for two-proportion difference.
 * Returns { confidence (0–99), winner ('a'|'b'), cr_a (%), cr_b (%) }
 * Returns { confidence: 0, insufficientData: true } if either variant has < 50 visitors.
 */
export const calculateConfidence = (visitors_a, clicks_a, visitors_b, clicks_b) => {
    if (visitors_a < 50 || visitors_b < 50) {
        return { confidence: 0, insufficientData: true }
    }

    const cr_a = clicks_a / visitors_a
    const cr_b = clicks_b / visitors_b

    const p_pooled = (clicks_a + clicks_b) / (visitors_a + visitors_b)
    const se = Math.sqrt(p_pooled * (1 - p_pooled) * (1 / visitors_a + 1 / visitors_b))

    if (se === 0) return { confidence: 0, insufficientData: true }

    const z = Math.abs(cr_a - cr_b) / se
    const confidence = Math.min(99, Math.round((1 - Math.exp(-0.717 * z - 0.416 * z * z)) * 100))

    return {
        confidence,
        winner: cr_b > cr_a ? 'b' : 'a',
        cr_a: parseFloat((cr_a * 100).toFixed(2)),
        cr_b: parseFloat((cr_b * 100).toFixed(2))
    }
}
