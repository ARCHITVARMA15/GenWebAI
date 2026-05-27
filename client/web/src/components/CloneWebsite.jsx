import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Globe, Upload, ImageIcon, Loader2, CheckCircle2, X, ScanEye, Code2, Camera } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'

const STEPS = [
    { id: 1, label: 'Taking screenshot…' },
    { id: 2, label: 'Analyzing layout with AI Vision…' },
    { id: 3, label: 'Rebuilding in HTML…' },
]

const IMAGE_STEPS = [
    { id: 1, label: 'Reading image…' },
    { id: 2, label: 'Analyzing layout with AI Vision…' },
    { id: 3, label: 'Rebuilding in HTML…' },
]

function showToast(message) {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, retryAfter: 5 } }))
}

function CloneWebsite({ onClose }) {
    const navigate = useNavigate()
    const [tab, setTab] = useState('url')

    const [url, setUrl] = useState('')
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [dragging, setDragging] = useState(false)
    const fileInputRef = useRef(null)

    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(0)

    const steps = tab === 'url' ? STEPS : IMAGE_STEPS

    useEffect(() => {
        if (!loading) { setStep(0); return }
        setStep(1)
        const t1 = setTimeout(() => setStep(2), tab === 'url' ? 2500 : 800)
        const t2 = setTimeout(() => setStep(3), tab === 'url' ? 5000 : 3000)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [loading])

    const handleFile = (f) => {
        if (!f) return
        const allowed = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowed.includes(f.type)) { showToast('Only JPEG, PNG, or WebP images are allowed'); return }
        if (f.size > 10 * 1024 * 1024) { showToast('File must be under 10 MB'); return }
        setFile(f)
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target.result)
        reader.readAsDataURL(f)
    }

    const onDrop = useCallback((e) => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files?.[0])
    }, [])

    const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
    const onDragLeave = () => setDragging(false)

    const handleCloneUrl = async () => {
        if (!url.trim()) { showToast('Please enter a URL'); return }
        setLoading(true)
        try {
            const res = await axios.post(`${serverUrl}/api/clone/from-url`, { url }, { withCredentials: true })
            navigate(`/editor/${res.data.data.websiteId}`)
        } catch (err) {
            showToast(err.response?.data?.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCloneImage = async () => {
        if (!file) { showToast('Please upload an image file'); return }
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('screenshot', file)
            const res = await axios.post(`${serverUrl}/api/clone/from-image`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            navigate(`/editor/${res.data.data.websiteId}`)
        } catch (err) {
            showToast(err.response?.data?.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col">
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onClose ? (
                            <button className="p-2 rounded-lg hover:bg-white/10 transition" onClick={onClose}>
                                <X size={16} />
                            </button>
                        ) : (
                            <button className="p-2 rounded-lg hover:bg-white/10 transition" onClick={() => navigate('/dashboard')}>
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <h1 className="text-lg font-semibold flex items-center gap-2">
                            <ScanEye size={18} className="text-violet-400" />
                            Clone a Website
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12 w-full flex-1">
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">
                        Clone any website
                        <span className="block bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                            with AI Vision
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-sm">
                        Paste a URL or upload a screenshot — AI will reverse-engineer the layout into clean HTML.
                    </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                >
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setTab('url')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition ${tab === 'url' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Globe size={15} />
                            Clone from URL
                        </button>
                        <button
                            onClick={() => setTab('image')}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition ${tab === 'image' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ImageIcon size={15} />
                            Upload Screenshot
                        </button>
                    </div>

                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {tab === 'url' && (
                                <motion.div key="url" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
                                    <label className="text-xs font-medium text-zinc-400 block mb-2">Website URL</label>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !loading && handleCloneUrl()}
                                        placeholder="https://stripe.com"
                                        disabled={loading}
                                        className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 outline-none text-sm focus:ring-2 focus:ring-violet-500/40 placeholder:text-zinc-600 disabled:opacity-50 mb-4"
                                    />
                                    <motion.button
                                        whileHover={{ scale: loading ? 1 : 1.02 }}
                                        whileTap={{ scale: loading ? 1 : 0.97 }}
                                        onClick={handleCloneUrl}
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <ScanEye size={16} />}
                                        {loading ? 'Cloning…' : 'Clone This Site'}
                                    </motion.button>
                                    <p className="text-center text-xs text-zinc-600 mt-3">
                                        We'll screenshot it and rebuild it with AI · 3 credits
                                    </p>
                                </motion.div>
                            )}

                            {tab === 'image' && (
                                <motion.div key="image" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => handleFile(e.target.files?.[0])}
                                    />

                                    {!preview ? (
                                        <div
                                            onDrop={onDrop}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-14 cursor-pointer transition mb-4 ${dragging ? 'border-violet-500 bg-violet-500/10' : 'border-white/15 hover:border-white/30 hover:bg-white/5'}`}
                                        >
                                            <Upload size={28} className={dragging ? 'text-violet-400' : 'text-zinc-500'} />
                                            <p className="text-sm text-zinc-400">Drop a screenshot here, or <span className="text-white underline underline-offset-2">click to browse</span></p>
                                            <p className="text-xs text-zinc-600">JPEG, PNG, WebP · max 10 MB</p>
                                        </div>
                                    ) : (
                                        <div className="relative mb-4 rounded-xl overflow-hidden border border-white/10 group">
                                            <img src={preview} alt="preview" className="w-full max-h-56 object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2 rounded-xl bg-white/20 border border-white/20 text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition"
                                                >
                                                    Change
                                                </button>
                                                <button
                                                    onClick={() => { setFile(null); setPreview(null) }}
                                                    className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-sm font-medium text-red-300 backdrop-blur-sm hover:bg-red-500/30 transition"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-zinc-300 flex items-center gap-1.5">
                                                <Camera size={11} />
                                                {file?.name}
                                            </div>
                                        </div>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: loading ? 1 : 1.02 }}
                                        whileTap={{ scale: loading ? 1 : 0.97 }}
                                        onClick={handleCloneImage}
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Code2 size={16} />}
                                        {loading ? 'Cloning…' : 'Clone This Screenshot'}
                                    </motion.button>
                                    <p className="text-center text-xs text-zinc-600 mt-3">
                                        Upload any website screenshot · 3 credits
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6"
                        >
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Progress</p>
                            <div className="flex flex-col gap-3">
                                {steps.map((s) => {
                                    const done = step > s.id
                                    const active = step === s.id
                                    return (
                                        <motion.div
                                            key={s.id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: step >= s.id ? 1 : 0.3, x: 0 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-emerald-500/20 border border-emerald-500/40' : active ? 'bg-violet-500/20 border border-violet-500/40' : 'bg-white/5 border border-white/10'}`}>
                                                {done ? (
                                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                                ) : active ? (
                                                    <Loader2 size={14} className="text-violet-400 animate-spin" />
                                                ) : (
                                                    <span className="text-xs text-zinc-600">{s.id}</span>
                                                )}
                                            </div>
                                            <span className={`text-sm transition-all ${done ? 'text-emerald-400 line-through decoration-emerald-500/50' : active ? 'text-white font-medium' : 'text-zinc-600'}`}>
                                                {s.label}
                                            </span>
                                        </motion.div>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-zinc-600 mt-4">This may take 20–40 seconds depending on the site…</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default CloneWebsite
