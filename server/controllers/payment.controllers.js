import Razorpay from "razorpay"
import crypto from "crypto"
import User from "../models/user.model.js"

const getRazorpay = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const CREDIT_PACKS = {
    starter: { credits: 300, amount: 19900 },
    pro: { credits: 1000, amount: 49900 },
    max: { credits: 4000, amount: 99900 },
}

export const createOrder = async (req, res) => {
    try {
        const { pack } = req.body
        const selected = CREDIT_PACKS[pack]
        if (!selected) return res.status(400).json({ message: "Invalid pack" })

        const order = await getRazorpay().orders.create({
            amount: selected.amount,
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        })

        return res.status(200).json({
            orderId: order.id,
            amount: selected.amount,
            currency: "INR",
            credits: selected.credits,
        })
    } catch (error) {
        return res.status(500).json({ message: `create order error: ${error}` })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pack } = req.body

        const body = razorpay_order_id + "|" + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
            .update(body)
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" })
        }

        const selected = CREDIT_PACKS[pack]
        if (!selected) return res.status(400).json({ message: "Invalid pack" })

        const user = await User.findById(req.user._id)
        if (!user) return res.status(404).json({ message: "User not found" })

        user.credits += selected.credits
        await user.save()

        return res.status(200).json({ message: "Payment successful", credits: user.credits })
    } catch (error) {
        return res.status(500).json({ message: `verify payment error: ${error}` })
    }
}
