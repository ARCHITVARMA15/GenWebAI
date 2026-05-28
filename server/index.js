import express from "express"
import dotenv from "dotenv"
dotenv.config()
import path from "path"
import { fileURLToPath } from "url"
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import userRouter from "./routes/user.routes.js"
import websiteRouter from "./routes/website.routes.js"
import paymentRouter from "./routes/payment.routes.js"
import analyticsRouter from "./routes/analytics.routes.js"
import aiModelsRouter from "./routes/aiModels.routes.js"
import galleryRouter from "./routes/gallery.routes.js"
import cloneRouter from "./routes/clone.routes.js"
import brandRouter from "./routes/brand.routes.js"
import uploadRouter from "./routes/upload.routes.js"
import chatRouter from "./routes/chat.routes.js"
import experimentsRouter from "./routes/experiments.js"
import trackingRouter from "./routes/tracking.js"
import { startExperimentCron } from "./jobs/experimentCron.js"
import { globalLimiter, authLimiter, paymentLimiter } from "./middlewares/rateLimiter.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 5000

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
]

app.use('/api/chat', chatRouter)
app.use('/api/track', trackingRouter)

app.use(express.static(path.join(__dirname, 'public')))

app.use(helmet({ crossOriginOpenerPolicy: false }))
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(globalLimiter)
app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())

app.use("/api/auth", authLimiter, authRouter)
app.use("/api/user", userRouter)
app.use("/api/website", websiteRouter)
app.use("/api/payment", paymentLimiter, paymentRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/api/ai/models", aiModelsRouter)
app.use("/api/gallery", galleryRouter)
app.use("/api/clone", cloneRouter)
app.use("/api/brand", brandRouter)
app.use("/api/upload", uploadRouter)
app.use("/api/experiments", experimentsRouter)

app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message, '\n', err.stack)
    if (!res.headersSent) {
        res.status(500).json({ message: err.message || 'Internal server error' })
    }
})

app.listen(port, () => {
    console.log("server started")
    connectDb()
    startExperimentCron()
})

