// import React from 'react'
// import { ArrowLeft } from 'lucide-react'
// import { useNavigate } from 'react-router-dom'
// import { motion } from 'motion/react'
// import { useState } from 'react'
// import axios from 'axios'
// import { serverUrl } from '../config'

// function Generate() {
//     const navigate = useNavigate()
//     const [prompt, setPrompt] = useState("")
//     //calling the website generation api route on the server when user clicks on the generate website button. we will send the prompt as the request body. we will also need to send the user id to associate the generated website with the user. we can get the user id from the redux store. we will also need to handle the loading state and error state.
//     const handleGenerateWebsite = async () => {
//         try {
//             const result = await axios.post(`${serverUrl}/api/website/generate`, { prompt }, { withCredentials: true })
//             console.log(result)
//         } catch (error) {
//             console.error(error)
//         }
//     }

//     return (
//         <div className='min-h-screen bg-linear-to-br from-[#050505] via-[#0b0b0b] to-[#050505] text-white'>
//             <div className='sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10'>
//                 <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
//                     <div className='flex items-center gap-4'>
//                         <button className='p-2 rounded-lg hover:bg-white/10 transition' onClick={() => navigate("/")}><ArrowLeft size={16} /></button>
//                         <h1 className='text-lg font-semibold'>GenWeb<span className='text-zinc-400'>.ai</span></h1>
//                     </div>

//                 </div>
//             </div>

//             <div className='max-w-6xl mx-auto px-6 py-16'>
//                 <motion.div
//                     initial={{ opacity: 0, y: 30 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className="text-center mb-16"
//                 >
//                     <h1 className='text-4xl md:text-5xl font-bold mb-5 leading-tight'>
//                         Build Websites with
//                         <span className='block bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent'>Real AI Power</span>
//                     </h1>
//                     <p className='text-zinc-400 max-w-2xl mx-auto'>
//                         This process may take several minutes.
//                         genweb.ai focuses on quality, not shortcuts.
//                     </p>


//                 </motion.div>

//                 <div className='mb-14'>
//                     <h1 className='text-xl font-semibold mb-2'>Describe your website</h1>
//                     <div className='relative'>
//                         <textarea
//                             onChange={(e) => setPrompt(e.target.value)}
//                             value={prompt}
//                             placeholder='Describe your website in detail...'
//                             className='w-full h-56 p-6 rounded-3xl bg-black/60 border border-white/10 outline-none resize-none text-sm leading-relaxed focus:ring-2 focus:ring-white/20'>

//                         </textarea>

//                     </div>
//                 </div>

//                 <div className='flex justify-center'>
//                     <motion.button
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={{ scale: 0.96 }}
//                         onClick={handleGenerateWebsite}
//                         className='px-14 py-4 rounded-2xl font-semibold text-lg bg-white text-black'
//                     >
//                         Generate Website
//                     </motion.button>
//                 </div>
//             </div>





//         </div>
//     )
// }

// export default Generate


import { ArrowLeft, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from "motion/react"
import { serverUrl } from '../App'

const PHASES = [
    "Analyzing your idea…",
    "Designing layout & structure…",
    "Writing HTML & CSS…",
    "Adding animations & interactions…",
    "Final quality checks…",
]

function Generate() {
    const navigate = useNavigate()
    const [prompt, setPrompt] = useState("")
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [phaseIndex, setPhaseIndex] = useState(0)
    const [error, setError] = useState("")
    const [streamedContent, setStreamedContent] = useState("")
    const [websiteId, setWebsiteId] = useState(null)
    const abortRef = useRef(null)

    const charCount = streamedContent.length

    const handleGenerateWebsite = async () => {
        setLoading(true)
        setStreamedContent("")
        setWebsiteId(null)
        setError("")

        const controller = new AbortController()
        abortRef.current = controller

        try {
            const response = await fetch(`${serverUrl}/api/website/generate-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ prompt }),
                signal: controller.signal,
            })

            if (response.status === 429) {
                const data = await response.json().catch(() => ({}))
                const retryAfter = data.retryAfter || 60
                const message = data.message || "Too many requests. Please wait before trying again."
                window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, retryAfter } }))
                setLoading(false)
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
                    const data = line.slice(6).trim()
                    if (!data) continue
                    try {
                        const parsed = JSON.parse(data)
                        if (parsed.error) {
                            setError(parsed.error)
                            setLoading(false)
                            return
                        }
                        if (parsed.chunk) {
                            setStreamedContent(prev => prev + parsed.chunk)
                        }
                        if (parsed.done) {
                            setWebsiteId(String(parsed.websiteId))
                            setLoading(false)
                        }
                    } catch (_) {}
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') return
            setError(err.message || "Something went wrong")
            setLoading(false)
        }
    }

    const handleCancel = () => {
        abortRef.current?.abort()
        setLoading(false)
        setStreamedContent("")
    }

    useEffect(() => {
        return () => abortRef.current?.abort()
    }, [])

    useEffect(() => {
        if (!loading) { setPhaseIndex(0); setProgress(0); return }
        let value = 0
        const interval = setInterval(() => {
            const inc = value < 20 ? Math.random() * 1.5 : value < 60 ? Math.random() * 1.2 : Math.random() * 0.4
            value = Math.min(value + inc, 93)
            setProgress(Math.floor(value))
            setPhaseIndex(Math.min(Math.floor((value / 100) * PHASES.length), PHASES.length - 1))
        }, 1200)
        return () => clearInterval(interval)
    }, [loading])

    return (
        <div className='min-h-screen bg-linear-to-br from-[#050505] via-[#0b0b0b] to-[#050505] text-white'>
            <div className='sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10'>
                <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <button className='p-2 rounded-lg hover:bg-white/10 transition' onClick={() => navigate("/")}><ArrowLeft size={16} /></button>
                        <h1 className='text-lg font-semibold'>Genweb<span className='text-zinc-400'>.ai</span></h1>
                    </div>
                </div>
            </div>

            <div className='max-w-6xl mx-auto px-6 py-16'>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                    <h1 className='text-4xl md:text-5xl font-bold mb-5 leading-tight'>
                        Build Websites with
                        <span className='block bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent'>Real AI Power</span>
                    </h1>
                    <p className='text-zinc-400 max-w-2xl mx-auto'>
                        {loading
                            ? `Generating… (${charCount.toLocaleString()} chars)`
                            : 'Describe your idea and let AI generate a modern, responsive, scalable website.'}
                    </p>
                </motion.div>

                {!loading && !websiteId && (
                    <>
                        <div className='mb-14'>
                            <h1 className='text-xl font-semibold mb-2'>Describe your website</h1>
                            <textarea
                                onChange={(e) => setPrompt(e.target.value)}
                                value={prompt}
                                placeholder='Describe your website in detail...'
                                className='w-full h-56 p-6 rounded-3xl bg-black/60 border border-white/10 outline-none resize-none text-sm leading-relaxed focus:ring-2 focus:ring-white/20'
                            />
                            {error && <p className='mt-4 text-sm text-red-400'>{error}</p>}
                        </div>
                        <div className='flex justify-center'>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handleGenerateWebsite}
                                disabled={!prompt.trim()}
                                className={`px-14 py-4 rounded-2xl font-semibold text-lg ${prompt.trim() ? "bg-white text-black" : "bg-white/20 text-zinc-400 cursor-not-allowed"}`}
                            >
                                Generate Website
                            </motion.button>
                        </div>
                    </>
                )}

                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mt-4 space-y-5">
                        <div className='flex justify-between text-xs text-zinc-400'>
                            <span>{PHASES[phaseIndex]}</span>
                            <span>{charCount.toLocaleString()} chars</span>
                        </div>
                        <div className='h-2 w-full bg-white/10 rounded-full overflow-hidden'>
                            <motion.div
                                className="h-full bg-linear-to-r from-white to-zinc-300"
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "easeOut", duration: 0.8 }}
                            />
                        </div>

                        {streamedContent && (
                            <div className='rounded-2xl overflow-hidden border border-white/10 h-72'>
                                <iframe
                                    srcDoc={streamedContent}
                                    className='w-full h-full bg-white'
                                    sandbox='allow-scripts'
                                    title='Live preview'
                                />
                            </div>
                        )}

                        <div className='flex justify-center pt-2'>
                            <button
                                onClick={handleCancel}
                                className='flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm bg-white/10 hover:bg-white/15 transition text-zinc-300'
                            >
                                <X size={14} /> Cancel
                            </button>
                        </div>
                    </motion.div>
                )}

                {websiteId && !loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='flex flex-col items-center gap-4 mt-8'>
                        <p className='text-zinc-400 text-sm'>✓ Website generated successfully</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => navigate(`/editor/${websiteId}`)}
                            className='px-14 py-4 rounded-2xl font-semibold text-lg bg-white text-black'
                        >
                            View & Edit →
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default Generate
