import { generateWithGeminiStream, generateWithGemini } from '../config/geminiService.js'
import { generateResponse, generateResponseStream } from '../config/openRouter.js'
import { fetchGitHubData, scrapeCertUrl } from '../services/portfolioScraper.js'
import portfolioDesigns from '../config/portfolioDesigns.js'
import Website from '../models/website.model.js'
import User from '../models/user.model.js'
import extractJson from '../utils/extractJson.js'
import { injectWidgetAndEmbed, injectMissingCDNs } from './website.controllers.js'

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
MANDATORY CDN LIBRARIES — Include ALL in <head>
==================================================
<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
<script src="https://unpkg.com/typed.js@2.1.0/dist/typed.umd.js"></script>
<script src="https://unpkg.com/vanilla-tilt@1.8.0/dist/vanilla-tilt.min.js"></script>
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

==================================================
MANDATORY PAGE ELEMENTS — Add at start of <body>
==================================================
1. Page loader: <div id="page-loader" style="position:fixed;inset:0;z-index:9999;background:#050810;display:flex;align-items:center;justify-content:center;"><div style="width:40px;height:40px;border:2px solid rgba(255,255,255,0.1);border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;"></div></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>
2. Custom cursor: <div id="cursor-dot" style="width:8px;height:8px;border-radius:50%;background:var(--accent,#6366f1);position:fixed;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:transform 0.1s ease;"></div><div id="cursor-ring" style="width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(99,102,241,0.5);position:fixed;pointer-events:none;z-index:9997;transform:translate(-50%,-50%);transition:all 0.12s ease;"></div>

==================================================
TECHNICAL REQUIREMENTS
==================================================
- ONE HTML file, CDN <script> tags in <head>, ONE inline <script> block before </body>
- Fully responsive: mobile hamburger menu, grid collapses to 1 column on mobile
- Project GitHub links: target="_blank" rel="noopener noreferrer"
- No Lorem Ipsum — only real provided data

HERO STRUCTURE (MANDATORY):
- Split person's name into individual letters: <h1><span class="name-letter">J</span><span class="name-letter">o</span>...</h1>
- Role typewriter: <span id="typed-role" data-strings='["${title || 'Software Developer.'}","Problem Solver.","Builder."]'></span>
- Profile photo (if provided): class="profile-photo" on <img> tag

AOS ON EVERY ELEMENT:
- data-aos="fade-up" on every card, section heading, skill pill, cert card
- Stagger delays: data-aos-delay="0" "100" "200" "300" for grid items
- data-aos="fade-left" for experience timeline items

STAT NUMBERS: data-target="47" on each GitHub stat number (GSAP counts up)
SKILL BARS: <div class="skill-bar" data-width="85%"></div> inside a .skill-bar-bg wrapper
TIMELINE: vertical line with class="timeline-line" inside div class="timeline-container"
PROJECT CARDS: class="project-card", tech stack pills class="tech-pill" inside each card
SOCIAL LINKS: class="social-link" on each social icon link
CONTACT SECTION: class="contact-section", main CTA text class="contact-cta"

SCROLLING TECH MARQUEE (between skills and projects):
<div style="overflow:hidden;white-space:nowrap;padding:20px 0;">
  <div class="marquee-track" style="display:inline-block;animation:marquee 20s linear infinite;">[all tech names as pills, repeated twice]</div>
</div>
@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

SPA NAVIGATION — COPY THIS EXACT PATTERN:
Give every section an id: <section id="home">, <section id="about">, <section id="projects">, <section id="skills">, <section id="contact">
Give every nav link a data-section attribute: <a data-section="about" href="#">About</a>

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('[data-section]');
function showSection(id) {
  sections.forEach(s => s.style.display = s.id === id ? 'block' : 'none');
  navLinks.forEach(a => a.classList.toggle('active', a.dataset.section === id));
  setTimeout(() => AOS.refresh(), 50);
}
navLinks.forEach(a => a.addEventListener('click', e => { e.preventDefault(); showSection(a.dataset.section); }));
showSection('home');

COMPLETE JAVASCRIPT BLOCK — Place before </body>:
<script>
gsap.registerPlugin(ScrollTrigger)
window.addEventListener('load', () => {
  gsap.to('#page-loader', { opacity:0, duration:0.6, delay:0.2,
    onComplete: () => { const el=document.getElementById('page-loader'); if(el) el.style.display='none' }
  })
})
AOS.init({ duration:800, once:true, easing:'ease-out-cubic', offset:60 })
const dot=document.getElementById('cursor-dot'), ring=document.getElementById('cursor-ring')
if(dot && ring){
  let mx=0,my=0,rx=0,ry=0
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px'})
  ;(function tick(){rx+=(mx-rx)*0.1;ry+=(my-ry)*0.1;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(tick)})()
  document.querySelectorAll('a,button,.project-card,.card').forEach(el=>{
    el.addEventListener('mouseenter',()=>{dot.style.transform='translate(-50%,-50%) scale(3)';ring.style.transform='translate(-50%,-50%) scale(1.6)'})
    el.addEventListener('mouseleave',()=>{dot.style.transform='translate(-50%,-50%) scale(1)';ring.style.transform='translate(-50%,-50%) scale(1)'})
  })
}
const nav=document.querySelector('nav')
if(nav){ window.addEventListener('scroll',()=>{ nav.style.background=window.scrollY>50?'rgba(5,8,16,0.95)':'transparent'; nav.style.backdropFilter=window.scrollY>50?'blur(20px)':'none' },{passive:true}) }
const sections=document.querySelectorAll('section[id]'), navLinks=document.querySelectorAll('[data-section]')
function showSection(id){ sections.forEach(s=>s.style.display=s.id===id?'block':'none'); navLinks.forEach(a=>a.classList.toggle('active',a.dataset.section===id)); setTimeout(()=>AOS.refresh(),50) }
navLinks.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showSection(a.dataset.section)}))
showSection('home')
gsap.from('.name-letter',{opacity:0,y:80,rotateX:90,transformOrigin:'top center',stagger:0.04,duration:0.7,ease:'back.out(1.7)',delay:0.8})
const typedRole=document.getElementById('typed-role')
if(typedRole && typeof Typed!=='undefined'){ new Typed('#typed-role',{ strings:JSON.parse(typedRole.getAttribute('data-strings')||'["Developer."]'), typeSpeed:70, backSpeed:40, backDelay:2000, loop:true }) }
gsap.utils.toArray('.skill-bar').forEach(bar=>{ gsap.to(bar,{width:bar.getAttribute('data-width')||'80%',duration:1.5,ease:'power3.out',scrollTrigger:{trigger:bar,start:'top 85%'}}) })
gsap.to('.timeline-line',{height:'100%',ease:'none',scrollTrigger:{trigger:'.timeline-container',start:'top 70%',end:'bottom 30%',scrub:0.5}})
if(typeof VanillaTilt!=='undefined'){
  VanillaTilt.init(document.querySelectorAll('.project-card'),{max:12,speed:300,glare:true,'max-glare':0.25})
  VanillaTilt.init(document.querySelectorAll('.cert-card,.stat-card'),{max:6,speed:400,glare:false})
}
document.querySelectorAll('[data-target]').forEach(el=>{ const t=parseInt(el.getAttribute('data-target')); if(isNaN(t)) return; gsap.from(el,{textContent:0,duration:2.5,ease:'power2.out',snap:{textContent:1},scrollTrigger:{trigger:el,start:'top 85%'},onUpdate:function(){el.textContent=Math.round(this.targets()[0].textContent).toLocaleString()}}) })
gsap.from('.about-text p,.about-text li',{opacity:0,y:30,duration:0.8,stagger:0.12,ease:'power3.out',scrollTrigger:{trigger:'.about-section',start:'top 70%'}})
gsap.from('.profile-photo',{scale:0.8,opacity:0,duration:1,ease:'back.out(1.7)',scrollTrigger:{trigger:'.about-section',start:'top 70%'}})
gsap.from('.contact-cta',{scale:0.9,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:'.contact-section',start:'top 70%'}})
if(typeof anime!=='undefined'){
  const certEl=document.querySelector('.cert-card')
  if(certEl){ new IntersectionObserver(entries=>{ if(entries[0].isIntersecting) anime({targets:'.cert-card',translateY:[40,0],opacity:[0,1],delay:anime.stagger(100),easing:'easeOutExpo',duration:700}) },{threshold:0.2}).observe(certEl) }
  document.querySelectorAll('.project-card').forEach(card=>{ card.addEventListener('mouseenter',()=>anime({targets:card.querySelectorAll('.tech-pill'),scale:[0.8,1],opacity:[0.5,1],delay:anime.stagger(40),duration:300,easing:'easeOutBack'})) })
  const socials=document.querySelectorAll('.social-link')
  if(socials.length) anime({targets:socials,scale:[0,1],opacity:[0,1],delay:anime.stagger(100),easing:'easeOutBack',duration:600})
}
</script>

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

        parsed.code = injectMissingCDNs(parsed.code)

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
