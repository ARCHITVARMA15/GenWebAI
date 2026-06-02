import { generateResponse } from '../config/openRouter.js'
import { injectMissingCDNs } from '../controllers/website.controllers.js'

export const generateBrandedWebsite = async (userPrompt, brandKit) => {
    const systemMsg = `You are an elite, award-winning frontend developer who creates stunning, highly animated, conversion-focused websites. Every site you build is ALIVE with motion — static HTML is unacceptable. Include ALL mandatory CDN animation libraries (GSAP, AOS, VanillaTilt, Typed.js, Anime.js), a page loader, custom cursor, and the complete animation JavaScript block before </body>. Use ONLY the exact brand colors provided — every hex value must appear verbatim.`

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

MANDATORY CDN LIBRARIES — Include ALL in <head>:
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
<script src="https://unpkg.com/typed.js@2.1.0/dist/typed.umd.js"></script>
<script src="https://unpkg.com/vanilla-tilt@1.8.0/dist/vanilla-tilt.min.js"></script>
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

MANDATORY PAGE ELEMENTS at start of <body>:
- Page loader spinner (violet, #6366f1 border-top-color)
- Custom cursor: #cursor-dot (8px circle) + #cursor-ring (36px ring)

REQUIREMENTS:
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Sections: navbar (brand name/logo), hero, features (3 cards with VanillaTilt), testimonials (2), CTA section, footer
- Apply the brand colors as inline styles throughout. All content must match the brand industry, personality, and target audience
- Fully responsive (mobile-first), smooth hover transitions

HERO SECTION — USE THIS EXACT STRUCTURE (do not deviate):
  The hero has TWO text elements:
  1. A large static <h1> with the business name: ${brandKit.businessName}  ← STATIC, no typewriter here
  2. A subtitle <p> below it containing: <span id="typed-headline" data-strings='["${brandKit.tagline}","${brandKit.targetAudience}.","Built for professionals."]'></span>  ← TYPEWRITER goes HERE ONLY

  ❌ NEVER put id="typed-headline" on the <h1> or any heading element
  ✅ id="typed-headline" goes ONLY on the <span> inside the subtitle paragraph under the h1

  Hero background: <section class="hero-gradient"> with animated gradient using ${brandKit.primaryColor}
  Add 2-3 floating decorative shapes (position:absolute, animation:float 6s ease-in-out infinite, stagger delays)
  Hero elements must have classes: hero-badge, hero-headline, hero-sub, hero-cta (for GSAP entrance animation)

- Every card/feature: data-aos="fade-up" with staggered data-aos-delay
- COMPLETE animation JS block before </body> (GSAP loader, AOS.init, custom cursor, VanillaTilt on .card, Typed.js on #typed-headline, navbar scroll effect)
- Return ONLY complete HTML starting with <!DOCTYPE html> — no markdown, no explanation, no code fences

Original user description: ${userPrompt}`

    let html = await generateResponse(userMsg, null, systemMsg)
    html = html.replace(/^```html\n?/i, '').replace(/```$/, '').trim()
    html = injectMissingCDNs(html)
    return html
}
