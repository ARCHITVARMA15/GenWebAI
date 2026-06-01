import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Copy, ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react'
import axios from 'axios'
import { serverUrl } from '../App'

function AssetManager({ onClose, onSelect }) {
    const [assets, setAssets] = useState([])
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [copiedId, setCopiedId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchAssets()
    }, [])

    const fetchAssets = async () => {
        try {
            const { data } = await axios.get(`${serverUrl}/api/upload/assets`, { withCredentials: true })
            setAssets(data)
        } catch {
            setError('Failed to load assets')
        }
    }

    const uploadFile = async (file) => {
        if (!file) return
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
        if (!allowed.includes(file.type)) {
            setError('Only JPEG, PNG, WebP, GIF and SVG are supported')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('File must be under 5 MB')
            return
        }
        setError('')
        setUploading(true)
        try {
            const form = new FormData()
            form.append('file', file)
            const { data } = await axios.post(`${serverUrl}/api/upload/image`, form, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            setAssets(prev => [data, ...prev])
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) uploadFile(file)
        e.target.value = ''
    }

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) uploadFile(file)
    }, [])

    const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
    const handleDragLeave = () => setDragOver(false)

    const copyUrl = (asset) => {
        navigator.clipboard.writeText(asset.url)
        setCopiedId(asset._id || asset.id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleSelect = (asset) => {
        if (onSelect) {
            onSelect(asset.url)
            onClose()
        }
    }

    const deleteAsset = async (asset) => {
        setDeletingId(asset._id || asset.id)
        try {
            await axios.delete(`${serverUrl}/api/upload/assets/${asset._id || asset.id}`, { withCredentials: true })
            setAssets(prev => prev.filter(a => (a._id || a.id) !== (asset._id || asset.id)))
        } catch {
            setError('Delete failed')
        } finally {
            setDeletingId(null)
        }
    }

    const formatBytes = (b) => {
        if (!b) return ''
        if (b < 1024) return `${b}B`
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}KB`
        return `${(b / (1024 * 1024)).toFixed(1)}MB`
    }

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className='fixed inset-y-0 right-0 w-full lg:w-[380px] z-[9999] flex flex-col'
            style={{ background: '#0f1117', borderLeft: '1px solid rgba(255,255,255,.09)' }}
        >
            {/* Header */}
            <div className='h-14 px-4 flex items-center justify-between border-b border-white/10 flex-shrink-0'>
                <div className='flex items-center gap-2'>
                    <ImageIcon size={16} className='text-indigo-400' />
                    <span className='font-semibold text-sm'>Image Assets</span>
                    <span className='text-[11px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full'>{assets.length}</span>
                </div>
                <button onClick={onClose} className='p-1.5 rounded-lg hover:bg-white/8 transition'>
                    <X size={16} />
                </button>
            </div>

            {/* Upload zone */}
            <div className='px-4 pt-4 flex-shrink-0'>
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className='relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all'
                    style={{
                        borderColor: dragOver ? 'rgba(99,102,241,.7)' : 'rgba(255,255,255,.12)',
                        background: dragOver ? 'rgba(99,102,241,.07)' : 'rgba(255,255,255,.03)',
                    }}
                >
                    {uploading ? (
                        <>
                            <Loader2 size={22} className='text-indigo-400 animate-spin' />
                            <span className='text-xs text-zinc-400'>Uploading…</span>
                        </>
                    ) : (
                        <>
                            <div className='w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center'>
                                <Upload size={18} className='text-indigo-400' />
                            </div>
                            <div className='text-center'>
                                <p className='text-sm font-medium'>Drop image here</p>
                                <p className='text-xs text-zinc-500 mt-0.5'>or click to browse · max 5 MB</p>
                                <p className='text-[10px] text-zinc-600 mt-1'>JPEG · PNG · WebP · GIF · SVG</p>
                            </div>
                        </>
                    )}
                    <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*'
                        onChange={handleFileChange}
                        className='hidden'
                    />
                </div>

                {error && (
                    <p className='text-xs text-red-400 mt-2 px-1'>{error}</p>
                )}
            </div>

            {/* Assets grid */}
            <div className='flex-1 overflow-y-auto px-4 pt-4 pb-4'>
                {assets.length === 0 && !uploading ? (
                    <div className='flex flex-col items-center justify-center h-40 gap-2'>
                        <ImageIcon size={28} className='text-zinc-700' />
                        <p className='text-xs text-zinc-600'>No images uploaded yet</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-2 gap-2.5'>
                        <AnimatePresence>
                            {assets.map((asset) => {
                                const aid = asset._id || asset.id
                                const isCopied = copiedId === aid
                                const isDeleting = deletingId === aid
                                return (
                                    <motion.div
                                        key={aid}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.85 }}
                                        className='group relative rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition'
                                        style={{ background: '#1a1d27' }}
                                    >
                                        {/* thumbnail */}
                                        <div className='aspect-square bg-black/30 overflow-hidden'>
                                            <img
                                                src={asset.url}
                                                alt={asset.name}
                                                className='w-full h-full object-cover'
                                                loading='lazy'
                                            />
                                        </div>

                                        {/* info */}
                                        <div className='px-2.5 py-2'>
                                            <p className='text-[11px] font-medium truncate text-zinc-300'>{asset.name}</p>
                                            <p className='text-[10px] text-zinc-600 mt-0.5'>
                                                {asset.width && asset.height ? `${asset.width}×${asset.height}` : ''} {formatBytes(asset.bytes)}
                                            </p>
                                        </div>

                                        {/* hover actions */}
                                        <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2'>
                                            {onSelect ? (
                                                <button
                                                    onClick={() => handleSelect(asset)}
                                                    className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition'
                                                    style={{ background: '#16a34a' }}
                                                >
                                                    <Check size={12} />
                                                    Use Image
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => copyUrl(asset)}
                                                    className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition'
                                                    style={{ background: isCopied ? '#16a34a' : '#4f46e5' }}
                                                >
                                                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                                    {isCopied ? 'Copied!' : 'Copy URL'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteAsset(asset)}
                                                disabled={isDeleting}
                                                className='p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition text-red-400'
                                            >
                                                {isDeleting ? <Loader2 size={12} className='animate-spin' /> : <Trash2 size={12} />}
                                            </button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className='px-4 py-3 border-t border-white/8 flex-shrink-0'>
                <p className='text-[11px] text-zinc-600 text-center'>
                    {onSelect ? 'Click an image to add it to your portfolio' : 'Copy a URL then paste it into your HTML or tell the AI to use it'}
                </p>
            </div>
        </motion.div>
    )
}

export default AssetManager
