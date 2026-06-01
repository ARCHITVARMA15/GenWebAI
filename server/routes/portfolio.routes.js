import express from 'express'
import isAuth from '../middlewares/isAuth.js'
import { generateLimiter } from '../middlewares/rateLimiter.js'
import { generatePortfolio } from '../controllers/portfolio.controllers.js'

const portfolioRouter = express.Router()

portfolioRouter.post('/generate', isAuth, generateLimiter, generatePortfolio)

export default portfolioRouter
