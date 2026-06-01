import { generateWithGeminiStream, generateWithGemini } from '../config/geminiService.js'
import { generateResponse, generateResponseStream } from '../config/openRouter.js'
import { fetchGitHubData, scrapeCertUrl } from '../services/portfolioScraper.js'
import portfolioDesigns from '../config/portfolioDesigns.js'
import Website from '../models/website.model.js'
import User from '../models/user.model.js'
import extractJson from '../utils/extractJson.js'
import { injectWidgetAndEmbed } from './website.controllers.js'

const PORTFOLIO_CREDITS = 30

const LANGUAGE_ROLE_MAP = {
    'JavaScript':       ['frontend', 'fullstack', 'react', 'modern'],
    'TypeScript':       ['frontend', 'fullstack', 'typescript', 'modern', 'react'],
    'Python':           ['backend', 'data-science', 'research', 'biotech'],
    'Go':               ['backend', 'systems', 'devops'],
    'Rust':             ['systems', 'backend', 'security'],
    'C':                ['systems', 'c', 'embedded', 'security'],
    'C++':              ['systems', 'game-dev', 'embedded'],
    'Java':             ['backend', 'enterprise', 'java', 'experienced'],
    'Kotlin':           ['mobile', 'backend', 'java'],
    'Swift':            ['mobile', 'swift', 'ios'],
    'Ruby':             ['backend', 'startup', 'fullstack'],
    'PHP':              ['backend', 'fullstack'],
    'Shell':            ['devops', 'backend', 'cli', 'linux', 'security'],
    'Dockerfile':       ['devops', 'backend'],
    'Solidity':         ['blockchain', 'web3'],
    'R':                ['data-science', 'research'],
    'Jupyter Notebook': ['data-science', 'research'],
    'Vue':              ['frontend', 'vue', 'fullstack'],
    'C#':               ['backend', 'enterprise', 'c#', 'game-dev'],
    'Dart':             ['mobile', 'fullstack'],
    'Assembly':         ['security', 'systems', 'reverse-engineering', 'assembly'],
    'HTML':             ['frontend', 'designer-dev'],
    'CSS':              ['frontend', 'designer-dev'],
    'SCSS':             ['frontend', 'designer-dev'],
}

function pickDesigns(githubData, linkedinSummary, customNote) {
    const naturalLanguage = [
        githubData?.bio || '',
        linkedinSummary || '',
        customNote || '',
        githubData?.repos?.map(r => r.topics?.join(' ') || '').join(' ') || ''
    ].join(' ').toLowerCase()

    const inferredRoles = []
    if (Array.isArray(githubData?.skills)) {
        for (const lang of githubData.skills) {
            const roles = LANGUAGE_ROLE_MAP[lang]
            if (roles) inferredRoles.push(...roles)
        }
    }

    const fullCorpus = naturalLanguage + ' ' + inferredRoles.join(' ')

    const scored = portfolioDesigns.map(d => ({
        design: d,
        score: d.bestFor.reduce((s, tag) => s + (fullCorpus.includes(tag) ? 2 : 0), 0)
    }))
    scored.sort((a, b) => b.score - a.score)

    const [first, second] = scored

    const primaryDesign = first.design
    let secondaryDesign = second.design

    if (first.score === 0) {
        const primaryLang = githubData?.skills?.[0] || ''
        const isSystemsLang = ['Rust', 'Go', 'C', 'C++', 'Assembly', 'Shell'].includes(primaryLang)
        const isDesignLang = ['CSS', 'SCSS', 'HTML'].includes(primaryLang)
        if (isSystemsLang) return [portfolioDesigns.find(d => d.id === 'terminal-dev'), portfolioDesigns.find(d => d.id === 'minimal-professional')]
        if (isDesignLang)  return [portfolioDesigns.find(d => d.id === 'gradient-light'), portfolioDesigns.find(d => d.id === 'bento-grid')]
        return [portfolioDesigns.find(d => d.id === 'dark-glassmorphism'), portfolioDesigns.find(d => d.id === 'bento-grid')]
    }

    return [primaryDesign, secondaryDesign]
}

function buildPortfolioPrompt(structuredData, designs, userImages) {
    const { name, title, githubData, linkedinSummary, certs, customNote } = structuredData

    const reposBlock = githubData?.repos?.length
        ? githubData.repos.map((r, i) =>
            `${i + 1}. ${r.name}
   Description: ${r.description || '(no description)'}
   Language: ${r.language || 'Unknown'}  |  Stars: ${r.stars}  |  Forks: ${r.forks}${r.lastUpdated ? `  |  Last updated: ${r.lastUpdated}` : ''}
   URL: ${r.url}
   Topics: ${r.topics?.join(', ') || 'none'}`
        ).join('\n\n')
        : 'No public repositories available.'

    const certsBlock = certs?.length
        ? certs.map((c, i) => `${i + 1}. ${c.name}\n   Issuer: ${c.issuer}\n   ${c.description ? 'About: ' + c.description : ''}`).join('\n')
        : ''

    const imagesBlock = userImages?.length
        ? userImages.map((url, i) => `Image ${i + 1}: ${url}`).join('\n')
        : ''

    const bg = designs[0].palette.background
    const accent = designs[0].palette.primary
    const textColor = designs[0].palette.text
    const surface = designs[0].palette.surface || designs[0].palette.background
    const border = designs[0].palette.border || 'rgba(255,255,255,0.1)'
    const headingFont = designs[0].typography.heading
    const bodyFont = designs[0].typography.body

    return `
YOU ARE A WORLD-CLASS FRONTEND ENGINEER. BUILD A STUNNING, PREMIUM PERSONAL PORTFOLIO.
USE ALL PROVIDED DATA EXACTLY — NEVER INVENT NAMES, PROJECTS, OR SKILLS.

==================================================
PERSON DATA (use verbatim)
==================================================
NAME: ${name}
TITLE: ${title || 'Software Developer'}
GITHUB: ${githubData?.githubUrl || ''}
LOCATION: ${githubData?.location || ''}
BIO: ${githubData?.bio || customNote || 'Passionate developer building meaningful software.'}
STATS: ${githubData?.followers || 0} followers | ${githubData?.publicRepos || 0} repos
${githubData?.company ? `COMPANY: ${githubData.company}` : ''}
${githubData?.blog ? `BLOG: ${githubData.blog}` : ''}

PROJECTS:
${reposBlock}

SKILLS: ${githubData?.skills?.length ? githubData.skills.join(', ') : 'Not detected'}
${linkedinSummary ? `\nLINKEDIN BIO:\n${linkedinSummary}` : ''}
${certsBlock ? `\nCERTIFICATIONS:\n${certsBlock}` : ''}
${customNote ? `\nUSER NOTES: ${customNote}` : ''}
${imagesBlock ? `\nUSER IMAGES:\n${imagesBlock}` : ''}

==================================================
MANDATORY CSS — COPY THESE EXACT VALUES
==================================================
YOU MUST start the <style> tag with these exact CSS custom properties:

:root {
  --bg: ${bg};
  --accent: ${accent};
  --text: ${textColor};
  --surface: ${surface};
  --border: ${border};
  --font-heading: ${headingFont};
  --font-body: ${bodyFont};
  --radius: 14px;
  --transition: 0.25s ease;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body), system-ui, sans-serif;
  margin: 0;
  padding: 0;
  line-height: 1.7;
}

==================================================
MANDATORY VISUAL RULES — ALL REQUIRED, NO EXCEPTIONS
==================================================
HERO:
  - min-height: 100vh, display flex, align-items center
  - Large gradient heading: background: linear-gradient(135deg, var(--text), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  - Subtle animated background: use a radial-gradient or mesh gradient as body::before pseudo-element (position:fixed, z-index:-1, opacity:0.15)
  - GitHub button: background var(--accent), padding 14px 32px, border-radius 50px, font-weight 700, letter-spacing 0.5px

NAVBAR:
  - position: fixed, top:0, width:100%, backdrop-filter: blur(20px), background: rgba from var(--bg) at 80% opacity, border-bottom: 1px solid var(--border), z-index: 1000
  - Logo: font-weight 800, letter-spacing -1px
  - Nav links: font-size 0.85rem, letter-spacing 0.5px, uppercase, opacity 0.7 default, 1.0 on hover/active, transition color 0.2s
  - Active link: color var(--accent), border-bottom: 2px solid var(--accent)

PROJECT CARDS:
  - CSS Grid: repeat(auto-fill, minmax(300px, 1fr)), gap 24px
  - Each card: background var(--surface), border: 1px solid var(--border), border-radius var(--radius), padding 28px, position relative
  - On hover: transform translateY(-6px), border-color var(--accent), box-shadow: 0 20px 60px rgba(0,0,0,0.4), transition var(--transition)
  - Card top: colored left-border accent stripe: border-left: 3px solid var(--accent)
  - Language badge: background var(--accent) at 15% opacity, color var(--accent), border-radius 50px, font-size 0.7rem, padding 4px 12px, font-weight 600
  - Star count with ★ character in gold (#fbbf24)
  - GitHub Repo link: small, underlined, color var(--accent), position bottom-right of card

SKILLS:
  - Wrap in a flex-wrap container, gap 12px
  - Each skill pill: background var(--surface), border: 1px solid var(--border), border-radius 50px, padding 10px 22px, font-size 0.85rem, font-weight 500
  - On hover: background var(--accent) at 20% opacity, border-color var(--accent), transform scale(1.05)
  - Group by category with a small heading label above each group

SECTIONS (all non-hero):
  - padding: 100px 0
  - max-width: 1100px, margin: 0 auto, padding-inline: 24px
  - Section heading: font-size clamp(2rem,4vw,3rem), font-family var(--font-heading), font-weight 800
  - Decorative underline on heading: display block, width 60px, height 4px, background var(--accent), margin-top 12px, border-radius 2px

SCROLL ANIMATIONS:
  - Add IntersectionObserver to add class "visible" when element enters viewport
  - .fade-up { opacity:0; transform:translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }
  - .fade-up.visible { opacity:1; transform:translateY(0); }
  - Apply .fade-up to every section, every project card, every skill pill

CONTACT SECTION:
  - Form inputs: background var(--surface), border: 1px solid var(--border), border-radius 10px, padding 14px 18px, color var(--text), width 100%, font-size 0.95rem
  - On focus: border-color var(--accent), outline none, box-shadow 0 0 0 3px var(--accent) at 20% opacity
  - Submit button: same style as hero GitHub button

==================================================
REQUIRED SECTIONS
==================================================
1. NAVIGATION (fixed, full-width)
2. HERO (full viewport, gradient name, title, bio, GitHub button)
3. ABOUT (bio text, location, highlights from LinkedIn if provided)
4. PROJECTS (ALL repos listed above — one card each)
5. SKILLS (ALL languages — grouped with pills)
${certsBlock ? '6. CERTIFICATIONS (one card per cert — name, issuer, description, link)' : ''}
${linkedinSummary ? `${certsBlock ? '7' : '6'}. EXPERIENCE (from LinkedIn summary)` : ''}
CONTACT (GitHub link, email, contact form)

==================================================
TECHNICAL REQUIREMENTS
==================================================
- ONE HTML file, ONE <style> tag (at top), ONE <script> tag (at bottom)
- Fully responsive: mobile hamburger menu, grid collapses to 1 column on mobile
- Project GitHub links: target="_blank" rel="noopener noreferrer"
- No Lorem Ipsum — only real provided data
- No external JS libraries — vanilla CSS and JS only
- iframe-compatible: no scripts that block rendering

SPA NAVIGATION — COPY THIS EXACT PATTERN:
Give every section an id like: <section id="home">, <section id="about">, <section id="projects">, <section id="skills">, <section id="contact"> etc.
Give every nav link a data-section attribute: <a data-section="about" href="#">About</a>

Use this EXACT JavaScript in the <script> tag:
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('[data-section]');

  function showSection(id) {
    sections.forEach(s => s.style.display = s.id === id ? 'block' : 'none');
    navLinks.forEach(a => {
      if (a.dataset.section === id) { a.classList.add('active'); }
      else { a.classList.remove('active'); }
    });
  }

  navLinks.forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    showSection(a.dataset.section);
  }));

  showSection('home');   // show home by default on load

==================================================
OUTPUT — RAW JSON ONLY
==================================================
{"message":"Portfolio generated for ${name}","code":"<FULL HTML>"}

NO markdown. NO explanation. RAW JSON ONLY.
`
}

export const generatePortfolio = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

    try {
        const { githubUrl, name, title, linkedinSummary, certUrls, customNote, userImages } = req.body

        if (!githubUrl?.trim()) { send({ error: 'GitHub URL is required' }); return }
        if (!name?.trim()) { send({ error: 'Name is required' }); return }

        const user = await User.findById(req.user._id)
        if (!user) { send({ error: 'User not found' }); return }

        if (user.credits < PORTFOLIO_CREDITS) {
            send({ error: `Not enough credits — portfolio generation requires ${PORTFOLIO_CREDITS} credits` })
            return
        }

        send({ status: 'Fetching GitHub profile and repositories...' })

        let githubData
        try {
            githubData = await fetchGitHubData(githubUrl.trim())
        } catch (err) {
            send({ error: `GitHub fetch failed: ${err.message}` })
            return
        }

        send({
            status: `GitHub data fetched ✓ — found ${githubData.repos.length} repositories, ${githubData.skills.length} languages`,
            github: { name: githubData.name, repos: githubData.repos.length, skills: githubData.skills.slice(0, 5) }
        })

        let certs = []
        if (Array.isArray(certUrls) && certUrls.length > 0) {
            send({ status: 'Scraping certification URLs...' })
            const results = await Promise.all(certUrls.slice(0, 5).map(url => scrapeCertUrl(url)))
            certs = results.filter(Boolean)
            send({ status: `Certifications processed ✓ — ${certs.length} of ${certUrls.length} URLs scraped successfully` })
        }

        send({ status: 'Selecting design style based on your profile...' })
        const designs = pickDesigns(githubData, linkedinSummary, customNote)
        send({ status: `Design selected: ${designs[0].name} ✓` })

        const structuredData = {
            name: name.trim(),
            title: title?.trim() || '',
            githubData,
            linkedinSummary: linkedinSummary?.trim() || '',
            certs,
            customNote: customNote?.trim() || ''
        }

        send({ status: 'Generating your premium portfolio website...' })

        const finalPrompt = buildPortfolioPrompt(structuredData, designs, userImages || [])

        let fullContent = ''
        let usingFallback = false

        const consumeGeminiStream = async (streamBody) => {
            const reader = streamBody.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop()
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const raw = line.slice(6).trim()
                    if (!raw) continue
                    try {
                        const chunk = JSON.parse(raw)
                        const token = chunk.candidates?.[0]?.content?.parts?.[0]?.text || ''
                        if (token) { fullContent += token; send({ chunk: token }) }
                    } catch (_) {}
                }
            }
        }

        const consumeOpenRouterStream = async (streamBody) => {
            const reader = streamBody.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop()
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const raw = line.slice(6).trim()
                    if (raw === '[DONE]' || !raw) continue
                    try {
                        const chunk = JSON.parse(raw)
                        const token = chunk.choices?.[0]?.delta?.content || ''
                        if (token) { fullContent += token; send({ chunk: token }) }
                    } catch (_) {}
                }
            }
        }

        try {
            const streamBody = await generateWithGeminiStream(finalPrompt, 'You must return ONLY valid raw JSON. No markdown fences. No explanation.')
            await consumeGeminiStream(streamBody)
        } catch (geminiErr) {
            if (geminiErr.message === 'RATE_LIMIT') {
                usingFallback = true
                fullContent = ''
                send({ status: 'Gemini rate limited — switching to backup model...' })
                const streamBody = await generateResponseStream(finalPrompt)
                await consumeOpenRouterStream(streamBody)
            } else {
                throw geminiErr
            }
        }

        let parsed = await extractJson(fullContent)
        if (!parsed) {
            const retryRaw = usingFallback
                ? await generateResponse(finalPrompt + '\n\nRETURN ONLY RAW JSON. No markdown fences.')
                : await generateWithGemini(finalPrompt + '\n\nRETURN ONLY RAW JSON. No markdown fences.', 'You must return ONLY valid raw JSON.')
            parsed = await extractJson(retryRaw)
        }

        if (!parsed?.code) { send({ error: 'AI returned an invalid response — please try again' }); return }

        const website = await Website.create({
            user: user._id,
            title: `${name.trim()} — Portfolio`,
            latestCode: parsed.code,
            modelUsed: 'gemini',
            conversation: [
                { role: 'ai', content: parsed.message || `Portfolio generated for ${name.trim()}` },
                { role: 'user', content: `Generate portfolio for ${name.trim()} (GitHub: ${githubUrl})` }
            ]
        })

        user.credits -= PORTFOLIO_CREDITS
        await user.save()

        send({ done: true, websiteId: website._id, creditsLeft: user.credits })

        injectWidgetAndEmbed(website._id.toString(), parsed.code)
            .catch(err => console.error('Portfolio post-gen tasks failed:', err.message))

    } catch (error) {
        send({ error: error.message || String(error) })
    } finally {
        res.end()
    }
}
