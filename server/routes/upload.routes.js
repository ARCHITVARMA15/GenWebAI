import express from 'express'
import multer from 'multer'
import isAuth from '../middlewares/isAuth.js'
import { uploadImage, getUserAssets, deleteAsset } from '../controllers/upload.controller.js'

const uploadRouter = express.Router()
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

uploadRouter.post('/image', isAuth, upload.single('file'), uploadImage)
uploadRouter.get('/assets', isAuth, getUserAssets)
uploadRouter.delete('/assets/:id', isAuth, deleteAsset)

export default uploadRouter
