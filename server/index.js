import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import mongoSanitize from "express-mongo-sanitize"
import userRouter from "./routes/user.routes.js"
import websiteRouter from "./routes/website.routes.js"
import paymentRouter from "./routes/payment.routes.js"
import analyticsRouter from "./routes/analytics.routes.js"
import { globalLimiter, authLimiter, paymentLimiter } from "./middlewares/rateLimiter.js"

const app = express()
const port = process.env.PORT || 5000

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
]

app.use(helmet())
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(mongoSanitize())
app.use(globalLimiter)
app.use(express.json({ limit: "50kb" }))
app.use(cookieParser())

app.use("/api/auth", authLimiter, authRouter)
app.use("/api/user", userRouter)
app.use("/api/website", websiteRouter)
app.use("/api/payment", paymentLimiter, paymentRouter)
app.use("/api/analytics", analyticsRouter)

app.listen(port, () => {
    console.log("server started")
    connectDb()
})

