import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'
import {
    FlaskConical, ChevronDown, Loader2, CheckCircle2, Trophy,
    BarChart2, RefreshCw, Play, Square, TrendingUp, TrendingDown,
    Minus, AlertCircle, Sparkles, Users, MousePointerClick, Percent
} from 'lucide-react'

const SECTIONS = ['hero', 'cta', 'pricing']

const wrapSnippet = (html) => `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#fff}</style></head><body>${html}</body></html>`

function StatCard({ label, variant, data, isWinner }) {
    const cvr = data.visitors > 0 ? ((data.clicks / data.visitors) * 100).toFixed(1) : '0.0'
    return (
        <div className={`rounded-2xl p-4 border transition-all ${isWinner ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${variant === 'a' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-purple-500/20 text-purple-300'}`}>
                        {variant.toUpperCase()}
                    </span>
                    <span className='text-xs text-zinc-400'>{label}</span>
                </div>
                {isWinner && <Trophy size={13} className='text-emerald-400' />}
            </div>
            <div className='grid grid-cols-3 gap-2'>
                <div className='text-center'>
                    <div className='flex items-center justify-center gap-1 mb-0.5'>
                        <Users size={10} className='text-zinc-500' />
                        <span className='text-[10px] text-zinc-500 uppercase tracking-wide'>Visits</span>
                    </div>
                    <p className='text-base font-bold text-white'>{data.visitors.toLocaleString()}</p>
                </div>
                <div className='text-center'>
                    <div className='flex items-center justify-center gap-1 mb-0.5'>
                        <MousePointerClick size={10} className='text-zinc-500' />
                        <span className='text-[10px] text-zinc-500 uppercase tracking-wide'>Clicks</span>
                    </div>
                    <p className='text-base font-bold text-white'>{data.clicks.toLocaleString()}</p>
                </div>
                <div className='text-center'>
                    <div className='flex items-center justify-center gap-1 mb-0.5'>
                        <Percent size={10} className='text-zinc-500' />
                        <span className='text-[10px] text-zinc-500 uppercase tracking-wide'>CVR</span>
                    </div>
                    <p className={`text-base font-bold ${isWinner ? 'text-emerald-400' : 'text-white'}`}>{cvr}%</p>
                </div>
            </div>
        </div>
    )
}

function ConfidenceMeter({ confidence, winner, insufficientData }) {
    const isHighConfidence = confidence >= 80
    const barColor = isHighConfidence ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-zinc-600'

    return (
        <div className='p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3'>
            <div className='flex items-center justify-between'>
                <span className='text-xs font-semibold text-zinc-400 uppercase tracking-widest'>Statistical Confidence</span>
                <span className={`text-sm font-bold ${isHighConfidence ? 'text-emerald-400' : 'text-zinc-300'}`}>{confidence}%</span>
            </div>
            <div className='relative h-2 rounded-full bg-white/10 overflow-hidden'>
                <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${confidence}%` }}
                />
                <div className='absolute inset-y-0 left-[80%] w-px bg-white/20' />
            </div>
            <div className='flex items-center gap-1.5 text-xs'>
                {insufficientData ? (
                    <>
                        <AlertCircle size={12} className='text-zinc-500' />
                        <span className='text-zinc-500'>Need 50+ visitors per variant to begin analysis</span>
                    </>
                ) : isHighConfidence ? (
                    <>
                        <CheckCircle2 size={12} className='text-emerald-400' />
                        <span className='text-emerald-400'>Winner detected! 🎯 Variant {winner?.toUpperCase()} leads</span>
                    </>
                ) : (
                    <>
                        <Loader2 size={12} className='text-zinc-500 animate-spin' />
                        <span className='text-zinc-500'>Still gathering data… ({confidence}% / 80% needed)</span>
                    </>
                )}
            </div>
        </div>
    )
}

export default function ExperimentPanel({ websiteId }) {
    const [experiment, setExperiment] = useState(undefined)
    const [stats, setStats] = useState(null)
    const [targetSection, setTargetSection] = useState('hero')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generateError, setGenerateError] = useState('')
    const [preview, setPreview] = useState(null)
    const [isConcluding, setIsConcluding] = useState(false)
    const [isStopping, setIsStopping] = useState(false)
    const [concludeError, setConcludeError] = useState('')
    const pollRef = useRef(null)

    const load = useCallback(async () => {
        try {
            const r = await axios.get(`${serverUrl}/api/experiments/${websiteId}/active`, { withCredentials: true })
            setExperiment(r.data.experiment || null)
            setStats(r.data.stats || null)
        } catch (_) {
            setExperiment(null)
        }
    }, [websiteId])

    useEffect(() => {
        load()
    }, [load])

    // Poll every 30 s while an experiment is running
    useEffect(() => {
        if (experiment?.status !== 'running') {
            if (pollRef.current) clearInterval(pollRef.current)
            return
        }
        pollRef.current = setInterval(load, 30000)
        return () => clearInterval(pollRef.current)
    }, [experiment, load])

    const handleGenerate = async () => {
        setIsGenerating(true)
        setGenerateError('')
        try {
            const r = await axios.post(
                `${serverUrl}/api/experiments/start`,
                { websiteId, targetSection },
                { withCredentials: true }
            )
            setPreview({
                experimentId: r.data.experimentId,
                variantA: r.data.variantA_preview,
                variantB: r.data.variantB_preview
            })
        } catch (err) {
            setGenerateError(err?.response?.data?.message || 'Failed to generate variant. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleRegenerate = async () => {
        if (!preview?.experimentId) return
        try {
            await axios.delete(`${serverUrl}/api/experiments/${preview.experimentId}`, { withCredentials: true })
        } catch (_) {}
        setPreview(null)
        handleGenerate()
    }

    const handleLaunch = async () => {
        setPreview(null)
        await load()
    }

    const handleConclude = async (winner) => {
        if (!experiment) return
        setIsConcluding(true)
        setConcludeError('')
        try {
            await axios.post(
                `${serverUrl}/api/experiments/${experiment._id}/conclude`,
                { winner },
                { withCredentials: true }
            )
            await load()
        } catch (err) {
            setConcludeError(err?.response?.data?.message || 'Failed to conclude experiment.')
        } finally {
            setIsConcluding(false)
        }
    }

    const handleStop = async () => {
        if (!experiment) return
        setIsStopping(true)
        try {
            await axios.delete(`${serverUrl}/api/experiments/${experiment._id}`, { withCredentials: true })
            setExperiment(null)
            setStats(null)
        } catch (_) {}
        setIsStopping(false)
    }

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (experiment === undefined) {
        return (
            <div className='p-4 space-y-3'>
                {[1, 2, 3].map(i => (
                    <div key={i} className='h-16 rounded-2xl bg-white/5 animate-pulse' />
                ))}
            </div>
        )
    }

    // ── Preview screen ────────────────────────────────────────────────────────
    if (preview) {
        return (
            <div className='p-4 space-y-4'>
                <div>
                    <p className='text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1'>AI Variant Preview</p>
                    <p className='text-xs text-zinc-500'>Review both versions before launching the experiment.</p>
                </div>

                <div className='space-y-3'>
                    {[
                        { label: 'Version A — Original', html: preview.variantA, badge: 'A', color: 'indigo' },
                        { label: 'Version B — AI Variant', html: preview.variantB, badge: 'B', color: 'purple' }
                    ].map(({ label, html, badge, color }) => (
                        <div key={badge} className={`rounded-2xl border overflow-hidden ${color === 'purple' ? 'border-purple-500/30' : 'border-white/10'}`}>
                            <div className={`px-3 py-2 flex items-center gap-2 ${color === 'purple' ? 'bg-purple-500/10' : 'bg-white/5'}`}>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color === 'purple' ? 'bg-purple-500/30 text-purple-300' : 'bg-indigo-500/20 text-indigo-300'}`}>{badge}</span>
                                <span className='text-xs text-zinc-300'>{label}</span>
                                {badge === 'B' && <Sparkles size={10} className='text-purple-400 ml-auto' />}
                            </div>
                            <div className='h-40 bg-white overflow-hidden'>
                                <iframe
                                    srcDoc={wrapSnippet(html || '')}
                                    className='w-full h-full border-none'
                                    sandbox='allow-scripts'
                                    title={`Variant ${badge} preview`}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className='grid grid-cols-2 gap-2'>
                    <button
                        onClick={handleLaunch}
                        className='flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/25 transition'
                    >
                        <Play size={13} />
                        Launch
                    </button>
                    <button
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className='flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white/10 transition disabled:opacity-50'
                    >
                        {isGenerating ? <Loader2 size={13} className='animate-spin' /> : <RefreshCw size={13} />}
                        Regenerate B
                    </button>
                </div>
            </div>
        )
    }

    // ── Concluded / Winner banner ─────────────────────────────────────────────
    if (experiment && (experiment.status === 'winner_a' || experiment.status === 'winner_b')) {
        const winnerVariant = experiment.winnerVariant
        const winnerData = experiment.variants[winnerVariant]
        const loserData = experiment.variants[winnerVariant === 'a' ? 'b' : 'a']
        const winnerCvr = winnerData.visitors > 0 ? ((winnerData.clicks / winnerData.visitors) * 100).toFixed(1) : '0.0'
        const loserCvr = loserData.visitors > 0 ? ((loserData.clicks / loserData.visitors) * 100).toFixed(1) : '0.0'
        const lift = loserCvr > 0 ? (((winnerCvr - loserCvr) / loserCvr) * 100).toFixed(0) : null

        return (
            <div className='p-4 space-y-4'>
                <div className='p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center'>
                    <Trophy size={28} className='text-emerald-400 mx-auto mb-2' />
                    <p className='text-sm font-bold text-emerald-300'>
                        Variant {winnerVariant?.toUpperCase()} Won!
                    </p>
                    <p className='text-xs text-zinc-400 mt-1'>
                        {experiment.targetSection} section · concluded {new Date(experiment.concludedAt).toLocaleDateString()}
                    </p>
                    {lift && Number(lift) > 0 && (
                        <div className='mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold'>
                            <TrendingUp size={11} /> +{lift}% conversion lift
                        </div>
                    )}
                </div>

                <div className='grid grid-cols-2 gap-2'>
                    <StatCard label='Original' variant='a' data={experiment.variants.a} isWinner={winnerVariant === 'a'} />
                    <StatCard label='AI Variant' variant='b' data={experiment.variants.b} isWinner={winnerVariant === 'b'} />
                </div>

                <button
                    onClick={() => { setExperiment(null); setStats(null) }}
                    className='w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-xs hover:text-white hover:bg-white/10 transition'
                >
                    Start a new experiment
                </button>
            </div>
        )
    }

    // ── Running dashboard ─────────────────────────────────────────────────────
    if (experiment && experiment.status === 'running') {
        const isHighConfidence = stats && !stats.insufficientData && stats.confidence >= 80
        return (
            <div className='p-4 space-y-4'>
                <div className='flex items-center gap-2'>
                    <span className='flex h-2 w-2 relative'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
                        <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
                    </span>
                    <p className='text-xs font-semibold text-zinc-300'>
                        Live — testing <span className='text-white capitalize'>{experiment.targetSection}</span> section
                    </p>
                </div>

                <div className='grid grid-cols-2 gap-2'>
                    <StatCard label='Original' variant='a' data={experiment.variants.a} isWinner={isHighConfidence && stats?.winner === 'a'} />
                    <StatCard label='AI Variant' variant='b' data={experiment.variants.b} isWinner={isHighConfidence && stats?.winner === 'b'} />
                </div>

                {stats && (
                    <ConfidenceMeter
                        confidence={stats.confidence}
                        winner={stats.winner}
                        insufficientData={stats.insufficientData}
                    />
                )}

                {concludeError && (
                    <p className='text-xs text-red-400 flex items-center gap-1'><AlertCircle size={12} />{concludeError}</p>
                )}

                <div className='grid grid-cols-2 gap-2'>
                    <button
                        onClick={() => handleConclude('b')}
                        disabled={isConcluding}
                        className='flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/25 transition disabled:opacity-50'
                    >
                        {isConcluding ? <Loader2 size={12} className='animate-spin' /> : <Trophy size={12} />}
                        Declare B Winner
                    </button>
                    <button
                        onClick={() => handleConclude('a')}
                        disabled={isConcluding}
                        className='flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium hover:bg-white/10 transition disabled:opacity-50'
                    >
                        {isConcluding ? <Loader2 size={12} className='animate-spin' /> : <CheckCircle2 size={12} />}
                        Stick with A
                    </button>
                </div>

                <button
                    onClick={handleStop}
                    disabled={isStopping}
                    className='w-full flex items-center justify-center gap-1.5 py-2 text-xs text-zinc-500 hover:text-red-400 transition disabled:opacity-50'
                >
                    {isStopping ? <Loader2 size={11} className='animate-spin' /> : <Square size={11} />}
                    Stop experiment
                </button>
            </div>
        )
    }

    // ── Setup screen (no active experiment) ───────────────────────────────────
    return (
        <div className='p-4 space-y-5'>
            <div className='p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1'>
                <div className='flex items-center gap-2 mb-2'>
                    <div className='w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center'>
                        <FlaskConical size={15} className='text-indigo-400' />
                    </div>
                    <div>
                        <p className='text-sm font-semibold text-white'>A/B Testing</p>
                        <p className='text-xs text-zinc-500'>Discover which version converts better</p>
                    </div>
                </div>
                <p className='text-xs text-zinc-500 leading-relaxed'>
                    AI generates a conversion-optimized alternative for a section of your site.
                    Real visitor traffic determines the winner using statistical significance.
                </p>
            </div>

            <div className='space-y-2'>
                <label className='text-xs font-semibold text-zinc-400 uppercase tracking-widest block'>
                    Section to test
                </label>
                <div className='relative'>
                    <select
                        value={targetSection}
                        onChange={e => setTargetSection(e.target.value)}
                        className='w-full appearance-none rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition cursor-pointer'
                    >
                        {SECTIONS.map(s => (
                            <option key={s} value={s} className='bg-zinc-900 capitalize'>{s.charAt(0).toUpperCase() + s.slice(1)} Section</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none' />
                </div>
            </div>

            <div className='p-3 rounded-xl bg-white/3 border border-white/5 space-y-1.5'>
                <p className='text-[11px] font-semibold text-zinc-500 uppercase tracking-wider'>AI will optimize for</p>
                {['Stronger, more compelling headline', 'Action-oriented CTA button copy', 'Social proof element'].map(item => (
                    <div key={item} className='flex items-center gap-2 text-xs text-zinc-400'>
                        <Sparkles size={10} className='text-indigo-400 shrink-0' />
                        {item}
                    </div>
                ))}
            </div>

            {generateError && (
                <p className='text-xs text-red-400 flex items-center gap-1'><AlertCircle size={12} />{generateError}</p>
            )}

            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className='w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100'
            >
                {isGenerating ? (
                    <>
                        <Loader2 size={15} className='animate-spin' />
                        AI is writing a better version…
                    </>
                ) : (
                    <>
                        <FlaskConical size={15} />
                        Generate AI Variant
                    </>
                )}
            </button>
        </div>
    )
}
