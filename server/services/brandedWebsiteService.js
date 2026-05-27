const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openrouter/auto'

export const generateBrandedWebsite = async (userPrompt, brandKit) => {
    const systemMsg = `You are an expert frontend developer who creates stunning, conversion-focused websites.`

    const userMsg = `Create a complete, single-file HTML website for a business with these exact brand specifications:

Business: ${brandKit.businessName}
Tagline: ${brandKit.tagline}
Target audience: ${brandKit.targetAudience}
Industry keywords: ${brandKit.industryKeywords.join(', ')}

BRAND COLORS (use these EXACT hex values inline in style attributes):
- Primary: ${brandKit.primaryColor}
- Secondary: ${brandKit.secondaryColor}
- Accent: ${brandKit.accentColor}
- Background: ${brandKit.backgroundColor}
- Text: ${brandKit.textColor}

TYPOGRAPHY:
- Include: <link href="${brandKit.googleFontsUrl}" rel="stylesheet">
- Headings: font-family: '${brandKit.headingFont}', serif
- Body: font-family: '${brandKit.bodyFont}', sans-serif

REQUIREMENTS:
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Sections: navbar (with brand name/logo area), hero (tagline prominent), features (3 cards), testimonials (2), CTA section, footer
- Apply the brand colors as inline styles (style="color: ${brandKit.primaryColor}") throughout
- All placeholder content must match the brand's industry, personality, and target audience
- Make it fully responsive (mobile-first)
- Include smooth hover transitions
- Return ONLY complete HTML starting with <!DOCTYPE html> — no markdown, no explanation, no code fences

Original user description: ${userPrompt}`

    const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: 4096,
            temperature: 0.5,
            messages: [
                { role: 'system', content: systemMsg },
                { role: 'user', content: userMsg },
            ],
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`OpenRouter website gen error: ${err}`)
    }

    const data = await res.json()
    let html = data.choices[0].message.content || ''
    html = html.replace(/^```html\n?/i, '').replace(/```$/, '').trim()
    return html
}
