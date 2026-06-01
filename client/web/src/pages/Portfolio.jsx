import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Check, GitBranch, ImageIcon, Loader2, Plus, Trash2, X, Zap } from 'lucide-react'
import { serverUrl } from '../App'
import AssetManager from '../components/AssetManager'

const GENERATION_PHASES = [
    'Fetching GitHub profile and repositories...',
    'Analyzing your tech stack...',
    'Scraping certifications...',
    'Selecting premium design style...',
    'Generating your portfolio website...',
    'Finalizing and polishing...',
]

function Portfolio() {
    const navigate = useNavigate()

    const [step, setStep] = useState('form')

    const [githubUrl, setGithubUrl] = useState('')
    const [name, setName] = useState('')
    const [title, setTitle] = useState('')
    const [linkedinSummary, setLinkedinSummary] = useState('')
    const [certUrls, setCertUrls] = useState([])
    const [certInput, setCertInput] = useState('')
    const [customNote, setCustomNote] = useState('')
    const [selectedImages, setSelectedImages] = useState([])
    const [showAssets, setShowAssets] = useState(false)

    const [statusMessages, setStatusMessages] = useState([])
    const [streamedContent, setStreamedContent] = useState('')
    const [phaseIndex, setPhaseIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [websiteId, setWebsiteId] = useState(null)
    const [error, setError] = useState('')

    const abortRef = useRef(null)
    const progressRef = useRef(null)

    useEffect(() => {
        return () => {
            abortRef.current?.abort()
            clearInterval(progressRef.current)
        }
    }, [])

    useEffect(() => {
        if (step !== 'generating') { setProgress(0); setPhaseIndex(0); return }
        let value = 0
        progressRef.current = setInterval(() => {
            const inc = value < 20 ? Math.random() * 1.5 : value < 70 ? Math.random() * 1.0 : Math.random() * 0.3
            value = Math.min(value + inc, 92)
            setProgress(Math.floor(value))
            setPhaseIndex(Math.min(Math.floor((value / 100) * GENERATION_PHASES.length), GENERATION_PHASES.length - 1))
        }, 1200)
        return () => clearInterval(progressRef.current)
    }, [step])

    const addCertUrl = () => {
        const trimmed = certInput.trim()
        if (!trimmed || certUrls.includes(trimmed) || certUrls.length >= 5) return
        if (!trimmed.startsWith('http')) { setError('Certification URL must start with http'); return }
        setCertUrls(prev => [...prev, trimmed])
        setCertInput('')
        setError('')
    }

    const removeCert = (url) => setCertUrls(prev => prev.filter(u => u !== url))
    const removeImage = (url) => setSelectedImages(prev => prev.filter(u => u !== url))

    const handleImageSelect = (url) => {
        if (!selectedImages.includes(url) && selectedImages.length < 6) {
            setSelectedImages(prev => [...prev, url])
        }
    }

    const validate = () => {
        if (!githubUrl.trim()) return 'GitHub URL is required'
        if (!githubUrl.includes('github.com')) return 'Please enter a valid GitHub profile URL'
        if (!name.trim()) return 'Your full name is required'
        if (!title.trim()) return 'Professional title is required (e.g. Full Stack Developer)'
        return null
    }

    const handleGenerate = async () => {
        const validationError = validate()
        if (validationError) { setError(validationError); return }

        setError('')
        setStatusMessages([])
        setStreamedContent('')
        setWebsiteId(null)
        setStep('generating')

        const controller = new AbortController()
        abortRef.current = controller

        try {
            const response = await fetch(`${serverUrl}/api/portfolio/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                signal: controller.signal,
                body: JSON.stringify({
                    githubUrl: githubUrl.trim(),
                    name: name.trim(),
                    title: title.trim(),
                    linkedinSummary: linkedinSummary.trim() || undefined,
                    certUrls: certUrls.length ? certUrls : undefined,
                    customNote: customNote.trim() || undefined,
                    userImages: selectedImages.length ? selectedImages : undefined
                })
            })

            if (response.status === 429) {
                const data = await response.json().catch(() => ({}))
                setError(data.message || 'Rate limit reached — please wait before trying again')
                setStep('form')
                return
            }

            const reader = response.body.getReader()
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
                        const parsed = JSON.parse(raw)
                        if (parsed.error) {
                            setError(parsed.error)
                            setStep('form')
                            return
                        }
                        if (parsed.status) {
                            setStatusMessages(prev => [...prev, parsed.status])
                        }
                        if (parsed.chunk) {
                            setStreamedContent(prev => prev + parsed.chunk)
                        }
                        if (parsed.done) {
                            clearInterval(progressRef.current)
                            setProgress(100)
                            setWebsiteId(String(parsed.websiteId))
                            setStep('done')
                        }
                    } catch (_) {}
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') return
            setError(err.message || 'Something went wrong')
            setStep('form')
        }
    }

    const handleCancel = () => {
        abortRef.current?.abort()
        clearInterval(progressRef.current)
        setStep('form')
        setStreamedContent('')
        setStatusMessages([])
    }

    return (
        <div className='min-h-screen text-white' style={{ background: 'linear-gradient(135deg, #050505 0%, #0b0b0b 50%, #050505 100%)' }}>
            {/* Navbar */}
            <div className='sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10'>
                <div className='max-w-5xl mx-auto px-6 h-16 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <button className='p-2 rounded-lg hover:bg-white/10 transition' onClick={() => navigate('/dashboard')}>
                            <ArrowLeft size={16} />
                        </button>
                        <div className='flex items-center gap-2'>
                            <div className='w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center'>
                                <GitBranch size={14} />
                            </div>
                            <h1 className='text-sm font-semibold'>Portfolio Generator</h1>
                        </div>
                    </div>
                    <div className='flex items-center gap-1.5 text-xs text-zinc-500'>
                        <Zap size={11} className='text-yellow-500' />
                        30 credits
                    </div>
                </div>
            </div>

            <div className='max-w-5xl mx-auto px-6 py-12'>

                {/* ── FORM STEP ── */}
                {step === 'form' && (
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
                        <div className='text-center mb-12'>
                            <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-4'>
                                <GitBranch size={11} /> Agentic Portfolio Builder
                            </div>
                            <h1 className='text-4xl md:text-5xl font-bold mb-4 leading-tight'>
                                Your GitHub becomes your
                                <span className='block bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent'>
                                    premium portfolio
                                </span>
                            </h1>
                            <p className='text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed'>
                                Drop your GitHub link and we'll fetch your repos, detect your skills, and generate a stunning portfolio — no writing required.
                            </p>
                        </div>

                        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                            {/* Left column — required fields */}
                            <div className='lg:col-span-2 space-y-5'>
                                <div className='rounded-2xl border border-white/10 bg-white/3 p-6 space-y-5'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <span className='text-xs font-semibold text-zinc-400 uppercase tracking-widest'>Required</span>
                                        <span className='w-2 h-2 rounded-full bg-red-500'></span>
                                    </div>

                                    <div>
                                        <label className='text-sm font-medium mb-2 block'>GitHub Profile URL</label>
                                        <div className='relative'>
                                            <GitBranch size={14} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500' />
                                            <input
                                                value={githubUrl}
                                                onChange={e => setGithubUrl(e.target.value)}
                                                placeholder='https://github.com/yourusername'
                                                className='w-full pl-9 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-violet-500/50 transition placeholder-zinc-600'
                                            />
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                        <div>
                                            <label className='text-sm font-medium mb-2 block'>Full Name</label>
                                            <input
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder='e.g. Archit Varma'
                                                className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-violet-500/50 transition placeholder-zinc-600'
                                            />
                                        </div>
                                        <div>
                                            <label className='text-sm font-medium mb-2 block'>Professional Title</label>
                                            <input
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                                placeholder='e.g. Full Stack Developer'
                                                className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-violet-500/50 transition placeholder-zinc-600'
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className='rounded-2xl border border-white/8 bg-white/2 p-6 space-y-5'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <span className='text-xs font-semibold text-zinc-500 uppercase tracking-widest'>Optional</span>
                                        <span className='text-[10px] text-zinc-600'>More data = richer portfolio</span>
                                    </div>

                                    <div>
                                        <label className='text-sm font-medium mb-1 block'>LinkedIn Summary / Bio</label>
                                        <p className='text-xs text-zinc-600 mb-2'>Paste your LinkedIn "About" section. Adds experience & education sections.</p>
                                        <textarea
                                            value={linkedinSummary}
                                            onChange={e => setLinkedinSummary(e.target.value)}
                                            placeholder='Paste your LinkedIn About section here...'
                                            rows={4}
                                            className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/8 text-sm outline-none focus:border-violet-500/40 transition resize-none placeholder-zinc-600'
                                        />
                                    </div>

                                    <div>
                                        <label className='text-sm font-medium mb-1 block'>Certification URLs</label>
                                        <p className='text-xs text-zinc-600 mb-2'>Add links to Coursera, Credly, Google, Udemy certificates (max 5)</p>
                                        <div className='flex gap-2 mb-3'>
                                            <input
                                                value={certInput}
                                                onChange={e => setCertInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addCertUrl()}
                                                placeholder='https://coursera.org/verify/...'
                                                className='flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/8 text-sm outline-none focus:border-violet-500/40 transition placeholder-zinc-600'
                                            />
                                            <button
                                                onClick={addCertUrl}
                                                disabled={certUrls.length >= 5}
                                                className='px-3 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 transition disabled:opacity-40'
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        {certUrls.length > 0 && (
                                            <div className='space-y-2'>
                                                {certUrls.map(url => (
                                                    <div key={url} className='flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8'>
                                                        <Check size={11} className='text-green-400 shrink-0' />
                                                        <span className='text-xs text-zinc-400 truncate flex-1'>{url}</span>
                                                        <button onClick={() => removeCert(url)} className='shrink-0 text-zinc-600 hover:text-red-400 transition'>
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className='text-sm font-medium mb-1 block'>Additional Info</label>
                                        <p className='text-xs text-zinc-600 mb-2'>Anything else: target role, achievements, personal projects, desired design style</p>
                                        <textarea
                                            value={customNote}
                                            onChange={e => setCustomNote(e.target.value)}
                                            placeholder='e.g. Looking for ML engineering roles. Built an autonomous drone at my university hackathon. Prefer a dark, minimal aesthetic.'
                                            rows={3}
                                            className='w-full px-4 py-3 rounded-xl bg-black/40 border border-white/8 text-sm outline-none focus:border-violet-500/40 transition resize-none placeholder-zinc-600'
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className='text-sm text-red-400 px-1'>{error}</p>
                                )}
                            </div>

                            {/* Right column — images + generate */}
                            <div className='space-y-5'>
                                <div className='rounded-2xl border border-white/8 bg-white/2 p-5'>
                                    <div className='flex items-center justify-between mb-3'>
                                        <div>
                                            <p className='text-sm font-medium'>Profile & Project Images</p>
                                            <p className='text-xs text-zinc-600 mt-0.5'>Optional — up to 6 images</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAssets(true)}
                                            className='flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/8 hover:bg-white/12 border border-white/10 text-xs font-medium transition'
                                        >
                                            <ImageIcon size={12} />
                                            Upload
                                        </button>
                                    </div>

                                    {selectedImages.length > 0 ? (
                                        <div className='grid grid-cols-3 gap-2'>
                                            {selectedImages.map((url, i) => (
                                                <div key={url} className='relative group aspect-square rounded-lg overflow-hidden border border-white/10'>
                                                    <img src={url} alt={`asset-${i}`} className='w-full h-full object-cover' />
                                                    <button
                                                        onClick={() => removeImage(url)}
                                                        className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center'
                                                    >
                                                        <Trash2 size={14} className='text-red-400' />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setShowAssets(true)}
                                            className='border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-white/20 transition'
                                        >
                                            <ImageIcon size={20} className='text-zinc-700 mx-auto mb-2' />
                                            <p className='text-xs text-zinc-600'>Upload your profile photo or project screenshots</p>
                                        </div>
                                    )}
                                </div>

                                <div className='rounded-2xl border border-white/8 bg-white/2 p-5'>
                                    <p className='text-xs text-zinc-500 mb-3 leading-relaxed'>
                                        We'll fetch your GitHub repos, detect your skills, optionally scrape certifications, then generate a premium portfolio in one shot.
                                    </p>
                                    <div className='space-y-2 text-xs text-zinc-600 mb-4'>
                                        <div className='flex items-center gap-2'><Check size={10} className='text-green-500' /> Top repos fetched automatically</div>
                                        <div className='flex items-center gap-2'><Check size={10} className='text-green-500' /> Skills detected from languages</div>
                                        <div className='flex items-center gap-2'><Check size={10} className='text-green-500' /> Design auto-selected for your role</div>
                                        <div className='flex items-center gap-2'><Check size={10} className='text-green-500' /> Fully responsive, editable output</div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleGenerate}
                                    disabled={!githubUrl.trim() || !name.trim() || !title.trim()}
                                    className='w-full py-4 rounded-2xl font-semibold text-base transition disabled:opacity-40 disabled:cursor-not-allowed'
                                    style={{
                                        background: (githubUrl.trim() && name.trim() && title.trim()) ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : undefined,
                                        backgroundColor: !(githubUrl.trim() && name.trim() && title.trim()) ? 'rgba(255,255,255,0.08)' : undefined
                                    }}
                                >
                                    Generate Portfolio
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── GENERATING STEP ── */}
                {step === 'generating' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='max-w-2xl mx-auto'>
                        <div className='text-center mb-10'>
                            <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4'>
                                <Loader2 size={22} className='animate-spin' />
                            </div>
                            <h2 className='text-2xl font-bold mb-2'>Building your portfolio</h2>
                            <p className='text-zinc-500 text-sm'>This takes about 30-60 seconds. Hang tight.</p>
                        </div>

                        <div className='mb-6'>
                            <div className='flex justify-between text-xs text-zinc-500 mb-2'>
                                <span>{GENERATION_PHASES[phaseIndex]}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className='h-1.5 w-full bg-white/8 rounded-full overflow-hidden'>
                                <motion.div
                                    className='h-full rounded-full'
                                    style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: 'easeOut', duration: 0.8 }}
                                />
                            </div>
                        </div>

                        {statusMessages.length > 0 && (
                            <div className='rounded-2xl border border-white/8 bg-white/3 p-4 mb-5 space-y-2'>
                                {statusMessages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className='flex items-start gap-2 text-xs text-zinc-400'
                                    >
                                        <Check size={11} className='text-green-400 shrink-0 mt-0.5' />
                                        {msg}
                                    </motion.div>
                                ))}
                                {step === 'generating' && (
                                    <div className='flex items-center gap-2 text-xs text-zinc-500'>
                                        <Loader2 size={11} className='animate-spin shrink-0' />
                                        Working...
                                    </div>
                                )}
                            </div>
                        )}

                        {streamedContent && (
                            <div className='rounded-2xl overflow-hidden border border-white/10 mb-5' style={{ height: '280px' }}>
                                <div className='h-8 flex items-center px-3 gap-1.5 border-b border-white/8 bg-white/3'>
                                    <div className='w-2.5 h-2.5 rounded-full bg-red-500/60' />
                                    <div className='w-2.5 h-2.5 rounded-full bg-yellow-500/60' />
                                    <div className='w-2.5 h-2.5 rounded-full bg-green-500/60' />
                                    <span className='text-[10px] text-zinc-600 ml-1'>Live preview</span>
                                </div>
                                <iframe
                                    srcDoc={streamedContent}
                                    className='w-full bg-white'
                                    style={{ height: 'calc(100% - 2rem)' }}
                                    sandbox='allow-scripts'
                                    title='Portfolio preview'
                                />
                            </div>
                        )}

                        <div className='flex justify-center'>
                            <button
                                onClick={handleCancel}
                                className='flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm bg-white/8 hover:bg-white/12 transition text-zinc-400'
                            >
                                <X size={13} /> Cancel
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── DONE STEP ── */}
                {step === 'done' && websiteId && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className='max-w-xl mx-auto text-center'
                    >
                        <div className='w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5'>
                            <Check size={28} className='text-green-400' />
                        </div>
                        <h2 className='text-2xl font-bold mb-3'>Portfolio ready!</h2>
                        <p className='text-zinc-400 text-sm mb-8'>Your portfolio has been generated. Open the editor to preview, customize, and deploy it.</p>

                        {streamedContent && (
                            <div className='rounded-2xl overflow-hidden border border-white/10 mb-8' style={{ height: '320px' }}>
                                <div className='h-8 flex items-center px-3 gap-1.5 border-b border-white/8 bg-white/3'>
                                    <div className='w-2.5 h-2.5 rounded-full bg-red-500/60' />
                                    <div className='w-2.5 h-2.5 rounded-full bg-yellow-500/60' />
                                    <div className='w-2.5 h-2.5 rounded-full bg-green-500/60' />
                                </div>
                                <iframe
                                    srcDoc={streamedContent}
                                    className='w-full bg-white'
                                    style={{ height: 'calc(100% - 2rem)' }}
                                    sandbox='allow-scripts'
                                    title='Portfolio preview'
                                />
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => navigate(`/editor/${websiteId}`)}
                            className='px-12 py-4 rounded-2xl font-semibold text-base bg-white text-black'
                        >
                            Open in Editor →
                        </motion.button>
                    </motion.div>
                )}
            </div>

            {/* Asset Manager modal */}
            <AnimatePresence>
                {showAssets && (
                    <AssetManager
                        onClose={() => setShowAssets(false)}
                        onSelect={handleImageSelect}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default Portfolio
