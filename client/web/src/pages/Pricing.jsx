import { ArrowLeft, Check, Coins, Zap } from 'lucide-react'
import ShapeGrid from '../components/ShapeGrid'
import { motion } from 'motion/react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import LoginModal from '../components/LoginModal'
import useGetCurrentUser from '../hooks/useGetCurrentUser'

const PACKS = [
    {
        id: "starter",
        name: "Starter",
        credits: 300,
        price: 199,
        tag: null,
        perCredit: "₹0.66 / credit",
        features: ["300 AI Credits", "~12 website generations", "~12 website updates", "Deploy & share links"],
    },
    {
        id: "pro",
        name: "Pro",
        credits: 1000,
        price: 499,
        tag: "Most Popular",
        perCredit: "₹0.50 / credit",
        features: ["1000 AI Credits", "~40 website generations", "~40 website updates", "Deploy & share links", "Priority generation queue"],
    },
    {
        id: "max",
        name: "Max",
        credits: 4000,
        price: 999,
        tag: "Best Value",
        perCredit: "₹0.25 / credit",
        features: ["4000 AI Credits", "~160 website generations", "~160 website updates", "Deploy & share links", "Priority generation queue", "Early access to new features"],
    },
]

const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true)
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })

function Pricing() {
    useGetCurrentUser()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const [loadingPack, setLoadingPack] = useState(null)
    const [successPack, setSuccessPack] = useState(null)
    const [openLogin, setOpenLogin] = useState(false)

    const handleBuy = async (pack) => {
        if (!userData) {
            setOpenLogin(true)
            return
        }
        setLoadingPack(pack.id)
        try {
            const loaded = await loadRazorpay()
            if (!loaded) {
                alert("Failed to load Razorpay. Check your internet connection.")
                setLoadingPack(null)
                return
            }

            const { data } = await axios.post(
                `${serverUrl}/api/payment/create-order`,
                { pack: pack.id },
                { withCredentials: true }
            )

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: data.currency,
                name: "GenWeb.ai",
                description: `${pack.credits} Credits – ${pack.name} Pack`,
                order_id: data.orderId,
                handler: async (response) => {
                    try {
                        const verify = await axios.post(
                            `${serverUrl}/api/payment/verify`,
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                pack: pack.id,
                            },
                            { withCredentials: true }
                        )
                        dispatch(setUserData({ ...userData, credits: verify.data.credits }))
                        setSuccessPack(pack.id)
                        setTimeout(() => setSuccessPack(null), 3000)
                    } catch (err) {
                        console.log(err)
                        alert("Payment verification failed. Contact support.")
                    }
                },
                prefill: {
                    name: userData?.name || "",
                    email: userData?.email || "",
                },
                theme: { color: "#ffffff", backdrop_color: "#000000" },
                modal: { ondismiss: () => setLoadingPack(null) },
            }

            const rzp = new window.Razorpay(options)
            rzp.open()
            rzp.on("payment.failed", () => {
                setLoadingPack(null)
                alert("Payment failed. Please try again.")
            })
        } catch (error) {
            console.log(error)
            setLoadingPack(null)
        } finally {
            setLoadingPack(null)
        }
    }

    return (
        <>
        <div className='min-h-screen bg-[#040404] text-white'>
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <ShapeGrid speed={0.5} squareSize={40} direction="diagonal" borderColor="#2f293a" hoverFillColor="#222" shape="square" hoverTrailAmount={0} />
            </div>
            <div className='sticky top-0 z-40 backdrop-blur-xl bg-black/50 border-b border-white/10'>
                <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <button className='p-2 rounded-lg hover:bg-white/10 transition' onClick={() => navigate(-1)}>
                            <ArrowLeft size={16} />
                        </button>
                        <h1 className='text-lg font-semibold'>GenWeb<span className='text-zinc-400'>.ai</span></h1>
                    </div>
                    {userData && (
                        <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm'>
                            <Coins size={14} className='text-yellow-400' />
                            <span className='text-zinc-300'>Credits</span>
                            <span className='font-semibold'>{userData.credits}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className='max-w-5xl mx-auto px-6 py-20 relative z-[1]'>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-center mb-16'
                >
                    <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 mb-6'>
                        <Zap size={12} className='text-yellow-400' /> Pay once, use forever — no subscriptions
                    </div>
                    <h1 className='text-4xl md:text-5xl font-bold mb-4'>Buy Credits</h1>
                    <p className='text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed'>
                        Credits never expire. Use them to generate new websites or make updates to existing ones.
                        Each generation costs <span className='text-white font-medium'>~25 credits</span>.
                    </p>
                </motion.div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {PACKS.map((pack, i) => {
                        const isPopular = pack.tag === "Most Popular"
                        const isLoading = loadingPack === pack.id
                        const isSuccess = successPack === pack.id

                        return (
                            <motion.div
                                key={pack.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative rounded-2xl p-6 flex flex-col gap-5 border transition-all ${isPopular
                                    ? "bg-white text-black border-white"
                                    : "bg-zinc-900 border-white/10 hover:border-white/30"
                                    }`}
                            >
                                {pack.tag && (
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold ${isPopular ? "bg-black text-white" : "bg-white/10 text-zinc-300 border border-white/10"}`}>
                                        {pack.tag}
                                    </div>
                                )}

                                <div>
                                    <h2 className='text-xl font-bold mb-1'>{pack.name}</h2>
                                    <div className='flex items-end gap-1'>
                                        <span className='text-4xl font-bold'>₹{pack.price}</span>
                                    </div>
                                    <p className={`text-xs mt-1 ${isPopular ? "text-black/50" : "text-zinc-500"}`}>{pack.perCredit}</p>
                                </div>

                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${isPopular ? "bg-black/10" : "bg-zinc-800"}`}>
                                    <Coins size={15} className='text-yellow-400' />
                                    {pack.credits.toLocaleString()} credits
                                </div>

                                <ul className='space-y-2 flex-1'>
                                    {pack.features.map((f) => (
                                        <li key={f} className={`flex items-start gap-2 text-sm ${isPopular ? "text-black/80" : "text-zinc-400"}`}>
                                            <Check size={14} className={`mt-0.5 shrink-0 ${isPopular ? "text-black" : "text-emerald-400"}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    disabled={isLoading}
                                    onClick={() => handleBuy(pack)}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm transition ${isPopular
                                        ? "bg-black text-white hover:bg-zinc-900"
                                        : "bg-white text-black hover:bg-zinc-100"
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isSuccess ? "✓ Credits Added!" : isLoading ? "Processing…" : `Buy ${pack.name}`}
                                </motion.button>
                            </motion.div>
                        )
                    })}
                </div>

                <p className='text-center text-xs text-zinc-600 mt-12'>
                    Payments are processed securely by Razorpay. Credits are added instantly after successful payment.
                </p>
            </div>
        </div>

        {openLogin && <LoginModal open={openLogin} onClose={() => setOpenLogin(false)} />}
        </>
    )
}

export default Pricing
