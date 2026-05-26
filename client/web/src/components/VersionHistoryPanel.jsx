import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'motion/react'
import { X, RotateCcw, Clock } from 'lucide-react'
import { serverUrl } from '../App'

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

function VersionHistoryPanel({ websiteId, onClose, onRestore }) {
    const [versions, setVersions] = useState([])
    const [loading, setLoading] = useState(true)
    const [restoring, setRestoring] = useState(false)
    const [confirmVersion, setConfirmVersion] = useState(null)

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/website/${websiteId}/versions`, { withCredentials: true })
                setVersions(result.data.data || [])
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchVersions()
    }, [websiteId])

    const handleRestore = async () => {
        if (!confirmVersion) return
        setRestoring(true)
        try {
            const result = await axios.post(
                `${serverUrl}/api/website/${websiteId}/rollback/${confirmVersion.versionNumber}`,
                {},
                { withCredentials: true }
            )
            onRestore(result.data.data.code)
            setConfirmVersion(null)
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setRestoring(false)
        }
    }

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-y-0 right-0 w-80 z-[9999] bg-zinc-950 border-l border-white/10 flex flex-col"
        >
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-zinc-400" />
                    <span className="text-sm font-semibold">Version History</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {loading && (
                    <div className="text-center text-zinc-500 text-sm py-8">Loading versions…</div>
                )}
                {!loading && versions.length === 0 && (
                    <div className="text-center text-zinc-500 text-sm py-8">
                        No versions yet. Make an edit to start tracking history.
                    </div>
                )}
                {versions.map((v) => (
                    <div
                        key={v._id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-white">Version {v.versionNumber}</span>
                            {v.changeDescription && (
                                <span className="text-xs text-zinc-400 truncate max-w-[160px]">{v.changeDescription}</span>
                            )}
                            <span className="text-xs text-zinc-600">{timeAgo(v.createdAt)}</span>
                        </div>
                        <button
                            onClick={() => setConfirmVersion(v)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 transition text-white font-medium"
                        >
                            <RotateCcw size={12} /> Restore
                        </button>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {confirmVersion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-10"
                    >
                        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 w-full space-y-4">
                            <h3 className="text-sm font-semibold text-white">Restore to Version {confirmVersion.versionNumber}?</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Your current version will be saved automatically before restoring.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setConfirmVersion(null)}
                                    className="flex-1 py-2 rounded-xl text-xs bg-white/10 hover:bg-white/15 transition text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRestore}
                                    disabled={restoring}
                                    className="flex-1 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 transition text-white font-semibold disabled:opacity-50"
                                >
                                    {restoring ? 'Restoring…' : 'Confirm Restore'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default VersionHistoryPanel
