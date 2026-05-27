import { ArrowLeft, Check, BarChart2, Globe, LayoutGrid, Rocket, Share2, X, ScanEye } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { serverUrl } from '../App'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
function Dashboard() {
    const { userData } = useSelector(state => state.user)
    const navigate = useNavigate()
    const [websites, setWebsites] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [copiedId, setCopiedId] = useState(null)
    const [activeTab, setActiveTab] = useState('websites')
    const [publishModalId, setPublishModalId] = useState(null)
    const [publishTags, setPublishTags] = useState('')
    const [publishLoading, setPublishLoading] = useState(false)
    const handleDeploy = async (id) => {
        try {
            const result = await axios.get(`${serverUrl}/api/website/deploy/${id}`, { withCredentials: true })
            window.open(`${result.data.url}`, "_blank")
            setWebsites((prev) =>
        prev.map((w) =>
          w._id === id
            ? { ...w, deployed: true, deployUrl: result.data.url }
            : w
        )
      );
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        const handleGetAllWebsites = async () => {
            setLoading(true)
            try {

                const result = await axios.get(`${serverUrl}/api/website/get-all`, { withCredentials: true })
                setWebsites(result.data || [])
                setLoading(false)
            } catch (error) {
                console.log(error)
                setError(error.response.data.message)
                setLoading(false)
            }
        }
        handleGetAllWebsites()
    }, [])

    const handleCopy = async (site) => {
        await navigator.clipboard.writeText(site.deployUrl)
        setCopiedId(site._id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handlePublish = async (id) => {
        setPublishLoading(true)
        try {
            const tags = publishTags.split(',').map(t => t.trim()).filter(Boolean)
            await axios.post(`${serverUrl}/api/gallery/${id}/publish`, { tags }, { withCredentials: true })
            setWebsites(prev => prev.map(w => w._id === id ? { ...w, isPublished: true, tags } : w))
            setPublishModalId(null)
            setPublishTags('')
        } catch (err) {
            console.log(err)
        }
        setPublishLoading(false)
    }

    const handleUnpublish = async (id) => {
        try {
            await axios.post(`${serverUrl}/api/gallery/${id}/unpublish`, {}, { withCredentials: true })
            setWebsites(prev => prev.map(w => w._id === id ? { ...w, isPublished: false } : w))
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className='min-h-screen bg-[#050505] text-white'>
            <div className='sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10'>
                <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <button className='p-2 rounded-lg hover:bg-white/10 transition' onClick={() => navigate("/")}><ArrowLeft size={16} /></button>
                        <h1 className='text-lg font-semibold'>Dashboard</h1>
                        <div className='hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1'>
                            <button
                                onClick={() => setActiveTab('websites')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'websites' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <LayoutGrid size={13} /> My Sites
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'analytics' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <BarChart2 size={13} /> Analytics
                            </button>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button className='flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm font-medium hover:bg-white/15 transition' onClick={() => navigate("/clone")}>
                            <ScanEye size={14} className='text-violet-400' /> Clone a Site
                        </button>
                        <button className='px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:scale-105 transition' onClick={() => navigate("/generate")}>
                            + New Website
                        </button>
                    </div>
                </div>
            </div>
            <div className='max-w-7xl mx-auto px-6 py-10'>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <p className='text-sm text-zinc-400 mb-1'>Welcome Back</p>
                    <h1 className='text-3xl font-bold'>{userData.name}</h1>
                </motion.div>

                {activeTab === 'analytics' && <AnalyticsDashboard />}

                {activeTab === 'websites' && <>
                {loading && (
                    <div className="mt-24 text-center text-zinc-400">Loading Your Websites...</div>
                )}

                {error && !loading && (
                    <div className="mt-24 text-center text-red-400">{error}</div>
                )}

                {websites?.length == 0 && (
                    <div className="mt-24 text-center text-zinc-400">You have no websites</div>
                )}

                {!loading && !error && websites?.length > 0 && (
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8'>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -6 }}
                            onClick={() => navigate('/clone')}
                            className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/60 transition cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[220px] p-6"
                        >
                            <div className='w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center'>
                                <ScanEye size={22} className='text-violet-400' />
                            </div>
                            <div className='text-center'>
                                <p className='font-semibold text-sm'>Clone a Website</p>
                                <p className='text-xs text-zinc-500 mt-1'>Paste URL or upload screenshot</p>
                            </div>
                        </motion.div>
                        {websites.map((w, i) => {

                            const copied = copiedId === w._id

                            return <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -6 }}
                               
                                className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 transition flex flex-col"
                            >
                                <div className='relative h-40 bg-black cursor-pointer'  onClick={()=>navigate(`/editor/${w._id}`)}>
                                    <iframe srcDoc={w.latestCode} className='absolute inset-0 w-[140%] h-[140%] scale-[0.72] origin-top-left pointer-events-none bg-white' />
                                    <div className='absolute inset-0 bg-black/30' />
                                </div>

                                <div className='p-5 flex flex-col gap-4 flex-1'>
                                    <h3 className='text-base font-semibold line-clamp-2'>{w.title}</h3>
                                    <p className='text-xs text-zinc-400'>Last Updated {""}
                                        {new Date(w.updatedAt).toLocaleDateString()}
                                    </p>

                                    <button
                                        onClick={() => w.isPublished ? handleUnpublish(w._id) : setPublishModalId(w._id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                                            w.isPublished
                                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/25 hover:text-rose-400'
                                                : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <Globe size={12} />
                                        {w.isPublished ? 'Published' : 'Publish'}
                                    </button>
                                    {!w.deployed ? (
                                        <button className=" mt-auto flex items-center justify-center gap-2
                          px-4 py-2 rounded-xl text-sm font-semibold
                          bg-gradient-to-r from-indigo-500 to-purple-500
                          hover:scale-105 transition
                        "
                                            onClick={() => handleDeploy(w._id)}

                                        ><Rocket size={18} /> Deploy</button>
                                    ) : (<motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleCopy(w)}
                                        className={`
                          mt-auto flex items-center justify-center gap-2
                          px-4 py-2 rounded-xl text-sm font-medium
                          transition-all
                          ${copied
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                : "bg-white/10 hover:bg-white/20 border border-white/10"
                                            }
                        `}
                                    >
                                        { copied?(
                                            <>
                                            <Check size={14}/>
                                            Link Copied
                                            </>
                                        ):
                                        <>
                                        <Share2 size={14}/>
                                        Share Link
                                        </>
                                        }
                                    </motion.button>)}

                                </div>

                            </motion.div>
                        })}

                    </div>
                )}
                </>}
            </div>

            {publishModalId && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4'>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className='bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl'
                    >
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='font-semibold'>Publish to Gallery</h2>
                            <button onClick={() => { setPublishModalId(null); setPublishTags('') }} className='p-1.5 rounded-lg hover:bg-white/10 transition'><X size={14} /></button>
                        </div>
                        <p className='text-xs text-zinc-400 mb-4'>Your site will appear in the Community Gallery. Others can view and upvote it.</p>
                        <label className='text-xs font-medium text-zinc-300 block mb-1.5'>Tags <span className='text-zinc-600'>(comma-separated, e.g. landing page, portfolio)</span></label>
                        <input
                            value={publishTags}
                            onChange={e => setPublishTags(e.target.value)}
                            placeholder='landing page, portfolio, saas…'
                            className='w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 outline-none text-sm focus:ring-2 focus:ring-white/20 mb-5'
                        />
                        <div className='flex gap-3'>
                            <button
                                onClick={() => { setPublishModalId(null); setPublishTags('') }}
                                className='flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handlePublish(publishModalId)}
                                disabled={publishLoading}
                                className='flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-200 transition disabled:opacity-50'
                            >
                                {publishLoading ? 'Publishing…' : 'Publish'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
