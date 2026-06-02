import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from "motion/react"
import LoginModal from '../components/LoginModal'
import { useDispatch, useSelector } from 'react-redux'
import { Coins, Zap, Globe, Layers, Sparkles, ArrowRight, Play } from "lucide-react"
import { serverUrl } from '../App'
import axios from 'axios'
import { setUserData } from '../redux/userSlice'
import { useNavigate } from 'react-router-dom'

/* ─── Demo prompts for the showcase ─────────────────────────────────────── */
const DEMO_ITEMS = [
  {
    prompt: 'Cozy ramen shop in the heart of London',
    nav: 'Tanuki Ramen', navLinks: ['Menu', 'About', 'Find Us'],
    heading1: 'Soul poured into', heading2: 'every bowl.',
    sub: 'Traditional 18-hour broths · Shoreditch, London', btn: 'View Menu',
    bg: '#130b03', text: '#f5e6d3', accent: '#d4622a',
    headerBg: 'rgba(255,255,255,.04)',
    heroBg: 'radial-gradient(circle at 50% 60%,rgba(180,80,20,.18) 0%,transparent 65%)',
  },
  {
    prompt: 'Premium skincare brand for busy NYC professionals',
    nav: 'Lumière', navLinks: ['Products', 'Ritual', 'Stores'],
    heading1: 'Skin that speaks', heading2: 'without words.',
    sub: 'Clean, science-backed skincare · New York', btn: 'Shop Now',
    bg: '#0d0d11', text: '#f0ece8', accent: '#c9a96e',
    headerBg: 'rgba(255,255,255,.04)',
    heroBg: 'radial-gradient(circle at 50% 60%,rgba(180,150,80,.12) 0%,transparent 65%)',
  },
  {
    prompt: 'Sustainable surf gear company in Bali',
    nav: 'Ombak Co.', navLinks: ['Gear', 'Story', 'Stockists'],
    heading1: 'Ride clean.', heading2: 'Leave nothing.',
    sub: 'Eco-certified surf gear · Canggu, Bali', btn: 'Shop Gear',
    bg: '#050f18', text: '#e0f4ff', accent: '#22c3e8',
    headerBg: 'rgba(255,255,255,.04)',
    heroBg: 'radial-gradient(circle at 50% 60%,rgba(20,140,180,.2) 0%,transparent 65%)',
  },
]

/* ─── Feature cards data ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Zap size={20} />,
    title: 'AI Generated Code',
    desc: 'Production-ready HTML, CSS and JS with animations, responsiveness, and clean structure — all from a single prompt.',
    color: '#818cf8',
  },
  {
    icon: <Globe size={20} />,
    title: 'Fully Responsive',
    desc: 'Every site adapts beautifully across desktop, tablet and mobile the moment it\'s built.',
    color: '#a78bfa',
  },
  {
    icon: <Layers size={20} />,
    title: 'Production Ready',
    desc: 'One-click deploy with a live URL. Share your site instantly — no setup required.',
    color: '#7c3aed',
  },
]

/* ─────────────────────────────────────────────────────────────────────────── */

function Home() {
  /* ── state ── */
  const [openLogin, setOpenLogin]     = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [websites, setWebsites]       = useState(null)
  const [heroVisible, setHeroVisible] = useState(false)   // reveals after video ends once
  const [videoPlayed, setVideoPlayed] = useState(false)   // tracks first completion
  const [typedText, setTypedText]     = useState('')
  const [typePhase, setTypePhase]     = useState('typing')
  const [demoIdx, setDemoIdx]         = useState(0)

  /* ── refs ── */
  const videoRef = useRef(null)

  /* ── store ── */
  const { userData } = useSelector(state => state.user)
  const dispatch     = useDispatch()
  const navigate     = useNavigate()

  /* ── logout ── */
  const handleLogOut = async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true })
      dispatch(setUserData(null))
      setOpenProfile(false)
    } catch (err) {
      console.log(err)
    }
  }

  /* ── fetch websites ── */
  useEffect(() => {
    if (!userData) return
    const fetch = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/website/get-all`, { withCredentials: true })
        setWebsites(result.data || [])
      } catch (err) { console.log(err) }
    }
    fetch()
  }, [userData])

  /* ── video: reveal hero on first "ended" event, then loop seamlessly ── */
  const handleVideoEnded = useCallback(() => {
    if (!videoPlayed) {
      setVideoPlayed(true)
      setHeroVisible(true)
    }
    // Always loop the video seamlessly
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
    }
  }, [videoPlayed])

  /* ── fallback: if autoplay is blocked, reveal hero after 1.5s ── */
  useEffect(() => {
    if (!videoRef.current) return
    const vid = videoRef.current
    const tryPlay = vid.play()
    if (tryPlay !== undefined) {
      tryPlay.catch(() => {
        // autoplay blocked — show hero immediately
        setHeroVisible(true)
        setVideoPlayed(true)
      })
    }
    // safety net: if video hasn't ended within 30s, reveal hero anyway
    const safetyTimer = setTimeout(() => {
      setHeroVisible(true)
      setVideoPlayed(true)
    }, 30000)
    return () => clearTimeout(safetyTimer)
  }, [])

  /* ── typewriter for showcase ── */
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

  /* ───────────────────────────── RENDER ─────────────────────────────────── */
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#000', color: '#fff', overflowX: 'hidden' }}>

      {/* ── Google Font + keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes scanline{ 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes scanProgress{ 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }
        @keyframes watchGlow{ 0%,100%{filter:drop-shadow(0 0 12px rgba(140,82,255,.6))} 50%{filter:drop-shadow(0 0 28px rgba(255,77,228,.9))} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse{ 0%,100%{box-shadow:0 0 30px rgba(139,92,246,.35)} 50%{box-shadow:0 0 60px rgba(139,92,246,.65)} }
        @keyframes particleDrift {
          0%   { transform: translateY(0px) translateX(0px) scale(1); opacity: var(--op); }
          33%  { transform: translateY(-18px) translateX(8px) scale(1.1); }
          66%  { transform: translateY(-8px) translateX(-6px) scale(0.9); }
          100% { transform: translateY(0px) translateX(0px) scale(1); opacity: var(--op); }
        }

        /* word-reveal animation classes */
        .word { display:inline-block; overflow:hidden; }
        .word span {
          display:inline-block;
          opacity:0;
          transform:translateY(110%);
          animation: slideUp 0.7s cubic-bezier(.22,1,.36,1) forwards;
        }
        @keyframes slideUp { to { opacity:1; transform:translateY(0); } }

        /* Gradient text shimmer */
        .gradient-text {
          background: linear-gradient(135deg, #2ae0ff 0%, #8c52ff 50%, #ff4de4 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .hero-cta-btn {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s;
        }
        .hero-cta-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #7c3aed, #6d28d9, #4f46e5);
          opacity: 0;
          transition: opacity .3s;
        }
        .hero-cta-btn:hover::before { opacity: 1; }
        .hero-cta-btn:hover { transform: scale(1.05); box-shadow: 0 0 50px rgba(124,58,237,.55); }

        .feature-card {
          transition: transform .3s, border-color .3s, box-shadow .3s;
        }
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 32px 64px rgba(0,0,0,.55), 0 0 0 1px rgba(139,92,246,.2);
        }

        .nav-link {
          position: relative;
          color: rgba(255,255,255,.55);
          font-size: 14px;
          cursor: pointer;
          transition: color .2s;
          text-decoration: none;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0; right: 0;
          height: 1px;
          background: #8b5cf6;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .25s;
        }
        .nav-link:hover { color: #fff; }
        .nav-link:hover::after { transform: scaleX(1); }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050508; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,.4); border-radius: 3px; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — full-screen video backdrop
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Background video */}
        <video
          ref={videoRef}
          src="/hero_bg.mp4"
          autoPlay
          muted
          playsInline
          loop={false}
          onEnded={handleVideoEnded}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        />

        {/* Dark vignette — only edges darken, centre stays clear so 3D figure shines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.55) 100%)',
          zIndex: 1,
        }} />



        {/* Bottom gradient fade into page */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '280px',
          background: 'linear-gradient(to top, #000 0%, transparent 100%)',
          zIndex: 2,
        }} />

        {/* Scan-line shimmer effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,.15) 50%, transparent 100%)',
            animation: 'scanline 8s linear infinite',
            opacity: 0.4,
          }} />
        </div>

        {/* ── NAVBAR ────────────────────────────────────────────────── */}
        <header style={{
          position: 'relative',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          height: '72px',
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Logo */}
          <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            GenWeb<span style={{ color: '#8b5cf6' }}>.ai</span>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
            <span className="nav-link" onClick={() => navigate('/gallery')}>Gallery</span>
            <span className="nav-link" onClick={() => navigate('/pricing')}>Pricing</span>
            <span className="nav-link" onClick={() => navigate('/clone')}>Clone</span>
          </nav>

          {/* Auth buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {userData && (
              <div
                onClick={() => navigate('/pricing')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', fontSize: '13px', cursor: 'pointer' }}
              >
                <Coins size={13} style={{ color: '#facc15' }} />
                <span style={{ color: 'rgba(255,255,255,.6)' }}>Credits</span>
                <span style={{ fontWeight: 600 }}>{userData.credits}</span>
              </div>
            )}

            {!userData ? (
              <>
                <button className="nav-link" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', fontSize: '14px', cursor: 'pointer' }} onClick={() => setOpenLogin(true)}>
                  Sign in
                </button>
                <button
                  onClick={() => setOpenLogin(true)}
                  style={{ padding: '8px 22px', borderRadius: '10px', border: '1px solid rgba(139,92,246,.5)', background: 'rgba(139,92,246,.15)', color: '#c4b5fd', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all .2s', backdropFilter: 'blur(8px)' }}
                  onMouseEnter={e => { e.target.style.background = 'rgba(139,92,246,.35)'; e.target.style.color = '#fff' }}
                  onMouseLeave={e => { e.target.style.background = 'rgba(139,92,246,.15)'; e.target.style.color = '#c4b5fd' }}
                >
                  Get Started →
                </button>
              </>
            ) : (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setOpenProfile(!openProfile)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <img
                    src={userData?.avatar || `https://ui-avatars.com/api/?name=${userData.name}&background=7c3aed&color=fff`}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(139,92,246,.5)', objectFit: 'cover' }}
                  />
                </button>
                <AnimatePresence>
                  {openProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      style={{ position: 'absolute', right: 0, top: '48px', width: '240px', zIndex: 60, borderRadius: '14px', border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden', background: 'rgba(8,8,20,.92)', backdropFilter: 'blur(24px)', boxShadow: '0 24px 48px rgba(0,0,0,.6)' }}
                    >
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>{userData.name}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{userData.email}</p>
                      </div>
                      <button onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', fontSize: '14px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,.05)'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                      >Dashboard</button>
                      <button onClick={handleLogOut} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', fontSize: '14px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,.05)'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                      >Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>

        {/* ── HERO CONTENT — revealed only after video first completes ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>

          {/* Cinematic scanning loader — shown while video plays first time */}
          {!heroVisible && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingBottom: '40px' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,.22)', fontWeight: 600 }}>Loading experience</span>
              {/* Animated scan bar */}
              <div style={{ width: '160px', height: '1px', background: 'rgba(255,255,255,.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: '40%',
                  background: 'linear-gradient(90deg, transparent, #8b5cf6, #c4b5fd, #8b5cf6, transparent)',
                  borderRadius: '999px',
                  animation: 'scanProgress 1.8s ease-in-out infinite',
                }} />
              </div>
            </div>
          )}

          {/* Hero text — staggered reveal */}
          {heroVisible && (
            <div style={{
              textAlign: 'center',
              maxWidth: '900px',
              padding: '0 32px',
            }}>

              {/* Badge */}

              {/* Main headline */}
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize: 'clamp(52px, 8vw, 96px)',
                  fontWeight: 900,
                  lineHeight: 1.04,
                  letterSpacing: '-3px',
                  marginBottom: '22px',
                  /* Deep layered shadow — makes text readable over any video frame */
                  textShadow: [
                    '0 0 80px rgba(0,0,0,1)',
                    '0 0 40px rgba(0,0,0,1)',
                    '0 4px 24px rgba(0,0,0,0.95)',
                    '0 2px 6px rgba(0,0,0,0.9)',
                    '2px 2px 0px rgba(0,0,0,0.6)',
                  ].join(', '),
                }}
              >
                <span style={{ display: 'block', color: '#ffffff' }}>Type a thought.</span>
                <span style={{ display: 'block', marginTop: '6px' }}>
                  <span className="gradient-text" style={{ fontStyle: 'italic', fontWeight: 900, textShadow: '0 0 40px rgba(140,82,255,0.7), 0 0 80px rgba(255,77,228,0.35)' }}>Watch</span>
                  <span style={{ color: '#ffffff' }}> a website</span>
                </span>
                <span style={{ display: 'block', color: '#ffffff', marginTop: '6px', opacity: 0.7 }}>come alive.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize: '18px',
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 1.7,
                  maxWidth: '500px',
                  margin: '0 auto 40px',
                  fontWeight: 400,
                  textShadow: '0 0 40px rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9)',
                }}
              >
                Describe your idea in one sentence. AI builds a fully branded,
                deployable website — logo, colors, copy and all.
              </motion.p>

              {/* CTA row */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.48 }}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
              >
                {/* Primary CTA */}
                <button
                  className="hero-cta-btn"
                  onClick={() => userData ? navigate('/dashboard') : setOpenLogin(true)}
                  style={{
                    padding: '16px 36px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6d28d9, #7c3aed, #8b5cf6)',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '-0.2px',
                    boxShadow: '0 0 40px rgba(139,92,246,.4), 0 8px 32px rgba(0,0,0,.4)',
                    animation: 'glowPulse 3s ease-in-out infinite',
                  }}
                >
                  {userData ? 'Go to Dashboard →' : 'Start Building — Free →'}
                </button>

                {/* Secondary CTA */}
                <button
                  onClick={() => navigate('/gallery')}
                  style={{
                    padding: '15px 28px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,.12)',
                    background: 'rgba(255,255,255,.05)',
                    color: 'rgba(255,255,255,.7)',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = 'rgba(255,255,255,.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)' }}
                >
                  View Gallery ↗
                </button>
              </motion.div>

              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '36px' }}
              >
                {['✦ AI Brand Kit', '✦ Vision Clone', '✦ One-click Deploy', '✦ Live Gallery', '✦ A/B Testing'].map(p => (
                  <span
                    key={p}
                    style={{
                      padding: '7px 18px',
                      borderRadius: '999px',
                      border: '1px solid rgba(139,92,246,.25)',
                      background: 'rgba(139,92,246,.08)',
                      fontSize: '12px',
                      color: 'rgba(196,181,253,.85)',
                      fontWeight: 600,
                      backdropFilter: 'blur(8px)',
                      letterSpacing: '0.02em',
                      textShadow: '0 1px 6px rgba(0,0,0,.6)',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </motion.div>
            </div>
          )}
        </div>

        {/* Scroll-down hint */}
        {heroVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>Scroll</span>
            <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, rgba(255,255,255,.3), transparent)', animation: 'float 2s ease-in-out infinite' }} />
          </motion.div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRODUCT SHOWCASE SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', padding: '80px 24px 100px', background: 'linear-gradient(180deg, #000 0%, #06040d 40%, #0a0612 100%)' }}>

        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(139,92,246,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,.04) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '60px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '12px' }}>See it in action</p>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1px', color: '#fff', marginBottom: '12px' }}>Type a prompt. Get a website.</h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.4)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.65 }}>One sentence is all it takes — watch AI build a fully branded site, live.</p>
        </motion.div>

        {/* Glow orb behind mockup */}
        <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '200px', background: 'radial-gradient(ellipse, rgba(109,40,217,.18) 0%, transparent 70%)', filter: 'blur(48px)', pointerEvents: 'none' }} />

        {/* Browser window mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(139,92,246,.15)',
            boxShadow: '0 60px 120px rgba(0,0,0,.85), 0 0 0 1px rgba(139,92,246,.12), 0 0 100px rgba(109,40,217,.1)',
          }}
        >
          {/* Chrome bar */}
          <div style={{ background: '#0a0a14', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: '6px', padding: '5px 12px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.25)' }}>genweb.ai/generate</span>
            </div>
          </div>

          {/* Panels */}
          <div style={{ display: 'flex', height: '320px' }}>
            {/* Left — prompt panel */}
            <div style={{ width: '270px', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,.06)', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#08080f' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,.25)', textTransform: 'uppercase' }}>Your Prompt</p>

              <div style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'rgba(255,255,255,.8)', background: 'rgba(255,255,255,.03)', minHeight: '48px', lineHeight: 1.55 }}>
                {typedText}
                <span style={{ display: 'inline-block', width: 2, height: 13, background: '#8b5cf6', marginLeft: 1, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
              </div>

              <div style={{ padding: '9px 14px', background: 'linear-gradient(135deg,#4f46e5,#6d28d9)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.75)', display: 'inline-block', animation: 'blink 1.3s ease-in-out infinite' }} />
                Generating brand kit...
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[['Prompt', 'done'], ['Brand Kit', 'done'], ['Website', 'active'], ['Deploy', 'pending']].map(([label, state]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: state === 'pending' ? 'rgba(255,255,255,.2)' : state === 'active' ? 'rgba(139,92,246,.95)' : 'rgba(139,92,246,.55)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: state === 'pending' ? 'rgba(255,255,255,.15)' : state === 'active' ? '#8b5cf6' : '#4f46e5', boxShadow: state === 'active' ? '0 0 8px #8b5cf6' : 'none' }} />
                    {label}
                    {state === 'done' && <span style={{ marginLeft: 'auto', color: 'rgba(139,92,246,.5)', fontSize: '10px' }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — live preview */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <AnimatePresence mode="wait">
                <motion.div key={demoIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
                  style={{ position: 'absolute', inset: 0, background: DEMO_ITEMS[demoIdx].bg, display: 'flex', flexDirection: 'column', color: DEMO_ITEMS[demoIdx].text }}
                >
                  <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: DEMO_ITEMS[demoIdx].headerBg }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{DEMO_ITEMS[demoIdx].nav}</span>
                    <div style={{ display: 'flex', gap: '18px', fontSize: '11px', opacity: 0.5 }}>
                      {DEMO_ITEMS[demoIdx].navLinks.map(l => <span key={l}>{l}</span>)}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 40px', background: DEMO_ITEMS[demoIdx].heroBg }}>
                    <div>
                      <h3 style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.15, margin: '0 0 10px', fontFamily: 'Georgia,serif' }}>
                        {DEMO_ITEMS[demoIdx].heading1}<br />{DEMO_ITEMS[demoIdx].heading2}
                      </h3>
                      <p style={{ fontSize: '12px', opacity: 0.52, marginBottom: '20px' }}>{DEMO_ITEMS[demoIdx].sub}</p>
                      <button style={{ padding: '8px 22px', background: DEMO_ITEMS[demoIdx].accent, border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'default' }}>{DEMO_ITEMS[demoIdx].btn}</button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {DEMO_ITEMS.map((_, i) => (
            <button key={i}
              onClick={() => { setDemoIdx(i); setTypedText(''); setTypePhase('typing') }}
              style={{ width: i === demoIdx ? 22 : 6, height: 6, borderRadius: 3, background: i === demoIdx ? '#7c3aed' : 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', transition: 'all .3s' }}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '90px 24px 130px', background: 'linear-gradient(180deg, #0a0612 0%, #08040f 50%, #070310 100%)', position: 'relative', overflow: 'hidden' }}>

        {/* Ambient glow blobs */}
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: '400px', height: '300px', background: 'radial-gradient(ellipse, rgba(109,40,217,.09) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '350px', height: '250px', background: 'radial-gradient(ellipse, rgba(76,29,149,.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(50px)' }} />

        {/* Subtle dot grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(139,92,246,.06) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '56px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9f7aea', marginBottom: '14px' }}>Why GenWeb.ai</p>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#fff' }}>Built for speed.<br/>Designed for scale.</h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1040px', margin: '0 auto', position: 'relative' }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="feature-card"
              style={{
                padding: '36px 32px',
                borderRadius: '24px',
                border: '1px solid rgba(139,92,246,.12)',
                background: 'linear-gradient(135deg, rgba(139,92,246,.06) 0%, rgba(255,255,255,.02) 100%)',
                backdropFilter: 'blur(16px)',
                cursor: 'default',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(139,92,246,.2), rgba(109,40,217,.1))', border: '1px solid rgba(139,92,246,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px', color: f.color, boxShadow: '0 4px 16px rgba(109,40,217,.2)' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#fff', marginBottom: '10px', letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.75 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          YOUR WEBSITES (logged-in)
      ══════════════════════════════════════════════════════════════════ */}
      {userData && websites?.length > 0 && (
        <section style={{ padding: '0 24px 120px', background: '#0a0612' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '28px' }}>Your Websites</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {websites.slice(0, 3).map((w) => (
                <motion.div key={w._id} whileHover={{ y: -6 }} onClick={() => navigate(`/editor/${w._id}`)}
                  style={{ cursor: 'pointer', borderRadius: '16px', border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden', background: 'rgba(255,255,255,.03)', transition: 'border-color .2s' }}
                >
                  <div style={{ height: '160px', background: '#000', overflow: 'hidden' }}>
                    <iframe srcDoc={w.latestCode} style={{ width: '140%', height: '140%', transform: 'scale(0.72)', transformOrigin: 'top left', pointerEvents: 'none', background: '#fff' }} />
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{w.title}</h4>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.35)' }}>Updated {new Date(w.updatedAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #0a0612 0%, #000 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(109,40,217,.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, letterSpacing: '-2px', color: '#fff', marginBottom: '20px' }}>
            Your next website starts<br />
            <span className="gradient-text">with one sentence.</span>
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255,255,255,.4)', marginBottom: '44px', maxWidth: '420px', margin: '0 auto 44px', lineHeight: 1.65 }}>
            No design skills. No coding. Just describe what you want and ship it.
          </p>
          <button
            className="hero-cta-btn"
            onClick={() => userData ? navigate('/dashboard') : setOpenLogin(true)}
            style={{ padding: '18px 48px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', color: '#fff', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.2px', boxShadow: '0 0 60px rgba(139,92,246,.4)' }}
          >
            {userData ? 'Go to Dashboard →' : 'Get Started Free →'}
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 24px', borderTop: '1px solid rgba(255,255,255,.04)', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,.2)', background: '#000' }}>
        © {new Date().getFullYear()} GenWeb.ai — All rights reserved
      </footer>

      {openLogin && <LoginModal open={openLogin} onClose={() => setOpenLogin(false)} />}
    </div>
  )
}

export default Home
