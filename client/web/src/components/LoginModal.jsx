import React, { useState } from 'react'
import { AnimatePresence, motion } from "motion/react"
import { auth, provider } from '../firebase'
import { signInWithPopup, signInWithRedirect } from 'firebase/auth'
import axios from 'axios'
import { serverUrl } from '../config'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'


function LoginModal({ open, onClose }) {
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGoogleAuth = async () => {
        setLoading(true)
        setError('')
        try {
            const result = await signInWithPopup(auth, provider)
            const { data } = await axios.post(`${serverUrl}/api/auth/google`, {
                name: result.user.displayName,
                email: result.user.email,
                avatar: result.user.photoURL
            }, { withCredentials: true })
            dispatch(setUserData(data?.user ?? data ?? null))
            onClose()
        } catch (error) {
            console.error('Auth error:', error)
            if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
                setError('Popup was blocked. Redirecting to Google...')
                await signInWithRedirect(auth, provider)
            } else if (error?.code === 'auth/popup-closed-by-user') {
                setError('Sign-in cancelled. Please try again.')
            } else if (error?.code === 'auth/unauthorized-domain') {
                setError('Domain not authorised in Firebase. Add localhost to Firebase Console → Auth → Settings → Authorised domains.')
            } else {
                setError(error?.message || 'Sign-in failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }
    return (
        <AnimatePresence>
            {open && <motion.div
                className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-xl px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}

            >

                <motion.div
                    initial={{ scale: 0.88, opacity: 0, y: 60 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 40 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="relative w-full max-w-md p-[1px] rounded-3xl bg-gradient-to-br from-purple-500/40 via-blue-500/30 to-transparent"
                    onClick={(e) => e.stopPropagation()}


                >

                    <div className='relative rounded-3xl bg-[#0b0b0b] border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.8)] overflow-hidden' >
                        <motion.div
                            animate={{ opacity: [0.25, 0.4, 0.25] }}
                            transition={{ duration: 6, repeat: Infinity }}
                            className="absolute -top-32 -left-32 w-80 h-80 bg-purple-500/30 blur-[140px]"
                        />

                        <motion.div
                            animate={{ opacity: [0.2, 0.35, 0.2] }}
                            transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                            className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/25 blur-[140px]"
                        />

                        <button
                            className='absolute top-5 right-5 z-20 text-zinc-400 hover:text-white transition text-lg'
                            onClick={onClose}
                        >
                            X
                        </button>

                        <div className='relative px-8 pt-14 pb-10 text-center'>
                            <h1 className='inline-block mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300'> AI-powered website builder </h1>
                            <h2 className='text-3xl font-semibold leading-tight mb-3 space-x-2'>
                                <span >Welcome to</span>
                                <span className='bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent'>GenWeb.ai</span>
                            </h2>

                             <motion.button
                                    whileHover={{ scale: loading ? 1 : 1.04 }}
                                    whileTap={{ scale: loading ? 1 : 0.96 }}
                                    onClick={handleGoogleAuth}
                                    disabled={loading}
                                    className="group relative w-full h-13 rounded-xl bg-white text-black font-semibold shadow-xl overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <div className='relative flex items-center justify-center gap-3'>
                                        {loading ? (
                                            <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24' fill='none'><circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'/><path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z'/></svg>
                                        ) : (
                                            <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" alt="" className='h-5 w-5' />
                                        )}
                                        {loading ? 'Signing in…' : 'Continue with Google'}
                                    </div>
                                </motion.button>

                                {error && (
                                    <p className='mt-3 text-xs text-red-400 text-center leading-relaxed px-2'>{error}</p>
                                )}


                                <div className='flex items-center gap-4 my-10'>
                                    <div className='h-px flex-1 bg-white/10' />
                                    <span className='text-xs text-zinc-500 tracking-wide'>Secure Login</span>
                                    <div className='h-px flex-1 bg-white/10' />
                                </div>

                                <p className='text-xs text-zinc-500 leading-relaxed'>
                                    By continuing, you agree to our{" "}
                                    <span className="underline cursor-pointer hover:text-zinc-300">
                                        Terms of Service
                                    </span>{" "}
                                    and{" "}
                                    <span className="underline cursor-pointer hover:text-zinc-300">
                                        Privacy Policy
                                    </span>.
                                </p>





                        </div>

                    </div>

                </motion.div>

            </motion.div>}

        </AnimatePresence>

    )
}

export default LoginModal
