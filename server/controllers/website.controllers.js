import { generateResponse, generateResponseStream } from "../config/openRouter.js"
import Website from "../models/website.model.js"
import extractJson  from "../utils/extractJson.js"
import User from "../models/user.model.js"
import { saveVersion } from "../utils/saveVersion.js"
import aiModels from "../config/aiModels.js"
import { generateAndStoreEmbeddings } from "../services/embeddingService.js"

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export async function injectWidgetAndEmbed(websiteId, htmlCode) {
    try {
        const widgetScript = `\n<script src="${BACKEND_URL}/widget.js"></script>\n<script>window.addEventListener('load',function(){if(typeof SiteChat!=='undefined')SiteChat.init({websiteId:"${websiteId}",primaryColor:"#6366f1",apiBase:"${BACKEND_URL}"});});</script>`

        // A/B tracking script — injected into every generated site.
        // Assigns visitors deterministically to variant a/b, then fires visit + click events.
        // Phase 2 note: replace DOM section with variant B HTML inside the 'ab_variant' listener below.
        const abScript = `\n<script>(function(){try{var sid=localStorage.getItem('_sid')||Math.random().toString(36).slice(2);localStorage.setItem('_sid',sid);var wid="${websiteId}";var apiBase="${BACKEND_URL}";var hash=0;for(var i=0;i<sid.length;i++){hash=(hash<<5)-hash+sid.charCodeAt(i);hash|=0;}var variant=Math.abs(hash)%2===0?'a':'b';fetch(apiBase+'/api/track/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({websiteId:wid,sessionId:sid,variantServed:variant})}).catch(function(){});document.querySelectorAll('a[href],button').forEach(function(el){el.addEventListener('click',function(){fetch(apiBase+'/api/track/click',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({websiteId:wid,sessionId:sid,variantServed:variant})}).catch(function(){});});});if(variant==='b'){fetch(apiBase+'/api/experiments/'+wid+'/variant-b').then(function(r){return r.json()}).then(function(data){if(!data.active||!data.variantB_html)return;var sec=data.targetSection;var el=document.getElementById(sec)||document.querySelector('.'+sec)||document.querySelector('[class*="'+sec+'"]')||document.querySelector('section');if(el){var tmp=document.createElement('div');tmp.innerHTML=data.variantB_html;el.replaceWith(tmp.firstElementChild||tmp);}}).catch(function(){});}}catch(e){}})();</script>`

        const injections = widgetScript + abScript
        const codeWithAll = htmlCode.includes('</body>')
            ? htmlCode.replace('</body>', injections + '</body>')
            : htmlCode + injections
        await Website.findByIdAndUpdate(websiteId, { latestCode: codeWithAll })
        await generateAndStoreEmbeddings(websiteId, htmlCode)
    } catch (err) {
        console.error('Post-generation tasks failed:', err.message)
    }
}

export function injectMissingCDNs(html) {
    if (!html || !html.includes('</head>')) return html
    const checks = [
        { test: 'aos@2.3.1/dist/aos.css',    tag: '<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css">' },
        { test: 'gsap/3.12.2/gsap.min.js',   tag: '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>' },
        { test: 'ScrollTrigger.min.js',       tag: '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>' },
        { test: 'animejs/3.2.1/anime.min.js', tag: '<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>' },
        { test: 'typed.js@2.1.0',            tag: '<script src="https://unpkg.com/typed.js@2.1.0/dist/typed.umd.js"></script>' },
        { test: 'vanilla-tilt@1.8.0',        tag: '<script src="https://unpkg.com/vanilla-tilt@1.8.0/dist/vanilla-tilt.min.js"></script>' },
        { test: 'aos@2.3.1/dist/aos.js',     tag: '<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>' },
    ]
    let result = html
    checks.forEach(({ test, tag }) => {
        if (!result.includes(test)) {
            result = result.replace('</head>', tag + '\n</head>')
        }
    })
    return result
}

const generateTimestamps = new Map()

const trackGenerate = (userId) => {
    const now = Date.now()
    const recent = (generateTimestamps.get(userId) || []).filter(t => now - t < 60000)
    if (recent.length >= 3) {
        console.warn(`[ABUSE ALERT] User ${userId} rapid-generating at ${new Date().toISOString()}`)
    }
    recent.push(now)
    generateTimestamps.set(userId, recent)
    setTimeout(() => {
        const current = generateTimestamps.get(userId) || []
        generateTimestamps.set(userId, current.filter(t => Date.now() - t < 60000))
    }, 60000)
}

const masterPrompt = `
You are an elite, award-winning frontend developer who specialises in creating
stunning, highly animated, premium websites that leave visitors speechless.
Every website you generate must feel ALIVE. Static, plain HTML is unacceptable.
You are being paid $10,000 to build this website. Build accordingly.

❌ NO JS FRAMEWORKS (React, Vue, Angular)
❌ NO PLACEHOLDERS OR LOREM IPSUM
❌ NO NON-RESPONSIVE LAYOUTS
❌ NO BASIC OR PLAIN STATIC SITES

════════════════════════════════════════════════
MANDATORY CDN LIBRARIES — Include ALL in <head>
════════════════════════════════════════════════

<link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
<script src="https://unpkg.com/typed.js@2.1.0/dist/typed.umd.js"></script>
<script src="https://unpkg.com/vanilla-tilt@1.8.0/dist/vanilla-tilt.min.js"></script>
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

Also import 2 Google Fonts via <link> in <head>: one serif for headings, one sans-serif for body.

════════════════════════════════════════════════
MANDATORY PAGE ELEMENTS — Place at start of <body>
════════════════════════════════════════════════

1. PAGE LOADER:
<div id="page-loader" style="position:fixed;inset:0;z-index:9999;background:#050810;display:flex;align-items:center;justify-content:center;transition:opacity 0.6s ease;">
  <div style="width:40px;height:40px;border:2px solid rgba(255,255,255,0.1);border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
</div>
<style>@keyframes spin{to{transform:rotate(360deg)}}</style>

2. CUSTOM CURSOR:
<div id="cursor-dot" style="width:8px;height:8px;border-radius:50%;background:#6366f1;position:fixed;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:transform 0.1s ease;"></div>
<div id="cursor-ring" style="width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(99,102,241,0.5);position:fixed;pointer-events:none;z-index:9997;transform:translate(-50%,-50%);transition:all 0.12s ease;"></div>

════════════════════════════════════════════════
USER REQUIREMENT
════════════════════════════════════════════════

{USER_PROMPT}

════════════════════════════════════════════════
GLOBAL QUALITY STANDARDS
════════════════════════════════════════════════

- Premium, modern UI (2026-2027), production-ready
- Business-ready content — NO lorem ipsum ever
- Dark and light sections alternating for visual rhythm
- Consistent accent color used throughout (default: #6366f1 indigo, adapt to brand if specified)
- Generous whitespace: sections 100px 60px padding desktop, 60px 24px mobile
- Heading sizes: clamp(40px,6vw,80px) hero; clamp(28px,4vw,48px) sections
- Letter spacing: -1.5px to -2px on large headings. Line height: 1.1 headings, 1.7 body

════════════════════════════════════════════════
RESPONSIVE DESIGN — ABSOLUTE REQUIREMENT
════════════════════════════════════════════════

Mobile-first. Grid/Flexbox. Relative units (%, rem, vw). Media queries.
- Mobile (<768px): single column, nav hamburger, touch-friendly 44px tap targets
- Tablet (768px-1024px): 2-column where appropriate
- Desktop (>1024px): full multi-column layout
- Navbars: flexbox — logo left, links center, CTA right — all ONE row on desktop
- No horizontal scrolling on any screen size
IF NOT RESPONSIVE → RESPONSE IS INVALID.

════════════════════════════════════════════════
IMAGES
════════════════════════════════════════════════

- Use ONLY https://images.unsplash.com/ URLs with ?auto=format&fit=crop&w=1200&q=80
- All images: max-width:100%, loading="lazy", never overflow containers
- NEVER use <img> for UI mockups/dashboards — build those as CSS divs only

════════════════════════════════════════════════
SPA NAVIGATION — MANDATORY PATTERN
════════════════════════════════════════════════

Pages: Home, About, Services/Features, Contact (minimum).
Every section has an id. Every nav link has data-section attribute.

Use this navigation pattern:
  function showSection(id) {
    document.querySelectorAll('section[id]').forEach(s =>
      s.style.display = s.id === id ? 'block' : 'none'
    )
    document.querySelectorAll('[data-section]').forEach(a =>
      a.classList.toggle('active', a.dataset.section === id)
    )
    setTimeout(() => { if(typeof AOS !== 'undefined') AOS.refresh() }, 50)
  }
  document.querySelectorAll('[data-section]').forEach(a =>
    a.addEventListener('click', e => { e.preventDefault(); showSection(a.dataset.section) })
  )
  showSection('home')

The AOS.refresh() call is REQUIRED — it triggers scroll animations for newly visible section elements.
At least ONE section must be visible on initial load. Hiding all content is INVALID.

════════════════════════════════════════════════
MANDATORY CSS — Include in <style> block
════════════════════════════════════════════════

/* Base */
*,*::before,*::after{box-sizing:border-box;transition:color 0.2s ease,background-color 0.2s ease;}
html{scroll-behavior:smooth;}

/* Interactive elements */
a,button,.card,[class*="-card"],[class*="btn"]{transition:all 0.3s cubic-bezier(0.4,0,0.2,1);}

/* Card hover lift */
.card,[class*="-card"]{transform:translateY(0);}
.card:hover,[class*="-card"]:hover{transform:translateY(-6px);box-shadow:0 20px 60px rgba(0,0,0,0.15);}

/* Button ripple + scale */
.btn{position:relative;overflow:hidden;cursor:pointer;}
.btn::before{content:'';position:absolute;width:0;height:0;border-radius:50%;background:rgba(255,255,255,0.2);top:50%;left:50%;transform:translate(-50%,-50%);transition:width 0.6s ease,height 0.6s ease,opacity 0.6s ease;}
.btn:active::before{width:300px;height:300px;opacity:0;}
.btn:hover{transform:translateY(-2px) scale(1.02);}
.btn:active{transform:translateY(0) scale(0.98);}

/* Primary button shimmer */
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
.btn-primary{background:linear-gradient(90deg,#6366f1 0%,#8b5cf6 25%,#6366f1 50%,#8b5cf6 75%,#6366f1 100%);background-size:200% auto;animation:shimmer 4s linear infinite;}

/* Scrollbar */
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#6366f1;border-radius:2px;}
::selection{background:rgba(99,102,241,0.3);color:inherit;}

/* Gradient text utility */
.text-gradient{background:linear-gradient(135deg,#a78bfa,#818cf8,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}

/* GSAP initial states — prevent flash of unstyled content */
.hero-badge,.hero-headline,.hero-sub,.hero-cta,.hero-chips{opacity:0;transform:translateY(30px);}

/* Animations */
@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}33%{transform:translateY(-15px) rotate(2deg)}66%{transform:translateY(-8px) rotate(-2deg)}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)}50%{box-shadow:0 0 40px rgba(99,102,241,0.6)}}
@keyframes heroGlow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}

/* Animated hero background */
.hero-gradient{background-size:200% 200%;animation:heroGlow 8s ease infinite;}

/* Nav hover underline */
nav a{position:relative;}
nav a::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1.5px;background:#6366f1;transition:width 0.3s ease;}
nav a:hover::after{width:100%;}

/* Accessibility */
:focus-visible{outline:2px solid #6366f1;}
img{loading:lazy;}

════════════════════════════════════════════════
MANDATORY ANIMATIONS — ALL required
════════════════════════════════════════════════

HERO SECTION:
- Hero background: animated gradient with heroGlow keyframe (class="hero-gradient")
- Add 3-4 floating decorative shapes (position:absolute, animation:float 6s ease-in-out infinite, stagger delays 0s/1s/2s/3s)
- Apply classes hero-badge, hero-headline, hero-sub, hero-cta, hero-chips to the hero elements (GSAP animates them on load)
- Typewriter headline: <span id="typed-headline" data-strings='["Main Headline.","Alternative.","Third Variation."]'></span>
- Hero parallax: hero background div with class="hero-bg" (GSAP scrollTrigger moves it yPercent:40)

AOS ON EVERY ELEMENT:
- Every card, feature item, section heading, testimonial, pricing card: data-aos="fade-up"
- Stagger delays: data-aos-delay="0" "100" "200" "300" for grid items
- Section headings: data-aos="fade-up" data-aos-duration="600"
- Large images or mockups: data-aos="fade-up" data-aos-duration="1000"

STATISTICS:
- Any stat/number elements: data-target="100" (GSAP counts up on scroll)

════════════════════════════════════════════════
COMPLETE JAVASCRIPT BLOCK — Place before </body>
════════════════════════════════════════════════

<script>
gsap.registerPlugin(ScrollTrigger)

// Page loader
window.addEventListener('load', () => {
  gsap.to('#page-loader', { opacity:0, duration:0.6, delay:0.3,
    onComplete: () => { const el=document.getElementById('page-loader'); if(el) el.style.display='none' }
  })
})

// AOS
AOS.init({ duration:750, once:true, easing:'ease-out-cubic', offset:80 })

// Custom cursor
const cursorDot=document.getElementById('cursor-dot')
const cursorRing=document.getElementById('cursor-ring')
if(cursorDot && cursorRing){
  let mx=0,my=0,rx=0,ry=0
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY
    cursorDot.style.left=mx+'px'; cursorDot.style.top=my+'px'
  })
  ;(function tick(){
    rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12
    cursorRing.style.left=rx+'px'; cursorRing.style.top=ry+'px'
    requestAnimationFrame(tick)
  })()
  document.querySelectorAll('a,button,.card,[class*="-card"]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorDot.style.transform='translate(-50%,-50%) scale(2.5)'
      cursorRing.style.transform='translate(-50%,-50%) scale(1.5)'
    })
    el.addEventListener('mouseleave', () => {
      cursorDot.style.transform='translate(-50%,-50%) scale(1)'
      cursorRing.style.transform='translate(-50%,-50%) scale(1)'
    })
  })
}

// Navbar scroll effect
const nav=document.querySelector('nav')
if(nav){
  window.addEventListener('scroll', () => {
    if(window.scrollY>60){
      nav.style.background='rgba(5,8,16,0.95)'
      nav.style.backdropFilter='blur(20px)'
      nav.style.borderBottom='1px solid rgba(255,255,255,0.08)'
    } else {
      nav.style.background='transparent'
      nav.style.borderBottom='none'
    }
  }, { passive:true })
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault()
    const t=document.querySelector(a.getAttribute('href'))
    if(t) t.scrollIntoView({ behavior:'smooth' })
  })
})

// SPA navigation with AOS refresh
function showSection(id){
  document.querySelectorAll('section[id]').forEach(s =>
    s.style.display = s.id===id ? 'block' : 'none'
  )
  document.querySelectorAll('[data-section]').forEach(a =>
    a.classList.toggle('active', a.dataset.section===id)
  )
  setTimeout(() => AOS.refresh(), 50)
}
document.querySelectorAll('[data-section]').forEach(a =>
  a.addEventListener('click', e => { e.preventDefault(); showSection(a.dataset.section) })
)
showSection('home')

// Hero GSAP entrance
const heroTl=gsap.timeline({ delay:0.9 })
;['.hero-badge','.hero-headline','.hero-sub','.hero-cta','.hero-chips'].forEach((sel,i) => {
  const el=document.querySelector(sel)
  if(el) heroTl.to(el, { opacity:1, y:0, duration:0.7, ease:'power3.out' }, i*0.15)
})

// Hero parallax
const heroBg=document.querySelector('.hero-bg,.hero-background,.hero-gradient')
if(heroBg){
  gsap.to(heroBg, { yPercent:40, ease:'none',
    scrollTrigger:{ trigger:heroBg.closest('section')||heroBg, start:'top top', end:'bottom top', scrub:true }
  })
}

// VanillaTilt on cards
if(typeof VanillaTilt!=='undefined'){
  VanillaTilt.init(document.querySelectorAll(
    '.feature-card,.pricing-card,.project-card,.testimonial-card,.card,[class*="-card"]'
  ), { max:8, speed:400, glare:true, 'max-glare':0.15 })
}

// Stat counters
document.querySelectorAll('[data-target]').forEach(el => {
  const target=parseInt(el.getAttribute('data-target'))
  if(isNaN(target)) return
  gsap.from(el, {
    textContent:0, duration:2.5, ease:'power2.out',
    snap:{ textContent:1 },
    scrollTrigger:{ trigger:el, start:'top 85%' },
    onUpdate: function(){ el.textContent=Math.round(this.targets()[0].textContent).toLocaleString() }
  })
})

// Anime.js stagger on feature lists
if(typeof anime!=='undefined'){
  const featureItems=document.querySelectorAll('.feature-item,.feature-list li')
  if(featureItems.length){
    const obs=new IntersectionObserver(entries => {
      if(entries[0].isIntersecting){
        anime({ targets:featureItems, translateX:[-30,0], opacity:[0,1], delay:anime.stagger(80), easing:'easeOutExpo', duration:800 })
        obs.disconnect()
      }
    }, { threshold:0.2 })
    obs.observe(featureItems[0])
  }
}

// Typed.js headline
const typedEl=document.getElementById('typed-headline')
if(typedEl && typeof Typed!=='undefined'){
  const strings=typedEl.getAttribute('data-strings')
  new Typed('#typed-headline', {
    strings: strings ? JSON.parse(strings) : [typedEl.textContent||'Welcome.'],
    typeSpeed:60, backSpeed:30, backDelay:2500, loop:true, cursorChar:'|'
  })
}
</script>

════════════════════════════════════════════════
OUTPUT FORMAT — RAW JSON ONLY
════════════════════════════════════════════════

{
  "message": "Short professional confirmation sentence",
  "code": "<FULL VALID HTML DOCUMENT>"
}

════════════════════════════════════════════════
ABSOLUTE RULES
════════════════════════════════════════════════

- RETURN RAW JSON ONLY — no markdown, no explanations, no extra text
- ALL CDN script tags MUST be in <head>
- The complete JavaScript block MUST be before </body>
- data-aos attributes MUST be on every card, section heading, and feature element
- data-target MUST be on every statistic number
- id="typed-headline" with data-strings MUST be on the hero headline span
- A website without animations is a FAILURE — every element must have a moment to enter
- IF FORMAT IS BROKEN → RESPONSE IS INVALID

`

export const optimizePrompt = async (req, res) => {
    try {
        const { prompt } = req.body
        if (!prompt?.trim()) return res.status(400).json({ message: 'prompt is required' })

        const user = await User.findById(req.user._id)
        if (!user) return res.status(400).json({ message: 'user not found' })
        if (user.credits < 5) return res.status(400).json({ message: 'Not enough credits — prompt optimization requires 5 credits' })

        const systemPrompt = `You are a senior prompt engineer specializing in AI website generation. Your task is to transform a casual website description into a precise, structured, technical generation prompt that produces dramatically better website output from an AI model.

The optimized prompt must:
- Define brand identity: specific color palette (hex codes), font pairings, visual tone
- List every required section with specific content direction (not vague)
- Specify layout decisions: hero type, navigation style, card layout, grid columns
- Include design constraints: animation style, hover states, mobile behavior
- Mention quality bar: "must feel like a $X,000 professional build"
- Be 250-400 words, structured with labeled sections in ALL CAPS
- Be written as a direct instruction to an AI system, not as a description

Return ONLY the optimized prompt text. No explanation, no preamble, no markdown.`

        const optimized = await generateResponse(prompt, null, systemPrompt)

        user.credits -= 5
        await user.save()

        return res.status(200).json({ optimizedPrompt: optimized.trim(), remainingCredits: user.credits })
    } catch (error) {
        return res.status(500).json({ message: `optimize prompt error: ${error?.message || error}` })
    }
}

export const generateWebsite = async (req, res) => {
    try{
      const { prompt, model: modelKey = 'gemini' } = req.body
      if(!prompt){
        return res.status(400).json({message:"prompt is required"})
      }

      const selectedModel = aiModels[modelKey]
      if(!selectedModel){
        return res.status(400).json({message:"Invalid model selected"})
      }

      const user = await User.findById(req.user._id);
      if(!user){
        return res.status(400).json({message:"user not found"})
      }

      if(!selectedModel.available.includes(user.plans)){
        return res.status(403).json({message:"Upgrade your plan to use this model"})
      }

      trackGenerate(req.user._id.toString())

      if(user.credits < selectedModel.creditsPerGeneration){
        return res.status(400).json({message:"not enough credits to generate a website"}) 
      }

  const finalPrompt = masterPrompt.replace("{USER_PROMPT}",prompt);
    let raw = ""
    let parsed =null
    for(let i=0;i<2 && !parsed;i++){
        raw = await generateResponse(finalPrompt)
        parsed = await extractJson(raw)

        if(!parsed){
            raw = await generateResponse(finalPrompt + "\n\nRETURN ONLY RAW JSON.")
            parsed = await extractJson(raw)
        }
    }

  if(!parsed || !parsed.code){
        console.log("AI returned invalid  resposne");
        return res.status(400).json({message:"AI returned invalid response"})
    }

    parsed.code = injectMissingCDNs(parsed.code)

    const website = await Website.create({
        user:user._id,
        title:prompt.slice(0,60),
        latestCode:parsed.code,
        modelUsed: modelKey,
        conversation: [
            {
                role:"ai",
                content:parsed.message
            },
            {
                role:"user",
                content:prompt
            }
        ]
    })

    user.credits = user.credits - selectedModel.creditsPerGeneration;
    await user.save();

    injectWidgetAndEmbed(website._id.toString(), parsed.code)
        .catch(err => console.error('Background tasks failed:', err.message))

    return res.status(201).json({
        websiteId:website._id,
        remainingCredits:user.credits
    })

    }catch(error){
      return res.status(500).json({message:`generate website error ${error?.message || error}`})
    }
}


export const getWebsiteById = async(req, res)=>{
  try{
    const website = await Website.findOne({
      _id:req.params.id,
      user:req.user._id
    })
    if(!website){
      return res.status(400).json({message:"website not found"})
    }
    return res.status(200).json(website)
  }catch(error){
    return res.status(500).json({message:`get website error ${error?.message || error}`})
  }
}


export const changes = async(req, res)=>{
  try{
    const {prompt} = req.body
    if(!prompt){
      return res.status(400).json({"message":"prompt is required"})

    }

    const website = await Website.findOne({
      _id:req.params.id,
      user:req.user._id
    })

    if(!website){
      return res.status(400).json({"message":"website not found"})

    }

    const user = await User.findById(req.user._id)

    if(!user){
      return res.status(400).json({message:"user not found"})
    }
    if(user.credits < 10){
      return res.status(400).json({message:"you do not have enough credits to generate a website"})

    }

            const trimmedCode = website.latestCode
                .replace(/\n\s*\n/g, '\n')
                .replace(/  +/g, ' ')
                .trim()

            const updatePrompt = `You are updating an HTML website.

CURRENT CODE:
${trimmedCode}

USER REQUEST: ${prompt}

Reply using EXACTLY this format — no JSON, no markdown:
<MESSAGE>One sentence confirmation</MESSAGE>
<CODE>
<!DOCTYPE html>
...complete updated HTML file here...
</CODE>`

             let raw = ""
             for(let i = 0; i < 2; i++){
                raw = await generateResponse(updatePrompt)
                if(raw && raw.includes('<CODE>')) break
             }

             const messageMatch = raw.match(/<MESSAGE>([\s\S]*?)<\/MESSAGE>/)
             const codeMatch = raw.match(/<CODE>([\s\S]*?)<\/CODE>/)
             const parsedMessage = messageMatch?.[1]?.trim() || 'Website updated'
             const parsedCode = codeMatch?.[1]?.trim()

             if (!parsedCode) {
            console.log("ai returned invalid response", raw?.slice(0, 500))
            return res.status(400).json({ message: "ai returned invalid response" })
        }

        const parsed = { message: parsedMessage, code: parsedCode }
            

        website.conversation.push(
          {role:"user" , content:prompt},
          {role:"ai" , content:parsed.message}
        )

        await saveVersion(website._id, req.user._id, website.latestCode, prompt.slice(0, 100))

        website.latestCode = parsed.code 

        await website.save()
        user.credits = user.credits - 10
        await user.save()

        generateAndStoreEmbeddings(website._id.toString(), parsed.code)
            .catch(err => console.error('Re-embedding after update failed:', err.message))

        return res.status(200).json({
          message:parsed.message,
          code:parsed.code,
          remainingCredits:user.credits
        })


  }catch(error){
    return res.status(500).json({message:`update website error ${error}`})

  }
}

export const patchWebsite = async (req, res) => {
    try {
        const { isWidgetEnabled, widgetColor } = req.body
        const update = {}
        if (typeof isWidgetEnabled === 'boolean') update.isWidgetEnabled = isWidgetEnabled
        if (widgetColor !== undefined) {
            if (!/^#[0-9A-Fa-f]{6}$/.test(widgetColor)) {
                return res.status(400).json({ message: 'Invalid hex color' })
            }
            update.widgetColor = widgetColor
        }
        const website = await Website.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            update,
            { new: true }
        )
        if (!website) return res.status(404).json({ message: 'website not found' })
        return res.json({ isWidgetEnabled: website.isWidgetEnabled, widgetColor: website.widgetColor })
    } catch (err) {
        return res.status(500).json({ message: 'patch website error: ' + err.message })
    }
}

export const deleteWebsite = async(req, res)=>{
  try{
    const website = await Website.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    })
    if(!website){
      return res.status(404).json({message:"website not found"})
    }
    return res.status(200).json({message:"website deleted"})
  }catch(error){
    return res.status(500).json({message:`delete website error ${error}`})
  }
}

export const getAll = async(req, res)=>{
  try{
    const websites = await Website.find({user:req.user._id})
    return res.status(200).json(websites)

  }catch(error){
    return res.status(500).json({message:`get all websites error ${error}`})
  }
}

export const deploy = async(req, res)=>{
  try{
    const website = await Website.findOne({
      _id:req.params.id,
      user:req.user._id
    })
    if(!website){
      return res.status(400).json({message:"website not found"})
    }

    if(!website.slug){
      website.slug = website.title.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,60) + website._id.toString().slice(-5)

    }

    website.deployed = true
    website.deployUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/site/${website.slug}`
    await website.save()

    return res.status(200).json({
      url:website.deployUrl
    })

    
  }catch(error){
    return res.status(500).json({message:`deploy website error ${error}`})
  }
}


export const getBySlug = async(req, res)=>{
  try{
    const website = await Website.findOne({
      slug:req.params.slug
    })
    if(!website){
      return res.status(400).json({message:"website not found"})

    }
    return res.status(200).json(website)
  }catch(error){
    return res.status(500).json({message:`get website by slug error ${error}`})
  }
}

export const generateWebsiteStream = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`)

    try {
        const { prompt, model: modelKey = 'gemini' } = req.body
        if (!prompt) { send({ error: 'prompt is required' }); return }

        const selectedModel = aiModels[modelKey]
        if (!selectedModel) { send({ error: 'Invalid model selected' }); return }

        const user = await User.findById(req.user._id)
        if (!user) { send({ error: 'user not found' }); return }

        if (!selectedModel.available.includes(user.plans)) {
            send({ error: 'Upgrade your plan to use this model' })
            return
        }

        if (user.credits < selectedModel.creditsPerGeneration) { send({ error: 'not enough credits to generate a website' }); return }

        trackGenerate(req.user._id.toString())

        const finalPrompt = masterPrompt.replace('{USER_PROMPT}', prompt)

        const streamBody = await generateResponseStream(finalPrompt)

        const reader = streamBody.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
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
                if (raw === '[DONE]') continue
                try {
                    const parsed = JSON.parse(raw)
                    const token = parsed.choices?.[0]?.delta?.content || ''
                    if (token) {
                        fullContent += token
                        send({ chunk: token })
                    }
                } catch (_) {}
            }
        }

        let parsed = await extractJson(fullContent)
        if (!parsed) {
            const retryRaw = await generateResponse(finalPrompt + '\n\nRETURN ONLY RAW JSON.')
            parsed = await extractJson(retryRaw)
        }

        if (!parsed?.code) { send({ error: 'AI returned invalid response' }); return }

        const website = await Website.create({
            user: user._id,
            title: prompt.slice(0, 60),
            latestCode: parsed.code,
            modelUsed: modelKey,
            conversation: [
                { role: 'ai', content: parsed.message || 'Website generated' },
                { role: 'user', content: prompt }
            ]
        })

        user.credits = user.credits - selectedModel.creditsPerGeneration
        await user.save()

        send({ done: true, websiteId: website._id, creditsLeft: user.credits })

        injectWidgetAndEmbed(website._id.toString(), parsed.code)
            .catch(err => console.error('Background tasks failed:', err.message))

    } catch (error) {
        send({ error: error.message || String(error) })
    } finally {
        res.end()
    }
}

