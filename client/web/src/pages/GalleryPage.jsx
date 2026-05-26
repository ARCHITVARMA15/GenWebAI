import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ExternalLink, Heart, TrendingUp, Clock } from 'lucide-react'
import { serverUrl } from '../App'

function IframeCard({ src, title }) {
    const [loaded, setLoaded] = useState(false)
    return (
        <div className='relative h-44 bg-zinc-900 overflow-hidden rounded-t-2xl'>
            {!loaded && (
                <div className='absolute inset-0 animate-pulse bg-zinc-800 flex items-center justify-center'>
                    <span className='text-xs text-zinc-600'>Loading preview…</span>
                </div>
            )}
            {src ? (
                <iframe
                    src={src}
                    loading='lazy'
                    title={title}
                    onLoad={() => setLoaded(true)}
                    className='absolute inset-0 w-[200%] h-[200%] origin-top-left pointer-events-none bg-white'
                    style={{ transform: 'scale(0.5)' }}
                    sandbox='allow-scripts allow-same-origin'
                />
            ) : (
                <div className='absolute inset-0 flex items-center justify-center text-zinc-600 text-xs'>No preview</div>
            )}
        </div>
    )
}

function UpvoteTooltip({ children }) {
    return (
        <div className='group relative inline-flex'>
            {children}
            <div className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-zinc-800 border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 opacity-0 group-hover:opacity-100 transition z-20'>
                Sign in to upvote
            </div>
        </div>
    )
}

function GalleryPage() {
    const navigate = useNavigate()
    const { userData } = useSelector(state => state.user)

    const [sites, setSites] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [sort, setSort] = useState('top')
    const [tags, setTags] = useState([])
    const [selectedTag, setSelectedTag] = useState(null)
    const [myVotes, setMyVotes] = useState(new Set())
    const [upvotingId, setUpvotingId] = useState(null)

    const LIMIT = 12

    useEffect(() => {
        axios.get(`${serverUrl}/api/gallery/tags`)
            .then(r => setTags(r.data.data || []))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (!userData) return
        axios.get(`${serverUrl}/api/gallery/my-votes`, { withCredentials: true })
            .then(r => setMyVotes(new Set(r.data.data)))
            .catch(() => {})
    }, [userData])

    const fetchGallery = useCallback(async (pageNum, reset = false) => {
        if (reset) setLoading(true); else setLoadingMore(true)
        try {
            const params = new URLSearchParams({ sort, page: pageNum, limit: LIMIT })
            if (selectedTag) params.append('tag', selectedTag)
            const res = await axios.get(`${serverUrl}/api/gallery?${params}`)
            const fetched = res.data.data || []
            setSites(prev => reset ? fetched : [...prev, ...fetched])
            setHasMore(fetched.length === LIMIT)
        } catch {
            if (reset) setSites([])
        } finally {
            if (reset) setLoading(false); else setLoadingMore(false)
        }
    }, [sort, selectedTag])

    useEffect(() => {
        setPage(1)
        fetchGallery(1, true)
    }, [sort, selectedTag])

    const handleLoadMore = () => {
        const next = page + 1
        setPage(next)
        fetchGallery(next, false)
    }

    const handleUpvote = async (siteId) => {
        if (!userData) return
        setUpvotingId(siteId)
        try {
            const res = await axios.post(
                `${serverUrl}/api/gallery/${siteId}/upvote`,
                {},
                { withCredentials: true }
            )
            const { upvotes, hasUpvoted } = res.data
            setSites(prev => prev.map(s => s._id === siteId ? { ...s, upvotes } : s))
            setMyVotes(prev => {
                const next = new Set(prev)
                hasUpvoted ? next.add(siteId) : next.delete(siteId)
                return next
            })
        } catch {}
        setUpvotingId(null)
    }

    return (
        <div className='min-h-screen bg-[#050505] text-white'>
            <div className='sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10'>
                <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <button className='p-2 rounded-lg hover:bg-white/10 transition' onClick={() => navigate('/')}>
                            <ArrowLeft size={16} />
                        </button>
                        <h1 className='text-lg font-semibold'>Community Gallery</h1>
                    </div>
                    {userData && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className='text-sm text-zinc-400 hover:text-white transition'
                        >
                            My Dashboard →
                        </button>
                    )}
                </div>
            </div>

            <div className='max-w-7xl mx-auto px-6 py-10'>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
                    <h1 className='text-3xl font-bold mb-1'>Community Gallery</h1>
                    <p className='text-zinc-400 text-sm'>Websites built by our community — upvote your favorites</p>
                </motion.div>

                <div className='flex flex-col sm:flex-row sm:items-center gap-4 mb-8'>
                    <div className='flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 self-start'>
                        <button
                            onClick={() => setSort('top')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${sort === 'top' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <TrendingUp size={12} /> Top Voted
                        </button>
                        <button
                            onClick={() => setSort('new')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${sort === 'new' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <Clock size={12} /> Newest
                        </button>
                    </div>

                    {tags.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                            <button
                                onClick={() => setSelectedTag(null)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${!selectedTag ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                            >
                                All
                            </button>
                            {tags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition capitalize ${selectedTag === tag ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/20'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {loading && (
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className='rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse'>
                                <div className='h-44 bg-zinc-800' />
                                <div className='p-4 space-y-3'>
                                    <div className='h-4 w-3/4 bg-zinc-700 rounded' />
                                    <div className='h-3 w-1/2 bg-zinc-800 rounded' />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && sites.length === 0 && (
                    <div className='mt-32 text-center text-zinc-500'>
                        No published sites yet.{' '}
                        {userData
                            ? <button onClick={() => navigate('/dashboard')} className='text-indigo-400 hover:underline'>Be the first to publish!</button>
                            : 'Check back soon!'}
                    </div>
                )}

                {!loading && sites.length > 0 && (
                    <AnimatePresence mode='popLayout'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'>
                            {sites.map((site, i) => {
                                const voted = myVotes.has(site._id)
                                const isUpvoting = upvotingId === site._id
                                return (
                                    <motion.div
                                        key={site._id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i < 12 ? i * 0.04 : 0 }}
                                        className='rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/[0.07] transition flex flex-col'
                                    >
                                        <IframeCard src={site.deployedUrl} title={site.title} />

                                        <div className='p-4 flex flex-col gap-3 flex-1'>
                                            <div>
                                                <h3 className='font-semibold text-sm line-clamp-1'>{site.title}</h3>
                                                {site.user?.name && (
                                                    <p className='text-xs text-zinc-500 mt-0.5'>by {site.user.name}</p>
                                                )}
                                            </div>

                                            {site.tags?.length > 0 && (
                                                <div className='flex flex-wrap gap-1.5'>
                                                    {site.tags.map(tag => (
                                                        <button
                                                            key={tag}
                                                            onClick={() => setSelectedTag(tag)}
                                                            className='px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 capitalize transition'
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className='flex items-center gap-2 mt-auto'>
                                                {userData ? (
                                                    <button
                                                        onClick={() => handleUpvote(site._id)}
                                                        disabled={isUpvoting}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${voted ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'}`}
                                                    >
                                                        <Heart size={12} className={voted ? 'fill-rose-400' : ''} />
                                                        {site.upvotes}
                                                    </button>
                                                ) : (
                                                    <UpvoteTooltip>
                                                        <button className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border bg-white/5 border-white/10 text-zinc-500 cursor-default'>
                                                            <Heart size={12} />
                                                            {site.upvotes}
                                                        </button>
                                                    </UpvoteTooltip>
                                                )}
                                                {site.deployedUrl && (
                                                    <a
                                                        href={site.deployedUrl}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className='ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-black hover:bg-zinc-200 transition'
                                                    >
                                                        <ExternalLink size={11} /> Visit Site
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </AnimatePresence>
                )}

                {!loading && hasMore && (
                    <div className='mt-10 flex justify-center'>
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className='px-8 py-3 rounded-2xl text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/15 transition disabled:opacity-50'
                        >
                            {loadingMore ? 'Loading…' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GalleryPage
