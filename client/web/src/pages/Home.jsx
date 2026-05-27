import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from "motion/react"
import LoginModal from '../components/LoginModal'
import { useDispatch, useSelector } from 'react-redux'
import { Coins } from "lucide-react"
import { serverUrl } from '../App'
import axios from 'axios'
import { setUserData } from '../redux/userSlice'
import { useNavigate } from 'react-router-dom'
const DEMO_ITEMS = [
    {
        prompt: 'Cozy ramen shop in the heart of London',
        nav: 'Tanuki Ramen', navLinks: ['Menu','About','Find Us'],
        heading1: 'Soul poured into', heading2: 'every bowl.',
        sub: 'Traditional 18-hour broths · Shoreditch, London', btn: 'View Menu',
        bg: '#130b03', text: '#f5e6d3', accent: '#d4622a',
        headerBg: 'rgba(255,255,255,.04)',
        heroBg: 'radial-gradient(circle at 50% 60%,rgba(180,80,20,.18) 0%,transparent 65%)',
    },
    {
        prompt: 'Premium skincare brand for busy NYC professionals',
        nav: 'Lumière', navLinks: ['Products','Ritual','Stores'],
        heading1: 'Skin that speaks', heading2: 'without words.',
        sub: 'Clean, science-backed skincare · New York', btn: 'Shop Now',
        bg: '#0d0d11', text: '#f0ece8', accent: '#c9a96e',
        headerBg: 'rgba(255,255,255,.04)',
        heroBg: 'radial-gradient(circle at 50% 60%,rgba(180,150,80,.12) 0%,transparent 65%)',
    },
    {
        prompt: 'Sustainable surf gear company in Bali',
        nav: 'Ombak Co.', navLinks: ['Gear','Story','Stockists'],
        heading1: 'Ride clean.', heading2: 'Leave nothing.',
        sub: 'Eco-certified surf gear · Canggu, Bali', btn: 'Shop Gear',
        bg: '#050f18', text: '#e0f4ff', accent: '#22c3e8',
        headerBg: 'rgba(255,255,255,.04)',
        heroBg: 'radial-gradient(circle at 50% 60%,rgba(20,140,180,.2) 0%,transparent 65%)',
    },
]

function Home() {

    const highlights = [
        "AI Generated Code",
        "Fully Responsive Layouts",
        "Production Ready Output",
    ]

    const [openLogin, setOpenLogin] = useState(false)
    const { userData } = useSelector(state => state.user)
    const [openProfile, setOpenProfile] = useState(false)
    const [websites, setWebsites] = useState(null)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const handleLogOut = async () => {
        console.log("logout click")
        try {
            await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true })
            dispatch(setUserData(null))
            setOpenProfile(false)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (!userData) return;
        const handleGetAllWebsites = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/website/get-all`, { withCredentials: true })
                setWebsites(result.data || [])
            } catch (error) {
                console.log(error)
            }
        }
        handleGetAllWebsites()
    }, [userData])

    const particles = useMemo(() =>
        Array.from({ length: 55 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2.4 + 0.8,
            op: Math.random() * 0.4 + 0.08,
            dur: Math.random() * 10 + 6,
            del: Math.random() * 8,
            bright: Math.random() > 0.72,
        }))
    , [])

    const [typedText, setTypedText] = useState('')
    const [typePhase, setTypePhase] = useState('typing')
    const [demoIdx, setDemoIdx] = useState(0)

    useEffect(() => {
        const currentPrompt = DEMO_ITEMS[demoIdx].prompt
        if (typePhase === 'typing') {
            if (typedText.length < currentPrompt.length) {
                const t = setTimeout(() => setTypedText(currentPrompt.slice(0, typedText.length + 1)), 75)
                return () => clearTimeout(t)
            } else {
                const t = setTimeout(() => setTypePhase('deleting'), 2800)
                return () => clearTimeout(t)
            }
        }
        if (typePhase === 'deleting') {
            if (typedText.length > 0) {
                const t = setTimeout(() => setTypedText(p => p.slice(0, -1)), 38)
                return () => clearTimeout(t)
            } else {
                const t = setTimeout(() => { setDemoIdx(p => (p + 1) % DEMO_ITEMS.length); setTypePhase('typing') }, 350)
                return () => clearTimeout(t)
            }
        }
    }, [typedText, typePhase, demoIdx])

    return (
        <div className='relative min-h-screen text-white overflow-hidden' style={{ background: 'linear-gradient(155deg,#07091c 0%,#0c0f22 35%,#090c1c 65%,#060810 100%)' }}>
            {/* ── CSS keyframes ── */}
            <style>{`
                @keyframes gw-orbit1{from{transform:perspective(900px) rotateX(72deg) rotateZ(0deg)}to{transform:perspective(900px) rotateX(72deg) rotateZ(360deg)}}
                @keyframes gw-orbit2{from{transform:perspective(900px) rotateX(68deg) rotateZ(60deg)}to{transform:perspective(900px) rotateX(68deg) rotateZ(420deg)}}
                @keyframes gw-orbit3{from{transform:perspective(900px) rotateX(74deg) rotateZ(200deg)}to{transform:perspective(900px) rotateX(74deg) rotateZ(-160deg)}}
                @keyframes gw-pulse{0%,100%{opacity:.35;transform:translate(-50%,-50%) scale(1)}50%{opacity:.7;transform:translate(-50%,-50%) scale(1.12)}}
                @keyframes gw-pulse2{0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}
                @keyframes gw-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px)}}
                @keyframes gw-twinkle{0%,100%{opacity:var(--gop)}50%{opacity:calc(var(--gop)*2.5)}}
                @keyframes gw-blink{0%,100%{opacity:1}50%{opacity:0}}
            `}</style>

            {/* ── 3-D orbital background ── */}
            <div className='absolute inset-0 pointer-events-none overflow-hidden'>
                {/* outer glow blob */}
                <div style={{position:'absolute',top:'46%',left:'50%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(110,100,255,.75) 0%,rgba(139,92,246,.3) 42%,transparent 70%)',filter:'blur(36px)',animation:'gw-pulse 3.8s ease-in-out infinite'}} />
                {/* inner bright core */}
                <div style={{position:'absolute',top:'46%',left:'50%',width:80,height:80,borderRadius:'50%',background:'radial-gradient(circle,rgba(220,220,255,.98) 0%,rgba(167,139,250,.6) 55%,transparent 80%)',filter:'blur(8px)',animation:'gw-pulse2 2.6s ease-in-out .3s infinite'}} />

                {/* Ring 1 */}
                <div style={{position:'absolute',top:'46%',left:'50%',width:520,height:520,marginLeft:-260,marginTop:-260,borderRadius:'50%',border:'1px solid rgba(120,110,255,.42)',boxShadow:'0 0 10px rgba(120,110,255,.14) inset',animation:'gw-orbit1 22s linear infinite'}} />
                {/* Ring 2 */}
                <div style={{position:'absolute',top:'46%',left:'50%',width:820,height:820,marginLeft:-410,marginTop:-410,borderRadius:'50%',border:'1px solid rgba(139,92,246,.24)',animation:'gw-orbit2 36s linear infinite'}} />
                {/* Ring 3 – reversed */}
                <div style={{position:'absolute',top:'46%',left:'50%',width:1160,height:1160,marginLeft:-580,marginTop:-580,borderRadius:'50%',border:'1px solid rgba(99,102,241,.15)',animation:'gw-orbit3 58s linear infinite'}} />

                {/* orbit-rider dot 1 */}
                <div style={{position:'absolute',top:'calc(46% - 262px)',left:'50%',width:11,height:11,marginLeft:-5,borderRadius:'50%',background:'radial-gradient(circle,#fff 0%,rgba(147,197,253,.9) 60%,transparent 100%)',boxShadow:'0 0 16px 5px rgba(147,197,253,.55)',animation:'gw-orbit1 22s linear infinite',transformOrigin:'5px 262px'}} />
                {/* orbit-rider dot 2 */}
                <div style={{position:'absolute',top:'calc(46% + 240px)',left:'calc(50% + 150px)',width:7,height:7,borderRadius:'50%',background:'rgba(196,181,253,.9)',boxShadow:'0 0 10px rgba(196,181,253,.5)',animation:'gw-float 4.5s ease-in-out infinite'}} />
                {/* orbit-rider dot 3 */}
                <div style={{position:'absolute',top:'calc(46% - 190px)',left:'calc(50% - 210px)',width:6,height:6,borderRadius:'50%',background:'rgba(165,180,252,.8)',boxShadow:'0 0 8px rgba(165,180,252,.45)',animation:'gw-float 5.8s ease-in-out 1.2s infinite'}} />

                {/* star particles */}
                {particles.map(p => (
                    <div key={p.id} style={{position:'absolute',left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,borderRadius:'50%',background:p.bright?'radial-gradient(circle,rgba(210,218,255,.95) 0%,rgba(147,197,253,.45) 70%,transparent 100%)':'rgba(180,185,220,.55)',boxShadow:p.bright?'0 0 5px rgba(147,197,253,.35)':'none','--gop':p.op,opacity:p.op,animation:`gw-twinkle ${p.dur}s ease-in-out ${p.del}s infinite`}} />
                ))}
            </div>

            {/* indigo tint overlay */}
            <div className='absolute inset-0 pointer-events-none' style={{background:'radial-gradient(ellipse 70% 50% at 50% 44%,rgba(99,102,241,.07) 0%,transparent 70%)'}} />
            {/* bottom fade */}
            <div className='absolute bottom-0 left-0 right-0 h-56 pointer-events-none' style={{background:'linear-gradient(to top,rgba(7,9,28,.95) 0%,transparent 100%)'}} />

            {/* ══ NAVBAR ══ */}
            <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className='fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5'
                style={{ background: 'rgba(7,9,28,.78)' }}
            >
                <div className='max-w-7xl mx-auto px-6 py-4 flex justify-between items-center'>
                    <div className='text-lg font-semibold tracking-tight'>
                        GenWeb<span className='text-indigo-400'>.ai</span>
                    </div>

                    <nav className='hidden md:flex items-center gap-8'>
                        <span className='text-sm text-zinc-400 hover:text-white cursor-pointer transition' onClick={() => navigate("/gallery")}>Gallery</span>
                        <span className='text-sm text-zinc-400 hover:text-white cursor-pointer transition' onClick={() => navigate("/pricing")}>Pricing</span>
                    </nav>

                    <div className='flex items-center gap-4'>
                        {userData && (
                            <div className='hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm cursor-pointer hover:bg-white/10 transition' onClick={() => navigate("/pricing")}>
                                <Coins size={13} className='text-yellow-400' />
                                <span className='text-zinc-300'>Credits</span>
                                <span>{userData.credits}</span>
                                <span className='font-semibold'>+</span>
                            </div>
                        )}

                        {!userData ? (
                            <div className='flex items-center gap-3'>
                                <button className='text-sm text-zinc-400 hover:text-white transition' onClick={() => setOpenLogin(true)}>Sign in</button>
                                <button className='px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition' onClick={() => setOpenLogin(true)}>Get Started →</button>
                            </div>
                        ) : (
                            <div className='relative'>
                                <button className='flex items-center' onClick={() => setOpenProfile(!openProfile)}>
                                    <img src={userData?.avatar || `https://ui-avatars.com/api/?name=${userData.name}`} alt="" referrerPolicy='no-referrer' className='w-9 h-9 rounded-full border border-white/20 object-cover' />
                                </button>
                                <AnimatePresence>
                                    {openProfile && (
                                        <>
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                className="absolute right-0 mt-3 w-60 z-50 rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                                                style={{ background: '#080b1c' }}
                                            >
                                                <div className='px-4 py-3 border-b border-white/10'>
                                                    <p className='text-sm font-medium truncate'>{userData.name}</p>
                                                    <p className='text-xs text-zinc-500 truncate'>{userData.email}</p>
                                                </div>
                                                <button className='md:hidden w-full px-4 py-3 flex items-center gap-2 text-sm border-b border-white/10 hover:bg-white/5'>
                                                    <Coins size={14} className='text-yellow-400' />
                                                    <span className='text-zinc-300'>Credits</span>
                                                    <span>{userData.credits}</span>
                                                    <span className='font-semibold'>+</span>
                                                </button>
                                                <button className='w-full px-4 py-3 text-left text-sm hover:bg-white/5' onClick={() => navigate("/dashboard")}>Dashboard</button>
                                                <button className='w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5' onClick={handleLogOut}>Logout</button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ══ HERO ══ */}
            <section className='relative z-10 pt-44 pb-36 px-6 text-center'>

                {/* badge */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className='flex justify-center mb-8'>
                    <span className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-indigo-500/30 text-indigo-300' style={{ background: 'rgba(99,102,241,.08)' }}>
                        <span className='w-1.5 h-1.5 rounded-full bg-indigo-400' style={{ boxShadow: '0 0 6px rgba(129,140,248,.8)' }} />
                        Now with Vision Clone &amp; Brand Kit
                    </span>
                </motion.div>

                {/* title */}
                <motion.div initial={{ opacity: 0, y: 44 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
                    <h1 className='text-5xl md:text-7xl font-bold tracking-tight leading-[1.08]'>
                        <span className='block'>Type a thought.</span>
                        <span className='block mt-2'>
                            <span style={{ background: 'linear-gradient(130deg,#818cf8 0%,#a78bfa 45%,#7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic' }}>Watch</span>
                            {' '}a website
                        </span>
                        <span className='block mt-2 text-zinc-400'>come alive.</span>
                    </h1>
                </motion.div>

                {/* subtitle */}
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
                    className='mt-7 max-w-md mx-auto text-zinc-400 text-base md:text-lg leading-relaxed'>
                    Describe your idea in one sentence. AI builds a fully branded,
                    deployable website — logo, colors, copy and all.
                </motion.p>

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }} className='mt-10'>
                    <button
                        onClick={() => userData ? navigate("/dashboard") : setOpenLogin(true)}
                        className='px-10 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base hover:scale-105 transition'
                        style={{ boxShadow: '0 0 32px rgba(99,102,241,.35)' }}
                    >
                        {userData ? "Go to Dashboard →" : "Get Started →"}
                    </button>
                </motion.div>

                {/* feature pills */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}
                    className='mt-10 flex flex-wrap items-center justify-center gap-2.5'>
                    {['✦ AI Brand Kit', '✦ Vision Clone', '✦ One-click Deploy', '✦ Gallery', '✦ A/B Testing'].map(p => (
                        <span key={p} className='px-4 py-2 rounded-full text-xs font-medium border border-white/10 text-zinc-400 transition hover:border-indigo-500/30 hover:text-zinc-300 cursor-default' style={{ background: 'rgba(255,255,255,.04)' }}>{p}</span>
                    ))}
                </motion.div>
            </section>

            {/* ══ PRODUCT SHOWCASE ══ */}
            <section className='relative z-10 py-24 px-6'>
                <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className='text-center mb-14'>
                    <p className='text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-3'>See it in action</p>
                    <h2 className='text-3xl md:text-4xl font-bold mb-3'>Type a prompt. Get a website.</h2>
                    <p className='text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed'>One sentence is all it takes. Watch AI build a fully branded site — live.</p>
                </motion.div>

                {/* Browser window mockup */}
                <motion.div initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 }}
                    className='max-w-4xl mx-auto rounded-2xl overflow-hidden'
                    style={{ background: '#10131f', border: '1px solid rgba(255,255,255,.09)', boxShadow: '0 48px 96px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.05)' }}>

                    {/* Chrome bar */}
                    <div style={{ background: '#0b0d1a', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 6, padding: '5px 12px' }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>genweb.ai/generate</span>
                        </div>
                    </div>

                    {/* Panels */}
                    <div style={{ display: 'flex', height: 310 }}>

                        {/* Left — prompt panel */}
                        <div style={{ width: 270, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,.07)', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,.28)', textTransform: 'uppercase' }}>Your Prompt</p>

                            {/* Typed text box */}
                            <div style={{ border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'rgba(255,255,255,.82)', background: 'rgba(255,255,255,.04)', minHeight: 48, lineHeight: 1.55 }}>
                                {typedText}
                                <span style={{ display: 'inline-block', width: 2, height: 13, background: '#818cf8', marginLeft: 1, verticalAlign: 'text-bottom', animation: 'gw-blink 1s step-end infinite' }} />
                            </div>

                            {/* Generating button */}
                            <div style={{ padding: '9px 14px', background: 'linear-gradient(135deg,#4f46e5,#6d28d9)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.75)', display: 'inline-block', animation: 'gw-blink 1.3s ease-in-out infinite' }} />
                                Generating brand kit...
                            </div>

                            {/* Progress steps */}
                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[['Prompt','done'],['Brand Kit','done'],['Website','active'],['Deploy','pending']].map(([label, state]) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: state === 'pending' ? 'rgba(255,255,255,.2)' : state === 'active' ? 'rgba(129,140,248,.95)' : 'rgba(129,140,248,.6)' }}>
                                        <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: state === 'pending' ? 'rgba(255,255,255,.15)' : state === 'active' ? '#818cf8' : '#4f46e5', boxShadow: state === 'active' ? '0 0 6px #818cf8' : 'none' }} />
                                        {label}
                                        {state === 'done' && <span style={{ marginLeft: 'auto', color: 'rgba(129,140,248,.5)', fontSize: 10 }}>✓</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — live preview */}
                        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                            <AnimatePresence mode='wait'>
                                <motion.div key={demoIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
                                    style={{ position: 'absolute', inset: 0, background: DEMO_ITEMS[demoIdx].bg, display: 'flex', flexDirection: 'column', color: DEMO_ITEMS[demoIdx].text }}>
                                    {/* mini navbar */}
                                    <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: DEMO_ITEMS[demoIdx].headerBg }}>
                                        <span style={{ fontWeight: 700, fontSize: 13 }}>{DEMO_ITEMS[demoIdx].nav}</span>
                                        <div style={{ display: 'flex', gap: 18, fontSize: 11, opacity: 0.5 }}>
                                            {DEMO_ITEMS[demoIdx].navLinks.map(l => <span key={l}>{l}</span>)}
                                        </div>
                                    </div>
                                    {/* hero content */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 40px', background: DEMO_ITEMS[demoIdx].heroBg }}>
                                        <div>
                                            <h3 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15, margin: '0 0 10px', fontFamily: 'Georgia,serif' }}>
                                                {DEMO_ITEMS[demoIdx].heading1}<br />{DEMO_ITEMS[demoIdx].heading2}
                                            </h3>
                                            <p style={{ fontSize: 12, opacity: 0.52, marginBottom: 20 }}>{DEMO_ITEMS[demoIdx].sub}</p>
                                            <button style={{ padding: '8px 22px', background: DEMO_ITEMS[demoIdx].accent, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'default' }}>{DEMO_ITEMS[demoIdx].btn}</button>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* demo indicator dots */}
                <div className='flex justify-center gap-2 mt-6'>
                    {DEMO_ITEMS.map((_, i) => (
                        <button key={i} onClick={() => { setDemoIdx(i); setTypedText(''); setTypePhase('typing') }}
                            style={{ width: i === demoIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === demoIdx ? '#6366f1' : 'rgba(255,255,255,.18)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}
                        />
                    ))}
                </div>
            </section>

            {/* ══ FEATURE CARDS (logged-out) ══ */}
            {!userData && (
                <section className='relative z-10 max-w-7xl mx-auto px-6 pb-36'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        {highlights.map((h, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                className='rounded-2xl p-8 border border-white/8 hover:border-indigo-500/25 transition'
                                style={{ background: 'rgba(255,255,255,.03)' }}>
                                <h2 className='text-xl font-semibold mb-3'>{h}</h2>
                                <p className='text-sm text-zinc-400 leading-relaxed'>GenWeb.ai builds real websites — clean code, animations, responsiveness and scalable structure.</p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* ══ YOUR WEBSITES (logged-in) ══ */}
            {userData && websites?.length > 0 && (
                <section className='relative z-10 max-w-7xl mx-auto px-6 pb-36'>
                    <h3 className='text-2xl font-semibold mb-6'>Your Websites</h3>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        {websites.slice(0, 3).map((w) => (
                            <motion.div key={w._id} whileHover={{ y: -6 }} onClick={() => navigate(`/editor/${w._id}`)}
                                className='cursor-pointer rounded-2xl border border-white/10 overflow-hidden hover:border-indigo-500/30 transition'
                                style={{ background: 'rgba(255,255,255,.04)' }}>
                                <div className='h-40 bg-black'>
                                    <iframe srcDoc={w.latestCode} className='w-[140%] h-[140%] scale-[0.72] origin-top-left pointer-events-none bg-white' />
                                </div>
                                <div className='p-4'>
                                    <h3 className='text-base font-semibold line-clamp-2'>{w.title}</h3>
                                    <p className='text-xs text-zinc-400'>Last Updated {new Date(w.updatedAt).toLocaleDateString()}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            <footer className='relative z-10 border-t border-white/5 py-10 text-center text-sm text-zinc-600'>
                &copy; {new Date().getFullYear()} GenWeb.ai
            </footer>

            {openLogin && <LoginModal open={openLogin} onClose={() => setOpenLogin(false)} />}
        </div>
    )
}

export default Home
