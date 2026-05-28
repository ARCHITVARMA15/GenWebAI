import axios from 'axios'
import React from 'react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { serverUrl } from '../App'
import { useState } from 'react'
import { ArrowLeft, Bot, Code, Code2, Download, FlaskConical, History, ImageIcon, MessageCircle, MessageSquare, Monitor, Rocket, Send, Smartphone, X } from 'lucide-react'
import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import VersionHistoryPanel from '../components/VersionHistoryPanel'
import AssetManager from '../components/AssetManager'
import ChatWidgetPanel from '../components/ChatWidgetPanel'
import ExperimentPanel from '../components/ExperimentPanel'

import Editor from '@monaco-editor/react';
function WebsiteEditor() {
    const { id } = useParams()
    const [website, setWebsite] = useState(null)
    const [error, setError] = useState("")
    const [code, setCode] = useState("")
    const [messages, setMessages] = useState([])
    const [prompt, setPrompt] = useState("")
    const iframeRef = useRef(null)
    const [updateLoading, setUpdateLoading] = useState(false)
    const [thinkingIndex, setThinkingIndex] = useState(0)
    const [showCode, setShowCode] = useState(false)
    const [showFullPreview, setShowFullPreview] = useState(false)
    const [showChat, setShowChat] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [showAssets, setShowAssets] = useState(false)
    const [updateError, setUpdateError] = useState('')
    const [mobileView, setMobileView] = useState(false)
    const [showWidget, setShowWidget] = useState(false)
    const [showExperiment, setShowExperiment] = useState(false)
    const thinkingSteps = [
        "Understanding your request…",
        "Planning layout changes…",
        "Improving responsiveness…",
        "Applying animations…",
        "Finalizing update…",
    ]
    const handleUpdate = async () => {
        if (!prompt) return
        setUpdateLoading(true)
        const text = prompt
        setPrompt("")
        setMessages((m) => [...m, { role: "user", content: prompt }])
        try {
            setUpdateError('')
            const result = await axios.post(`${serverUrl}/api/website/update/${id}`, { prompt: text }, { withCredentials: true })
            setUpdateLoading(false)
            setMessages((m) => [...m, { role: "ai", content: result.data.message }])
            setCode(result.data.code)
        } catch (error) {
            setUpdateLoading(false)
            setUpdateError(error?.response?.data?.message || 'Update failed. Please try again.')
            console.log(error)
        }
    }

    const handleDownload = () => {
        if (!code) return
        const blob = new Blob([code], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${(website?.title || 'website').slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleDeploy = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/website/deploy/${website._id}`, { withCredentials: true })
                window.open(`${result.data.url}`, "_blank")
               
            } catch (error) {
                console.log(error)
            }
        }


    useEffect(() => {
        if (!updateLoading) return;
        const i = setInterval(() => {
            setThinkingIndex((i) => (i + 1) % thinkingSteps.length)
        }, 1200)

        return () => clearInterval(i)
    }, [updateLoading])

    useEffect(() => {
        const handleGetWebsite = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/website/get-by-id/${id}`, { withCredentials: true })
                setWebsite(result.data)
                setCode(result.data.latestCode)
                setMessages(result.data.conversation)
            } catch (error) {
                console.log(error)
                setError(error.response.data.message)
            }
        }
        handleGetWebsite()
    }, [id])


    useEffect(() => {
        if (!iframeRef.current || !code) return;
        const blob = new Blob([code], { type: "text/html" })
        const url = URL.createObjectURL(blob)
        iframeRef.current.src = url
        return () => URL.revokeObjectURL(url)
    }, [code, mobileView])

    if (error) {
        return (
            <div className='h-screen flex items-center justify-center bg-black text-red-400'>
                {error}
            </div>
        )
    }
    if (!website) {
        return (
            <div className='h-screen flex items-center justify-center bg-black text-white'>
                Loading...
            </div>
        )
    }



    return (
        <div className='h-screen w-screen flex bg-black text-white overflow-hidden'>
            <aside className='hidden lg:flex w-95 flex-col border-r border-white/10 bg-black/80'>
                <Header />
                <>
                    <div className='flex-1 overflow-y-auto px-4 py-4 space-y-4'>
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : "mr-auto"
                                    }`}
                            >

                                <div
                                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                                        ? "bg-white text-black"
                                        : "bg-white/5 border border-white/10 text-zinc-200"
                                        }`}
                                >

                                    {m.content}

                                </div>

                            </div>
                        ))}

                        {updateLoading &&

                            <div className='max-w-[85%] mr-auto'>
                                <div className='px-4 py-2.5 rounded-2xl text-xs bg-white/5 border border-white/10 text-zinc-400 italic'>{thinkingSteps[thinkingIndex]}</div>
                            </div>}




                    </div>
                    <div className='p-3 border-t border-white/10'>
                        {updateError && <p className='text-xs text-red-400 mb-2 px-1'>{updateError}</p>}
                        <div className='flex gap-2'>
                            <input placeholder='Describe Changes...' className='flex-1 resize-none rounded-2xl px-4 py-3 bg-white/5 border border-white/10 text-sm outline-none' onChange={(e) => setPrompt(e.target.value)} value={prompt} />
                            <button className='px-4 py-3 rounded-2xl bg-white text-black' disabled={updateLoading} onClick={handleUpdate}><Send size={14} /></button>
                        </div>
                    </div>

                </>
            </aside>

            <div className='flex-1 flex flex-col'>
                <div className='h-14 px-4 flex justify-between items-center border-b border-white/10 bg-black/80'>
                    <span className='text-xs text-zinc-400'>Live Preview</span>
                    <div className='flex gap-2'>
                        {website.deployed
                            ? <a href={website.deployUrl} target="_blank" rel="noreferrer" className='flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm font-semibold hover:scale-105 transition'><Rocket size={14} /> View Site</a>
                            : <button className='flex items-center gap-2 px-4 py-1.5 rounded-lg bg-linear-to-r from-indigo-500 to-purple-500 text-sm font-semibold hover:scale-105 transition' onClick={handleDeploy}><Rocket size={14} /> Deploy</button>
                        }
                       
                        <button className='p-2 lg:hidden' onClick={() => setShowChat(true)}><MessageSquare size={18} /></button>

                        <button className='p-2 text-zinc-400 hover:text-white transition' onClick={handleDownload} title="Download HTML"><Download size={18} /></button>
                        <button className={`p-2 rounded-lg transition ${showWidget ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`} onClick={() => setShowWidget(v => !v)} title='Chat Widget'><Bot size={18} /></button>
                        <button className={`p-2 rounded-lg transition ${showExperiment ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`} onClick={() => setShowExperiment(v => !v)} title='A/B Testing'><FlaskConical size={18} /></button>
                        <button className='p-2' onClick={() => setShowHistory((v) => !v)} title="Version History"><History size={18} /></button>
                        <button className='p-2' onClick={() => setShowAssets((v) => !v)} title="Image Assets"><ImageIcon size={18} /></button>
                        <button
                            className={`p-2 rounded-lg transition ${mobileView ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
                            onClick={() => setMobileView(v => !v)}
                            title="Mobile Preview"
                        ><Smartphone size={18} /></button>
                        <button className='p-2' onClick={() => setShowCode(true)}><Code2 size={18} /></button>
                        <button className='p-2' onClick={() => setShowFullPreview(true)}><Monitor size={18} /></button>
                    </div>

                </div>

                <div className={`flex-1 overflow-auto ${mobileView ? 'flex items-start justify-center bg-zinc-950 py-8' : 'flex flex-col'}`}>
                    {mobileView ? (
                        <div className='w-[390px] shrink-0 rounded-[40px] border-[8px] border-zinc-700 shadow-2xl overflow-hidden flex flex-col' style={{ height: 844 }}>
                            <div className='h-7 bg-zinc-800 shrink-0 flex items-center justify-center'>
                                <div className='w-20 h-1.5 rounded-full bg-zinc-600' />
                            </div>
                            <iframe ref={iframeRef} sandbox='allow-scripts allow-same-origin allow-forms' className='flex-1 w-full bg-white' />
                        </div>
                    ) : (
                        <iframe ref={iframeRef} sandbox='allow-scripts allow-same-origin allow-forms' className='flex-1 w-full bg-white' />
                    )}
                </div>
            </div>

            {showWidget && website && (
                <aside className='w-80 shrink-0 border-l border-white/10 bg-black/80 flex flex-col overflow-y-auto'>
                    <div className='h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0'>
                        <span className='text-xs font-semibold text-zinc-400 uppercase tracking-widest'>Chat Widget</span>
                        <button className='p-1.5 rounded-lg hover:bg-white/10' onClick={() => setShowWidget(false)}><X size={14} /></button>
                    </div>
                    <ChatWidgetPanel websiteId={website._id} websiteName={website.title} />
                </aside>
            )}

            {showExperiment && website && (
                <aside className='w-80 shrink-0 border-l border-white/10 bg-black/80 flex flex-col overflow-y-auto'>
                    <div className='h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0'>
                        <div className='flex items-center gap-2'>
                            <FlaskConical size={14} className='text-indigo-400' />
                            <span className='text-xs font-semibold text-zinc-400 uppercase tracking-widest'>A/B Testing</span>
                        </div>
                        <button className='p-1.5 rounded-lg hover:bg-white/10' onClick={() => setShowExperiment(false)}><X size={14} /></button>
                    </div>
                    <ExperimentPanel websiteId={website._id} />
                </aside>
            )}

            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="fixed inset-0 z-[9999] bg-black flex flex-col"
                    >
                   <Header onclose={()=>setShowChat(false)}/>
                   <>
                    <div className='flex-1 overflow-y-auto px-4 py-4 space-y-4'>
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : "mr-auto"
                                    }`}
                            >

                                <div
                                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                                        ? "bg-white text-black"
                                        : "bg-white/5 border border-white/10 text-zinc-200"
                                        }`}
                                >

                                    {m.content}

                                </div>

                            </div>
                        ))}

                        {updateLoading &&

                            <div className='max-w-[85%] mr-auto'>
                                <div className='px-4 py-2.5 rounded-2xl text-xs bg-white/5 border border-white/10 text-zinc-400 italic'>{thinkingSteps[thinkingIndex]}</div>
                            </div>}




                    </div>
                    <div className='p-3 border-t border-white/10'>
                        <div className='flex gap-2'>
                            <input placeholder='Describe Changes...' className='flex-1 resize-none rounded-2xl px-4 py-3 bg-white/5 border border-white/10 text-sm outline-none' onChange={(e) => setPrompt(e.target.value)} value={prompt} />
                            <button className='px-4 py-3 rounded-2xl bg-white text-black' disabled={updateLoading} onClick={handleUpdate}><Send size={14} /></button>
                        </div>
                    </div>

                </>
                    </motion.div>
                )}
            </AnimatePresence>


            <AnimatePresence>
                {showCode && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        className="fixed inset-y-0 right-0 w-full lg:w-[45%] z-[9999] bg-[#1e1e1e] flex flex-col"
                    >
                        <div className='h-12 px-4 flex justify-between items-center border-b border-white/10 bg-[#1e1e1e]'>
                            <span className='text-sm font-medium'>index.html</span>
                            <button onClick={() => setShowCode(false)}><X size={18} /></button>
                        </div>
                        <Editor
                            theme='vs-dark'
                            value={code}
                            language='html'
                            onChange={(v) => setCode(v)}
                        />

                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAssets && (
                    <AssetManager onClose={() => setShowAssets(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showHistory && (
                    <VersionHistoryPanel
                        websiteId={id}
                        onClose={() => setShowHistory(false)}
                        onRestore={(restoredCode) => {
                            setCode(restoredCode)
                            setShowHistory(false)
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showFullPreview && (
                    <motion.div
                        className="fixed inset-0 z-[9999] bg-black"
                    >
                        <iframe className='w-full h-full bg-white' srcDoc={code} sandbox='allow-scripts allow-same-origin allow-forms'/>
                        <button onClick={() => setShowFullPreview(false)} className='absolute top-4 right-4 p-2 bg-black/70 rounded-lg'><X /></button>
                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    )

    function Header({onclose}) {
        return (
            <div className='h-14 px-4 flex items-center justify-between border-b border-white/10'>
                <span className='font-semibold truncate'>{website.title}</span>
                {onclose &&  <button onClick={onclose}><X size={18} color='white'/></button>}
           
            </div>
        )
    }



}





export default WebsiteEditor
