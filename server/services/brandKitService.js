import extractJson from '../utils/extractJson.js'
import { generateWithGemini } from '../config/geminiService.js'

const buildGoogleFontsUrl = (headingFont, bodyFont) => {
    const h = headingFont.replace(/ /g, '+')
    const b = bodyFont.replace(/ /g, '+')
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@400;700&family=${encodeURIComponent(bodyFont)}:wght@400;500&display=swap`
}

const callGemini = async (systemMsg, userMsg) => {
    return generateWithGemini(userMsg, systemMsg, 'gemini-2.0-flash')
}

const BRAND_SYSTEM = `You are a world-class brand strategist and designer.`

const buildBrandPrompt = (userPrompt, strict = false) => `A client described their business as: '${userPrompt}'

Return a JSON object with EXACTLY this structure (no extra fields, no markdown):
{
  "businessName": "string",
  "tagline": "string",
  "personality": ["string", "string", "string"],
  "targetAudience": "string",
  "primaryColor": "string",
  "secondaryColor": "string",
  "accentColor": "string",
  "backgroundColor": "string",
  "textColor": "string",
  "headingFont": "string",
  "bodyFont": "string",
  "logoStyle": "string",
  "logoShape": "string",
  "logoIcon": "string",
  "industryKeywords": ["string", "string", "string"]
}${strict ? '\n\nReturn ONLY valid JSON, nothing else. No explanation.' : ''}`

export const generateBrandKit = async (userPrompt) => {
    // Step 1 — Brand DNA extraction
    let brandRaw = await callGemini(BRAND_SYSTEM, buildBrandPrompt(userPrompt))
    let brandData = null

    try {
        brandData = await extractJson(brandRaw)
    } catch (_) {}

    if (!brandData) {
        brandRaw = await callGemini(BRAND_SYSTEM, buildBrandPrompt(userPrompt, true))
        try {
            brandData = await extractJson(brandRaw)
        } catch (_) {}
    }

    if (!brandData) {
        throw new Error('Brand extraction failed — AI returned invalid JSON')
    }

    // Build googleFontsUrl server-side (not from AI output)
    brandData.googleFontsUrl = buildGoogleFontsUrl(
        brandData.headingFont || 'Inter',
        brandData.bodyFont || 'Inter'
    )

    // Step 2 — SVG Logo generation
    const logoSystemMsg = `You are an expert SVG logo designer. You create clean, scalable vector logos.`
    const logoUserMsg = `Create an SVG logo for '${brandData.businessName}'.
Brand style: ${brandData.logoStyle}
Icon concept: ${brandData.logoIcon}
Primary color: ${brandData.primaryColor}
Secondary color: ${brandData.secondaryColor}
Logo shape: ${brandData.logoShape}

REQUIREMENTS:
- Return ONLY the SVG code, starting with <svg
- viewBox="0 0 200 200" width="200" height="200"
- The design must be simple, clean, and iconic — not complex
- Use only 2-3 colors maximum (from the brand palette)
- Include the business initial or a simple geometric shape representing the icon concept
- NO text in the SVG — icon only
- Must look professional at both 200px and 32px (favicon size)`

    let svgRaw = await callGemini(logoSystemMsg, logoUserMsg)

    // Strip markdown fences
    let logoSvg = svgRaw
        .replace(/```svg\n?/gi, '')
        .replace(/```xml\n?/gi, '')
        .replace(/```\n?/gi, '')
        .trim()

    const svgStart = logoSvg.indexOf('<svg')
    if (svgStart !== -1) {
        logoSvg = logoSvg.slice(svgStart)
    } else {
        const initial = (brandData.businessName || 'B')[0].toUpperCase()
        logoSvg = `<svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="90" fill="${brandData.primaryColor}"/>
  <text x="100" y="130" text-anchor="middle" font-size="80" font-weight="bold" fill="white">${initial}</text>
</svg>`
    }

    // Sanitize: strip <script> tags
    logoSvg = logoSvg.replace(/<script[\s\S]*?<\/script>/gi, '')

    // FaviconSvg: scale to 32x32
    const faviconSvg = logoSvg
        .replace(/width="200"/g, 'width="32"')
        .replace(/height="200"/g, 'height="32"')

    return {
        ...brandData,
        logoSvg,
        faviconSvg,
    }
}
