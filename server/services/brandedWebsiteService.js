import { generateWithGemini } from '../config/geminiService.js'

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

    let html = await generateWithGemini(userMsg, systemMsg, 'gemini-2.0-flash')
    html = html.replace(/^```html\n?/i, '').replace(/```$/, '').trim()
    return html
}
