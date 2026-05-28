import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'
import { Bot, Check, Copy, Loader2, Smartphone, ToggleLeft, ToggleRight } from 'lucide-react'

export default function ChatWidgetPanel({ websiteId, websiteName }) {
    const [isWidgetEnabled, setIsWidgetEnabled] = useState(false)
    const [primaryColor, setPrimaryColor] = useState('#6366f1')
    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [copied, setCopied] = useState(false)
    const widgetLoadedRef = useRef(false)

    useEffect(() => {
        axios.get(`${serverUrl}/api/website/get-by-id/${websiteId}`, { withCredentials: true })
            .then(r => {
                setIsWidgetEnabled(r.data.isWidgetEnabled || false)
                setPrimaryColor(r.data.widgetColor || '#6366f1')
            })
            .catch(() => {})
    }, [websiteId])

    const patch = async (update) => {
        try {
            const r = await axios.patch(`${serverUrl}/api/website/${websiteId}/settings`, update, { withCredentials: true })
            if (typeof r.data.isWidgetEnabled === 'boolean') setIsWidgetEnabled(r.data.isWidgetEnabled)
            if (r.data.widgetColor) setPrimaryColor(r.data.widgetColor)
        } catch (err) {
            console.error('Patch failed', err)
        }
    }

    const handleToggle = async () => {
        const next = !isWidgetEnabled
        setIsWidgetEnabled(next)
        await patch({ isWidgetEnabled: next })
    }

    const handleSaveColor = async () => {
        setIsSaving(true)
        await patch({ widgetColor: primaryColor })
        setIsSaving(false)
    }

    const embedCode = `<script src="${serverUrl}/widget.js"></script>\n<script>\n  SiteChat.init({\n    websiteId: "${websiteId}",\n    primaryColor: "${primaryColor}",\n    apiBase: "${serverUrl}"\n  });\n</script>`

    const handleCopy = async () => {
        await navigator.clipboard.writeText(embedCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleTest = () => {
        if (widgetLoadedRef.current) return
        setIsTesting(true)
        const script = document.createElement('script')
        script.src = `${serverUrl}/widget.js`
        script.onload = () => {
            if (window.SiteChat) {
                window.SiteChat.init({ websiteId, primaryColor, apiBase: serverUrl })
                widgetLoadedRef.current = true
            }
            setIsTesting(false)
        }
        script.onerror = () => setIsTesting(false)
        document.body.appendChild(script)
    }

    return (
        <div className='space-y-5 p-4'>
            <div className='flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10'>
                <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center'>
                        <Bot size={16} className='text-indigo-400' />
                    </div>
                    <div>
                        <p className='text-sm font-semibold'>AI Chat Widget</p>
                        <p className='text-xs text-zinc-500'>Let visitors ask questions about this site</p>
                    </div>
                </div>
                <button onClick={handleToggle} className='text-indigo-400 hover:text-indigo-300 transition'>
                    {isWidgetEnabled
                        ? <ToggleRight size={32} className='text-indigo-400' />
                        : <ToggleLeft size={32} className='text-zinc-600' />}
                </button>
            </div>

            {isWidgetEnabled && (<>
                <div className='p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3'>
                    <p className='text-xs font-semibold text-zinc-400 uppercase tracking-widest'>Widget Color</p>
                    <div className='flex items-center gap-3'>
                        <input
                            type='color'
                            value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            className='w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent'
                        />
                        <span className='text-sm font-mono text-zinc-300'>{primaryColor}</span>
                        <button
                            onClick={handleSaveColor}
                            disabled={isSaving}
                            className='ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium hover:bg-indigo-500/25 transition disabled:opacity-50'
                        >
                            {isSaving ? <Loader2 size={12} className='animate-spin' /> : <Check size={12} />}
                            Save color
                        </button>
                    </div>
                </div>

                <div className='p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3'>
                    <p className='text-xs font-semibold text-zinc-400 uppercase tracking-widest'>Add to any external site</p>
                    <pre className='bg-black/60 rounded-xl p-3 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap border border-white/5'>{embedCode}</pre>
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${copied ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? 'Copied!' : 'Copy code'}
                    </button>
                </div>

                <div className='p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3'>
                    <p className='text-xs font-semibold text-zinc-400 uppercase tracking-widest'>Test Widget</p>
                    <p className='text-xs text-zinc-500'>The chat bubble will appear on this page for testing.</p>
                    <button
                        onClick={handleTest}
                        disabled={isTesting || widgetLoadedRef.current}
                        className='flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/25 transition disabled:opacity-50'
                    >
                        {isTesting ? <Loader2 size={14} className='animate-spin' /> : <Smartphone size={14} />}
                        {widgetLoadedRef.current ? 'Widget active ↘' : isTesting ? 'Loading…' : 'Test Chat Widget'}
                    </button>
                </div>
            </>)}
        </div>
    )
}
