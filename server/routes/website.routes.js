import express from  "express"

import isAuth from "../middlewares/isAuth.js"
import { changes, deleteWebsite, deploy, generateWebsite, generateWebsiteStream, getAll, getBySlug, getWebsiteById } from "../controllers/website.controllers.js"
import { getVersions, getVersionContent, rollback } from "../controllers/version.controllers.js"
import { generateLimiter } from "../middlewares/rateLimiter.js"





const websiteRouter = express.Router()


websiteRouter.post("/generate",isAuth,generateLimiter,generateWebsite)
websiteRouter.post("/generate-stream",isAuth,generateLimiter,generateWebsiteStream)
websiteRouter.post("/update/:id",isAuth,changes)
websiteRouter.get("/get-by-id/:id",isAuth,getWebsiteById)
websiteRouter.get("/get-all" , isAuth , getAll)
websiteRouter.delete("/delete/:id", isAuth, deleteWebsite)
websiteRouter.get("/deploy/:id",isAuth,deploy)
websiteRouter.get("/get-by-slug/:slug",getBySlug)
websiteRouter.get("/:id/versions", isAuth, getVersions)
websiteRouter.get("/:id/versions/:versionNumber", isAuth, getVersionContent)
websiteRouter.post("/:id/rollback/:versionNumber", isAuth, rollback)




export default websiteRouter