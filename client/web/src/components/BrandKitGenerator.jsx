import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    CheckCircle2, Loader2, Download, Copy, ExternalLink,
    Palette, Sparkles, RefreshCw, Pencil, Type, Star
} from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'

const PLACEHOLDERS = [
    'A premium skincare brand for busy professionals in NYC',
    'A cozy Japanese ramen shop in London',
    'A no-nonsense legal tech startup for small businesses',
    'A sustainable surf gear company in Bali',
]

const GEN_STEPS = [
    { label: 'Extracting brand DNA…' },
    { label: 'Generating color palette…' },
    { label: 'Designing your logo…' },
    { label: 'Building your website…' },
]

const BADGES = ['Logo', 'Colors', 'Fonts', 'Tagline', 'Full Website']

function ColorSwatch({ color, label }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-full border border-white/20 shadow-lg" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-zinc-400 font-mono">{color}</span>
            <span className="text-[10px] text-zinc-600">{label}</span>
        </div>
    )
}

function BrandKitGenerator() {
    const navigate = useNavigate()
    const [phase, setPhase] = useState('input')
    const [prompt, setPrompt] = useState('')
    const [genStep, setGenStep] = useState(0)
    const [brandKit, setBrandKit] = useState(null)
    const [logoSvg, setLogoSvg] = useState('')
    const [htmlContent, setHtmlContent] = useState('')
    const [adjustedHtml, setAdjustedHtml] = useState('')
    const [websiteId, setWebsiteId] = useState(null)
    const [error, setError] = useState('')
    const [showColorModal, setShowColorModal] = useState(false)
    const [colorOverrides, setColorOverrides] = useState({})
    const [placeholderIdx, setPlaceholderIdx] = useState(0)
    const [copied, setCopied] = useState(false)
    const [regenLoading, setRegenLoading] = useState(false)
    const timersRef = useRef([])

    // Cycling placeholder
    useEffect(() => {
        const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3000)
        return () => clearInterval(id)
    }, [])

    // Compute adjustedHtml whenever htmlContent or colorOverrides changes
    useEffect(() => {
        if (!htmlContent || !brandKit) { setAdjustedHtml(htmlContent); return }
        let html = htmlContent
        const colorKeys = ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor']
        colorKeys.forEach(key => {
            const original = brandKit[key]
            const override = colorOverrides[key]
            if (original && override && original !== override) {
                html = html.split(original).join(override)
                html = html.split(original.toUpperCase()).join(override)
                html = html.split(original.toLowerCase()).join(override)
            }
        })
        setAdjustedHtml(html)
    }, [colorOverrides, htmlContent, brandKit])

    const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

    const handleGenerate = async () => {
        const trimmed = prompt.trim()
        if (trimmed.length < 10) { setError('Please describe your business in at least 10 characters'); return }
        if (trimmed.length > 500) { setError('Description must be under 500 characters'); return }
        setError('')
        setPhase('generating')
        setGenStep(1)

        timersRef.current = [
            setTimeout(() => setGenStep(s => Math.max(s, 2)), 4000),
            setTimeout(() => setGenStep(s => Math.max(s, 3)), 8000),
            setTimeout(() => setGenStep(s => Math.max(s, 4)), 12000),
        ]

        try {
            const res = await axios.post(`${serverUrl}/api/brand/generate`, { prompt: trimmed }, { withCredentials: true })
            clearTimers()
            setGenStep(4)
            await new Promise(r => setTimeout(r, 400))
            setBrandKit(res.data.brandKit)
            setLogoSvg(res.data.logoSvg)
            setHtmlContent(res.data.htmlContent)
            setWebsiteId(String(res.data.websiteId))
            setColorOverrides({})
            setPhase('results')
        } catch (err) {
            clearTimers()
            setError(err.response?.data?.message || 'Generation failed. Please try again.')
            setPhase('input')
        }
    }

    const downloadLogo = () => {
        const blob = new Blob([logoSvg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${(brandKit?.businessName || 'logo').toLowerCase().replace(/\s+/g, '-')}.svg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const copyBrandColors = async () => {
        const css = `:root {\n  --brand-primary: ${brandKit.primaryColor};\n  --brand-secondary: ${brandKit.secondaryColor};\n  --brand-accent: ${brandKit.accentColor};\n  --brand-background: ${brandKit.backgroundColor};\n  --brand-text: ${brandKit.textColor};\n  --brand-heading-font: '${brandKit.headingFont}';\n  --brand-body-font: '${brandKit.bodyFont}';\n}`
        await navigator.clipboard.writeText(css)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRegenLogo = async () => {
        if (!websiteId) return
        setRegenLoading(true)
        try {
            const res = await axios.post(`${serverUrl}/api/brand/${websiteId}/regenerate-logo`, {}, { withCredentials: true })
            setLogoSvg(res.data.logoSvg)
        } catch (err) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: err.response?.data?.message || 'Logo regeneration failed', retryAfter: 5 } }))
        }
        setRegenLoading(false)
    }

    const activeColor = (key) => colorOverrides[key] || brandKit?.[key] || '#000000'

    // ----------- INPUT PHASE -----------
    if (phase === 'input') return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">One prompt. A complete brand.</h2>
                <p className="text-sm text-zinc-400">Describe your business and AI will generate everything — colors, fonts, logo, tagline, and a fully branded website.</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
                {BADGES.map(b => (
                    <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 border border-purple-500/25 text-purple-300">
                        <Sparkles size={10} /> {b}
                    </span>
                ))}
            </div>

            <div className="relative mb-6">
                <textarea
                    value={prompt}
                    onChange={e => { setPrompt(e.target.value); setError('') }}
                    placeholder={PLACEHOLDERS[placeholderIdx]}
                    rows={4}
                    className="w-full px-6 py-5 rounded-2xl bg-black/60 border border-white/10 outline-none resize-none text-sm leading-relaxed focus:ring-2 focus:ring-purple-500/40 placeholder:text-zinc-600 transition"
                />
                <span className="absolute bottom-4 right-5 text-[11px] text-zinc-600">{prompt.length}/500</span>
            </div>

            {error && <p className="text-sm text-red-400 mb-4 text-center">{error}</p>}

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <Sparkles size={18} /> Generate Brand Kit — 5 credits
            </motion.button>
            <p className="text-center text-xs text-zinc-600 mt-3">Takes ~20 seconds · generating 2 AI outputs in sequence</p>
        </motion.div>
    )

    // ----------- GENERATING PHASE -----------
    if (phase === 'generating') return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto py-8">
            <div className="text-center mb-10">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-14 h-14 rounded-full border-2 border-purple-500 border-t-transparent mx-auto mb-4"
                />
                <h2 className="text-xl font-bold">Generating your brand…</h2>
                <p className="text-sm text-zinc-400 mt-1">This takes about 20 seconds</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                {GEN_STEPS.map((step, idx) => {
                    const stepNum = idx + 1
                    const done = genStep > stepNum
                    const active = genStep === stepNum
                    const pending = genStep < stepNum
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: pending ? 0.3 : 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-4"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                done ? 'bg-emerald-500/20 border border-emerald-500/40'
                                : active ? 'bg-purple-500/20 border border-purple-500/40'
                                : 'bg-white/5 border border-white/10'
                            }`}>
                                {done ? <CheckCircle2 size={15} className="text-emerald-400" />
                                : active ? <Loader2 size={15} className="text-purple-400 animate-spin" />
                                : <span className="text-xs text-zinc-600">{stepNum}</span>}
                            </div>
                            <span className={`text-sm font-medium transition-all ${
                                done ? 'text-emerald-400 line-through decoration-emerald-500/50'
                                : active ? 'text-white'
                                : 'text-zinc-600'
                            }`}>{step.label}</span>
                        </motion.div>
                    )
                })}
            </div>
        </motion.div>
    )

    // ----------- RESULTS PHASE -----------
    if (phase === 'results' && brandKit) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* LEFT: Brand Kit Card */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6"
                >
                    {/* Business name + tagline */}
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: brandKit.primaryColor }}>
                            {brandKit.businessName}
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1 italic">"{brandKit.tagline}"</p>
                    </div>

                    {/* Logo */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-1">
                            <div dangerouslySetInnerHTML={{ __html: logoSvg }} style={{ width: 56, height: 56 }} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-zinc-400 mb-1">Brand Logo</p>
                            <div className="flex gap-2">
                                <button onClick={downloadLogo}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/10 transition">
                                    <Download size={11} /> SVG
                                </button>
                                <button onClick={copyBrandColors}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                        copied ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/10 hover:bg-white/15 border-white/10'
                                    }`}>
                                    <Copy size={11} /> {copied ? 'Copied!' : 'CSS Vars'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Color palette */}
                    <div>
                        <p className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-1.5"><Palette size={12} /> Color Palette</p>
                        <div className="flex gap-3 flex-wrap">
                            <ColorSwatch color={activeColor('primaryColor')} label="Primary" />
                            <ColorSwatch color={activeColor('secondaryColor')} label="Secondary" />
                            <ColorSwatch color={activeColor('accentColor')} label="Accent" />
                            <ColorSwatch color={activeColor('backgroundColor')} label="Background" />
                            <ColorSwatch color={activeColor('textColor')} label="Text" />
                        </div>
                    </div>

                    {/* Font specimen */}
                    <div>
                        <p className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-1.5"><Type size={12} /> Typography</p>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5">
                                <p className="text-[10px] text-zinc-600 mb-1">Heading — {brandKit.headingFont}</p>
                                <p className="text-3xl font-bold leading-none" style={{ fontFamily: `'${brandKit.headingFont}', serif`, color: brandKit.primaryColor }}>Aa</p>
                            </div>
                            <div className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5">
                                <p className="text-[10px] text-zinc-600 mb-1">Body — {brandKit.bodyFont}</p>
                                <p className="text-3xl leading-none" style={{ fontFamily: `'${brandKit.bodyFont}', sans-serif`, color: brandKit.primaryColor }}>Aa</p>
                            </div>
                        </div>
                    </div>

                    {/* Personality tags */}
                    <div>
                        <p className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5"><Star size={12} /> Brand Personality</p>
                        <div className="flex gap-2 flex-wrap">
                            {(brandKit.personality || []).map(p => (
                                <span key={p} className="px-3 py-1 rounded-full text-xs font-medium border"
                                    style={{ borderColor: brandKit.primaryColor + '50', color: brandKit.primaryColor, background: brandKit.primaryColor + '15' }}>
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* RIGHT: Website Preview */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col"
                >
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-400">Website Preview</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.open(`data:text/html;charset=utf-8,${encodeURIComponent(adjustedHtml || htmlContent)}`, '_blank')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/15 border border-white/10 transition">
                                <ExternalLink size={11} /> Preview
                            </button>
                            <button onClick={() => navigate(`/editor/${websiteId}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition">
                                <Pencil size={11} /> Edit Site
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative min-h-[400px]">
                        <iframe
                            srcDoc={adjustedHtml || htmlContent}
                            className="absolute inset-0 w-full h-full bg-white"
                            sandbox="allow-scripts"
                            title="Brand website preview"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Action bar */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
            >
                <button onClick={handleRegenLogo} disabled={regenLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/10 transition disabled:opacity-50">
                    {regenLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Regenerate Logo
                </button>
                <button onClick={() => setShowColorModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/10 transition">
                    <Palette size={14} /> Adjust Colors
                </button>
                <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition ml-auto">
                    Save to Dashboard →
                </button>
            </motion.div>

            {/* Color Adjustment Modal */}
            <AnimatePresence>
                {showColorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-semibold flex items-center gap-2"><Palette size={15} /> Adjust Colors</h3>
                                <button onClick={() => setShowColorModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition text-zinc-400">✕</button>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { key: 'primaryColor', label: 'Primary' },
                                    { key: 'secondaryColor', label: 'Secondary' },
                                    { key: 'accentColor', label: 'Accent' },
                                    { key: 'backgroundColor', label: 'Background' },
                                    { key: 'textColor', label: 'Text' },
                                ].map(({ key, label }) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: activeColor(key) }} />
                                            <div>
                                                <p className="text-sm font-medium">{label}</p>
                                                <p className="text-xs text-zinc-500 font-mono">{activeColor(key)}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="color"
                                            value={activeColor(key)}
                                            onChange={e => setColorOverrides(prev => ({ ...prev, [key]: e.target.value }))}
                                            className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setColorOverrides({})}
                                    className="flex-1 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition">
                                    Reset
                                </button>
                                <button onClick={() => setShowColorModal(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-200 transition">
                                    Apply
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )

    return null
}

export default BrandKitGenerator
