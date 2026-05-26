import express from 'express'
import isAuth from '../middlewares/isAuth.js'
import { getOverview, getActivity, getWebsiteStats } from '../controllers/analytics.controllers.js'

const analyticsRouter = express.Router()

analyticsRouter.get('/overview', isAuth, getOverview)
analyticsRouter.get('/activity', isAuth, getActivity)
analyticsRouter.get('/websites/stats', isAuth, getWebsiteStats)

export default analyticsRouter
