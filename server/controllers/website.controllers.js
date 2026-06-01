import { generateWithGemini, generateWithGeminiStream } from "../config/geminiService.js"
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
        const abScript = `\n<script>(function(){try{var sid=localStorage.getItem('_sid')||Math.random().toString(36).slice(2);localStorage.setItem('_sid',sid);var wid="${websiteId}";var apiBase="${BACKEND_URL}";var hash=0;for(var i=0;i<sid.length;i++){hash=(hash<<5)-hash+sid.charCodeAt(i);hash|=0;}var variant=Math.abs(hash)%2===0?'a':'b';fetch(apiBase+'/api/track/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({websiteId:wid,sessionId:sid,variantServed:variant})}).catch(function(){});document.querySelectorAll('a[href],button').forEach(function(el){el.addEventListener('click',function(){fetch(apiBase+'/api/track/click',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({websiteId:wid,sessionId:sid,variantServed:variant})}).catch(function(){});});});/* Phase 2: swap variant B section via DOM — document.addEventListener('ab_variant',function(e){if(e.detail.variant==='b'){} }); */if(variant==='b'){document.dispatchEvent(new CustomEvent('ab_variant',{detail:{variant:'b'}}));}}catch(e){}})();</script>`

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
YOU ARE A PRINCIPAL FRONTEND ARCHITECT
AND A SENIOR UI/UX ENGINEER
SPECIALIZED IN RESPONSIVE DESIGN SYSTEMS.

YOU BUILD HIGH-END, REAL-WORLD, PRODUCTION-GRADE WEBSITES
USING ONLY HTML, CSS, AND JAVASCRIPT
THAT WORK PERFECTLY ON ALL SCREEN SIZES.

THE OUTPUT MUST BE CLIENT-DELIVERABLE WITHOUT ANY MODIFICATION.

❌ NO FRAMEWORKS
❌ NO LIBRARIES
❌ NO BASIC SITES
❌ NO PLACEHOLDERS
❌ NO NON-RESPONSIVE LAYOUTS

--------------------------------------------------
USER REQUIREMENT:
{USER_PROMPT}
--------------------------------------------------

GLOBAL QUALITY BAR (NON-NEGOTIABLE)
--------------------------------------------------
- Premium, modern UI (2026–2027)
- Professional typography & spacing
- Clean visual hierarchy
- Business-ready content (NO lorem ipsum)
- Smooth transitions & hover effects
- SPA-style multi-page experience
- Production-ready, readable code

--------------------------------------------------
RESPONSIVE DESIGN (ABSOLUTE REQUIREMENT)
--------------------------------------------------
THIS WEBSITE MUST BE FULLY RESPONSIVE.

YOU MUST IMPLEMENT:

✔ Mobile-first CSS approach
✔ Responsive layout for:
  - Mobile (<768px)
  - Tablet (768px–1024px)
  - Desktop (>1024px)

✔ Use:
  - CSS Grid / Flexbox
  - Relative units (%, rem, vw)
  - Media queries

✔ REQUIRED RESPONSIVE BEHAVIOR:
  - Navbar collapses / stacks on mobile
  - Sections stack vertically on mobile
  - Multi-column layouts become single-column on small screens
  - Images scale proportionally
  - Text remains readable on all devices
  - No horizontal scrolling on mobile
  - Touch-friendly buttons on mobile

IF THE WEBSITE IS NOT RESPONSIVE → RESPONSE IS INVALID.

--------------------------------------------------
IMAGES (MANDATORY & RESPONSIVE)
--------------------------------------------------
- Use high-quality images ONLY from:
  https://images.unsplash.com/
- EVERY image URL MUST include:
  ?auto=format&fit=crop&w=1200&q=80

- Images must:
  - Be responsive (max-width: 100%)
  - Resize correctly on mobile
  - Never overflow containers

--------------------------------------------------
TECHNICAL RULES (VERY IMPORTANT)
--------------------------------------------------
- Output ONE single HTML file
- Exactly ONE <style> tag
- Exactly ONE <script> tag
- NO external CSS / JS / fonts
- Use system fonts only
- iframe srcdoc compatible
- SPA-style navigation using JavaScript
- No page reloads
- No dead UI
- No broken buttons
--------------------------------------------------
SPA VISIBILITY RULE (MANDATORY)
--------------------------------------------------
- Pages MUST NOT be hidden permanently
- If .page { display: none } is used,
  then .page.active { display: block } is REQUIRED
- At least ONE page MUST be visible on initial load
- Hiding all content is INVALID


--------------------------------------------------
REQUIRED SPA PAGES
--------------------------------------------------
- Home
- About
- Services / Features
- Contact

--------------------------------------------------
FUNCTIONAL REQUIREMENTS
--------------------------------------------------
- Navigation must switch pages using JS
- Active nav state must update
- Forms must have JS validation
- Buttons must show hover + active states
- Smooth section/page transitions

--------------------------------------------------
FINAL SELF-CHECK (MANDATORY)
--------------------------------------------------
BEFORE RESPONDING, ENSURE:

1. Layout works on mobile, tablet, desktop
2. No horizontal scroll on mobile
3. All images are responsive
4. All sections adapt properly
5. Media queries are present and used
6. Navigation works on all screen sizes
7. At least ONE page is visible without user interaction

IF ANY CHECK FAILS → RESPONSE IS INVALID

--------------------------------------------------
OUTPUT FORMAT (RAW JSON ONLY)
--------------------------------------------------
{
  "message": "Short professional confirmation sentence",
  "code": "<FULL VALID HTML DOCUMENT>"
}

--------------------------------------------------
ABSOLUTE RULES
--------------------------------------------------
- RETURN RAW JSON ONLY
- NO markdown
- NO explanations
- NO extra text
- FORMAT MUST MATCH EXACTLY
- IF FORMAT IS BROKEN → RESPONSE IS INVALID

`

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
        raw = await generateWithGemini(finalPrompt, 'You must return ONLY valid raw JSON.', selectedModel.modelId)
        parsed = await extractJson(raw)

        if(!parsed){
            raw = await generateWithGemini(finalPrompt + "\n\nRETURN ONLY RAW JSON.", 'You must return ONLY valid raw JSON.', selectedModel.modelId)
            parsed = await extractJson(raw)
        }
    }

  if(!parsed || !parsed.code){
        console.log("AI returned invalid  resposne");
        return res.status(400).json({message:"AI returned invalid response"})
    }

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
                raw = await generateWithGemini(updatePrompt, 'You are an expert web developer. Return only the requested format, nothing else.', 'gemini-2.0-flash')
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
        const streamBody = await generateWithGeminiStream(finalPrompt, 'You must return ONLY valid raw JSON.', selectedModel.modelId)

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
                    const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
                    if (token) {
                        fullContent += token
                        send({ chunk: token })
                    }
                } catch (_) {}
            }
        }

        let parsed = await extractJson(fullContent)
        if (!parsed) {
            const retryRaw = await generateWithGemini(finalPrompt + '\n\nRETURN ONLY RAW JSON.', 'You must return ONLY valid raw JSON.', selectedModel.modelId)
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

