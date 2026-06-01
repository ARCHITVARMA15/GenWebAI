import { generateVisionResponse } from '../config/openRouter.js'

const CLONE_PROMPT = `You are an expert frontend developer. Analyze this website screenshot and recreate it as a complete, single-file HTML page.

REQUIREMENTS:
- Use semantic HTML5 elements
- Style ONLY with Tailwind CSS (use CDN: <script src="https://cdn.tailwindcss.com"></script>)
- Make it fully responsive (mobile-first)
- Preserve the exact layout structure, color scheme, typography feel, and visual hierarchy
- Recreate all visible sections (hero, navbar, features, footer, etc.)
- Use placeholder text that matches the theme and tone of the original
- Do NOT use any external images — use solid colored divs or SVG shapes instead
- Include smooth hover transitions on interactive elements
- The output must be ONLY the complete HTML code, starting with <!DOCTYPE html>
- Do not include any explanation, markdown, or code fences — raw HTML only`

export const cloneFromImage = async (base64Image, mimeType = 'image/png') => {
    let html = await generateVisionResponse(base64Image, mimeType, CLONE_PROMPT)
    html = html.replace(/^```html\n?/i, '').replace(/```$/, '').trim()
    return html
}
