const portfolioDesigns = [
    {
        id: 'terminal-dev',
        name: 'Terminal Dev',
        bestFor: ['backend', 'devops', 'security', 'cli', 'systems', 'rust', 'c', 'go', 'linux'],
        palette: {
            background: '#0d0d0d', surface: '#1a1a1a', primary: '#00ff88',
            secondary: '#00ccff', text: '#e0e0e0', muted: '#666666', border: '#2a2a2a'
        },
        typography: {
            heading: "'Courier New', 'Lucida Console', monospace",
            body: "'Courier New', monospace",
            headingSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: '1.8'
        },
        layout: 'single-column centered, max-width 820px, terminal window frame for hero, code blocks throughout',
        hero: 'Full-width dark terminal window with blinking cursor, typed name in green, command-line style intro',
        navigation: 'Horizontal nav styled as command line with > prefix and monospace font links',
        projects: 'Terminal output cards: repo name as command, description as output, language as colored tag',
        skills: 'Directory tree structure (ls -la style) grouped by category',
        animations: 'Typing cursor blink (CSS keyframes), subtle green phosphor glow on hover, scanline overlay',
        inspiration: 'cassie.codes terminal aesthetic and classic Unix shell developer portfolios'
    },
    {
        id: 'dark-glassmorphism',
        name: 'Dark Glassmorphism',
        bestFor: ['fullstack', 'frontend', 'ui', 'react', 'vue', 'angular', 'creative-dev', 'typescript'],
        palette: {
            background: '#050508', surface: 'rgba(255,255,255,0.04)',
            primary: '#818cf8', secondary: '#a78bfa', accent: '#22d3ee',
            text: '#f1f5f9', muted: '#64748b', border: 'rgba(255,255,255,0.08)'
        },
        typography: {
            heading: 'system-ui, -apple-system, sans-serif',
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: '1.6', weight: '700'
        },
        layout: 'hero left-aligned, frosted glass cards for projects, 12-col CSS grid, centered skills section',
        hero: 'Deep dark bg with purple/indigo radial gradient orb, frosted glass name card, name in bold white',
        navigation: 'Sticky top blur navbar (backdrop-filter: blur(20px)), gradient underline on active item',
        projects: '3-col frosted glass cards (backdrop-filter: blur(12px) saturate(180%)), gradient border on hover',
        skills: '6-col icon grid inside frosted container, color glow on hover per technology',
        animations: 'Gradient orb pulse, glass card 3D tilt on hover (CSS transform), fade-in on scroll',
        inspiration: 'basement.studio, Vercel dark dashboard aesthetic, and Awwwards dark-mode portfolios 2025'
    },
    {
        id: 'gradient-light',
        name: 'Gradient Accents Light',
        bestFor: ['frontend', 'product', 'techlead', 'javascript', 'python', 'startup', 'saas'],
        palette: {
            background: '#ffffff', surface: '#f8fafc', primary: '#6366f1',
            secondary: '#ec4899', accent: '#f59e0b', text: '#0f172a', muted: '#64748b', border: '#e2e8f0'
        },
        typography: {
            heading: 'system-ui, -apple-system, sans-serif',
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.5'
        },
        layout: 'light bg, gradient borders on project cards, asymmetric hero, section dividers as gradient lines',
        hero: 'White bg, bold name with gradient text (indigo→pink), floating color blobs in corners, big CTA button',
        navigation: 'Clean sticky nav with gradient pill for active state, compact top bar',
        projects: '3-col cards with top 3px gradient border, hover lift shadow (0 20px 40px rgba(0,0,0,0.12))',
        skills: 'Pill badges with gradient backgrounds grouped by Frontend/Backend/Tools category',
        animations: 'Float blobs in hero, card lift on hover, gradient border animate (background-size shift)',
        inspiration: 'Brittany Chiang light variant + modern Tailwind-ecosystem developer portfolios'
    },
    {
        id: 'navy-sidebar',
        name: 'Navy Sidebar Split',
        bestFor: ['senior', 'fullstack', 'architect', 'backend', 'experienced', 'java', 'c#', 'enterprise'],
        palette: {
            background: '#0a192f', sidebar: '#112240', primary: '#64ffda',
            text: '#ccd6f6', muted: '#8892b0', highlight: '#64ffda', border: '#233554'
        },
        typography: {
            heading: 'system-ui, -apple-system, sans-serif',
            body: "'Courier New', 'Fira Code', monospace",
            headingSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: '1.3',
            monoLabel: "'Courier New', monospace"
        },
        layout: 'two-pane: fixed left sidebar (280px) + scrollable right content, single column on mobile',
        hero: 'Left-anchored greeting in monospace, giant bold name, title with teal accent, GitHub + LinkedIn CTAs',
        navigation: 'Vertical sidebar nav with teal left-border active indicator, icon + label pairs, numbered links',
        projects: '2-col featured cards with number index (#01, #02), teal chip for primary language, GitHub link',
        skills: 'Two-column alphabetical list, teal bullet points ▹, grouped by category',
        animations: 'Fade-in-up stagger on sections (CSS animation), teal cursor blink in hero, smooth scroll',
        inspiration: "Brittany Chiang's brittanychiang.com — the most-starred developer portfolio on GitHub"
    },
    {
        id: 'aurora-dark',
        name: 'Aurora Dark',
        bestFor: ['creative-dev', 'frontend', 'webgl', 'animation', 'three-js', 'canvas', 'interactive'],
        palette: {
            background: '#02040a', primary: '#38bdf8', secondary: '#818cf8',
            tertiary: '#34d399', text: '#f8fafc', muted: '#475569'
        },
        typography: {
            heading: 'system-ui, -apple-system, sans-serif',
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(3rem, 7vw, 5.5rem)', lineHeight: '1.2', letterSpacing: '-0.02em'
        },
        layout: 'full-viewport hero section, sticky floating pill nav, aurora gradient overlay fixed, mesh gradients',
        hero: 'Full-screen nearly-black bg with aurora gradient (sky-blue top, indigo bottom-right), oversized bold name',
        navigation: 'Minimal floating pill nav centered at top with blur bg, 4 items only',
        projects: 'Stacked full-width cards with large visual area, gradient overlay reveal on hover, tech stack chips',
        skills: 'Floating tag cloud or constellation-style layout, color-coded by category',
        animations: 'Aurora gradient pulses (CSS animation keyframes), section slide-in, gradient text animate',
        inspiration: 'Linear.app, Superhuman, and high-end SaaS marketing sites aesthetic applied to portfolio'
    },
    {
        id: 'neobrutalist',
        name: 'Neobrutalist',
        bestFor: ['creative', 'game-dev', 'startup', 'experimental', 'agency', 'independent', 'freelance'],
        palette: {
            background: '#fffbf5', primary: '#ff6b35', secondary: '#ffd60a',
            accent: '#00b4d8', dark: '#1a1a1a', text: '#1a1a1a', border: '#1a1a1a'
        },
        typography: {
            heading: "'Arial Black', 'Impact', sans-serif",
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(3rem, 8vw, 7rem)', lineHeight: '1.0',
            weight: '900', letterSpacing: '-0.04em'
        },
        layout: 'broken grid, 3px black borders everywhere, hard drop shadows (4px 4px 0 #1a1a1a), rotated accents',
        hero: 'Giant headline, thick border box, hard shadow offset, bold orange color block, slightly rotated badge',
        navigation: 'Top bar with thick black border-bottom, nav items with border box on hover',
        projects: 'Bordered cards with hard shadow, hover shifts shadow (2px 2px 0), language badge with solid border',
        skills: 'Bordered pill tags with random yellow/orange/blue pastel fills, thick 2px borders',
        animations: 'Hover border-shadow shift, color flash on click, no smooth easing — abrupt snap transitions',
        inspiration: 'Neobrutalism.dev components, Figma plugin portfolios, and 2025 anti-design portfolio trend'
    },
    {
        id: 'minimal-professional',
        name: 'Minimal Professional',
        bestFor: ['senior', 'manager', 'consultant', 'enterprise', 'cto', 'vp', 'director', 'architect'],
        palette: {
            background: '#fafafa', surface: '#ffffff', primary: '#171717',
            accent: '#2563eb', text: '#171717', muted: '#737373', border: '#e5e5e5'
        },
        typography: {
            heading: 'Georgia, "Times New Roman", serif',
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.4', bodySize: '1.0625rem'
        },
        layout: 'centered single column max-width 720px, strong typographic hierarchy, extensive whitespace',
        hero: 'Centered serif name, profession in small caps, brief paragraph bio, two minimal text CTAs',
        navigation: 'Minimal top nav, small-caps text links, single accent underline on active',
        projects: 'Horizontal list with year badge, project name in serif, brief description, technology tags inline',
        skills: 'Simple two-column text list in small-caps, categorized by domain, no icons or badges',
        animations: 'Barely-there: page fade in on load, underline draw on link hover (CSS width transition)',
        inspiration: 'Devon Stank devonstank.com and Michael Mannucci editorial Swiss design portfolios'
    },
    {
        id: 'rose-quartz-code',
        name: 'Rose Quartz Code',
        bestFor: ['ux', 'designer-dev', 'product-designer', 'writer', 'documentation', 'accessibility', 'research'],
        palette: {
            background: '#fdf6f0', surface: '#fff8f5', primary: '#9b4d6e',
            secondary: '#c4748f', accent: '#d4a5b5', text: '#2d1b24', muted: '#8b6472', border: '#f0d8e2'
        },
        typography: {
            heading: 'Georgia, "Palatino Linotype", serif',
            body: 'system-ui, -apple-system, sans-serif',
            mono: "'Courier New', monospace",
            headingSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: '1.7'
        },
        layout: 'soft warm light bg, editorial rhythm, wide hero, alternating left-right project layout blocks',
        hero: 'Serif heading, soft pink gradient fade at hero bottom, elegant subtitle in rose, personal tone',
        navigation: 'Serif nav links, mauve underline active state, light nav bg',
        projects: 'Alternating layout: text-left / image-right pattern, mauve accent on headers, warm card bg',
        skills: 'Pill badges with blush background (#fce7f3) grouped by Frontend/Design/Tools',
        animations: 'Soft fade-in on scroll, underline draw on link hover, card gentle lift (0 8px 24px)',
        inspiration: 'UX portfolio editorial aesthetics combining code craftsmanship with design sensitivity'
    },
    {
        id: 'bento-grid',
        name: 'Bento Grid',
        bestFor: ['product', 'frontend', 'fullstack', 'react', 'modern', 'nextjs', 'typescript', 'startup'],
        palette: {
            background: '#09090b', surface: '#18181b', card: '#1c1c1f',
            primary: '#ffffff', accent: '#a855f7', accentAlt: '#22d3ee',
            text: '#fafafa', muted: '#71717a', border: '#27272a'
        },
        typography: {
            heading: 'system-ui, -apple-system, sans-serif',
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: '1.5'
        },
        layout: 'CSS Grid bento boxes with varying sizes (col-span-2, col-span-1), no uniform row heights',
        hero: 'Large bento card (2-col span): name + intro. Adjacent small cards: location chip, role, social icons',
        navigation: 'Pill nav bar centered horizontally, dark card bg, smooth underline active',
        projects: 'Each project is an individual bento card, tech stack as small colored dots/pills at bottom',
        skills: 'Individual bento cards per skill category with icon, varying heights per density',
        animations: 'Card border glow on hover (box-shadow 0 0 0 1px accent), gradient sweep, scale 1.02 on hover',
        inspiration: 'Linear.app, Vercel dashboard, and the 2025 bento grid UI trend seen on product sites'
    },
    {
        id: 'velvet-dark',
        name: 'Velvet Dark',
        bestFor: ['designer', 'agency', 'creative-director', 'ux-lead', 'brand', 'motion', 'art-director'],
        palette: {
            background: '#0d0618', surface: '#160d2a', primary: '#b57bee',
            secondary: '#7c3aed', accent: '#f0abfc', text: '#faf5ff', muted: '#a78bfa', border: '#2e1065'
        },
        typography: {
            heading: 'Georgia, "Playfair Display", serif',
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(3rem, 7vw, 6rem)', lineHeight: '1.1', letterSpacing: '-0.03em'
        },
        layout: 'Dramatic full-screen sections, bold serif headings over deep velvet bg, horizontal project gallery',
        hero: 'Full-viewport deep purple bg, oversized serif name, soft glowing accent text, minimalist CTA',
        navigation: 'Minimal floating nav at top, links fade on hover, backdrop blur',
        projects: 'Large feature cards with purple gradient overlay reveals on hover, year + title treatment',
        skills: 'Vertical category list with lavender left accent bar, skills as comma-separated text',
        animations: 'Grain overlay subtle movement, project card hover reveal, smooth scroll with parallax',
        inspiration: 'Obys Agency, SMSY/Samsy Ninja award-winning Awwwards portfolio sites (2025 top 10)'
    },
    {
        id: 'clay-editorial',
        name: 'Clay & Editorial',
        bestFor: ['writer', 'content', 'journalist', 'communications', 'marketing-tech', 'devrel', 'blogger'],
        palette: {
            background: '#f5f0e8', surface: '#faf7f2', primary: '#1e3a5f',
            accent: '#c4612a', text: '#1a1a1a', muted: '#6b6560', border: '#d4c8b8', warm: '#e8dfd4'
        },
        typography: {
            heading: 'Georgia, "Palatino Linotype", serif',
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: '1.7', bodySize: '1.0625rem'
        },
        layout: 'warm linen editorial layout, newspaper-inspired grid, ink navy + terracotta accent palette',
        hero: 'Serif headline over warm linen bg with subtle paper texture (CSS noise), terracotta CTA button',
        navigation: 'Ink navy sticky header with serif-styled logo, horizontal text-only nav links',
        projects: 'Magazine-style article cards: dominant image top, category label, title in serif, excerpt',
        skills: 'Two-column category list with terracotta bullet points ●, groups by Domain',
        animations: 'Underline draw on links, image parallax on card hover, smooth editorial reveal on scroll',
        inspiration: 'Stripe Press editorial aesthetics + Clay and Cloud palette from designyourway.net'
    },
    {
        id: 'monochrome-luxury',
        name: 'Monochrome Luxury',
        bestFor: ['consultant', 'finance-tech', 'senior-engineer', 'cto', 'executive', 'leadership'],
        palette: {
            background: '#ffffff', surface: '#f9f9f9', primary: '#000000',
            accent: '#c9a84c', text: '#111111', muted: '#888888', border: '#e0e0e0', gold: '#c9a84c'
        },
        typography: {
            heading: 'Georgia, "Cormorant Garamond", serif',
            body: '"Helvetica Neue", system-ui, sans-serif',
            headingSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1.2',
            letterSpacing: '-0.01em', weight: '300'
        },
        layout: 'extreme whitespace, understated luxury, gold accent used sparingly (<5%), ultra-wide centered layout',
        hero: 'Minimal: large thin-weight serif name, profession in small-caps, horizontal gold HR divider, brief bio',
        navigation: 'Ultra-minimal: small-caps links only, gold active indicator dot, fixed top, no background',
        projects: 'Full-width alternating image/text blocks, gold year labels in small-caps, borderless treatment',
        skills: 'Centered text list in columns, gold category labels, simple text approach — no badges',
        animations: 'Fade in ultra-slow (0.8s ease), gold underline draw on hover, minimal and restrained',
        inspiration: 'Luxury brand digital aesthetics (Patek Philippe, Bottega Veneta) applied to consulting portfolio'
    },
    {
        id: 'forest-minimal',
        name: 'Forest Minimal',
        bestFor: ['sustainability', 'green-tech', 'environmental', 'biotech', 'data-science', 'research'],
        palette: {
            background: '#f7f9f5', surface: '#eef3ea', primary: '#2d5016',
            secondary: '#4a7c2f', accent: '#8bc34a', text: '#1a2d0e', muted: '#6b8c5a', border: '#c8ddb8'
        },
        typography: {
            heading: 'system-ui, -apple-system, sans-serif',
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: '1.6'
        },
        layout: 'clean light sage-tinted layout, organic rounded corners (16px+), nature-inspired dividers (wave SVG)',
        hero: 'Soft sage-green radial gradient hero, organic blob shapes in CSS, warm welcoming bio paragraph',
        navigation: 'Rounded pill nav with forest green active state, subtle border on nav',
        projects: 'Rounded-corner cards with forest green top accent border (4px), tech stack pill badges',
        skills: 'Pill badges in sage/forest green shades, grouped by category, rounded-full pills',
        animations: 'Organic blob morph (border-radius keyframes), cards ease-up on scroll, natural cubic-bezier',
        inspiration: 'Iceland Black Sand and ReGrowth Minimal palettes from designyourway.net portfolio study'
    },
    {
        id: 'cyber-neon',
        name: 'Cyber Neon',
        bestFor: ['security', 'blockchain', 'web3', 'ctf', 'hacker', 'embedded', 'reverse-engineering', 'assembly'],
        palette: {
            background: '#000000', surface: '#0a0a0a', primary: '#00ff41',
            secondary: '#ff0080', accent: '#00e5ff', text: '#ffffff',
            muted: '#444444', border: 'rgba(0,255,65,0.2)'
        },
        typography: {
            heading: "'Share Tech Mono', 'Courier New', monospace",
            body: "'Share Tech Mono', 'Courier New', monospace",
            headingSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: '1.5', letterSpacing: '0.05em'
        },
        layout: 'Pure black bg, neon glow effects, CSS grid-line overlay, HUD-inspired data panels',
        hero: 'Typewriter effect name in matrix-green, glowing neon borders (box-shadow glow), HUD data readout',
        navigation: 'Horizontal nav with neon underlines on hover, bracket notation [WORK] [ABOUT]',
        projects: 'Terminal-style cards with neon color headers (green=OSS, cyan=web3, red=security)',
        skills: 'HUD-style percentage bars or grid of tech icons with neon color coding',
        animations: 'Glitch text effect (CSS clip-path), neon flicker (opacity keyframes), scanline overlay',
        inspiration: 'Cybersecurity CTF writeup sites, blockchain developer portfolios, Hackerman aesthetic'
    },
    {
        id: 'soft-pastel-modern',
        name: 'Soft Pastel Modern',
        bestFor: ['junior', 'bootcamp', 'student', 'community', 'teaching', 'open-source', 'swift', 'mobile'],
        palette: {
            background: '#fefefe', surface: '#f8f5ff', primary: '#7c3aed',
            secondary: '#db2777', accent: '#0891b2', lavender: '#ddd6fe',
            blush: '#fce7f3', text: '#1e1b4b', muted: '#6b7280', border: '#e0e7ff'
        },
        typography: {
            heading: 'system-ui, -apple-system, sans-serif',
            body: 'system-ui, -apple-system, sans-serif',
            headingSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: '1.6', weight: '700'
        },
        layout: 'warm inviting layout, rounded corners (20px), soft shadows, welcoming and approachable energy',
        hero: 'Friendly intro with emoji, pastel gradient pill badge for status, warm bio paragraph, pastel CTA',
        navigation: 'Rounded pill links with pastel lavender active state, friendly approachable feel',
        projects: 'Colorful rounded cards each with dominant pastel color, emoji category label, clear description',
        skills: 'Rounded-full badge grid with lavender/blush/cyan fills, grouped in soft containers',
        animations: 'Gentle bounce on load (transform scale), hover background shift, joyful and energetic timing',
        inspiration: "Adenekan Wonderful's codewonders.dev and inclusive developer community portfolio aesthetics"
    }
]

export default portfolioDesigns
