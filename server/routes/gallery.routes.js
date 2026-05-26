import express from 'express'
import isAuth from '../middlewares/isAuth.js'
import {
    publishWebsite, unpublishWebsite,
    getGallery, upvoteWebsite, getMyVotes, getTags
} from '../controllers/gallery.controllers.js'

const galleryRouter = express.Router()

galleryRouter.get('/tags', getTags)
galleryRouter.get('/my-votes', isAuth, getMyVotes)
galleryRouter.get('/', getGallery)
galleryRouter.post('/:id/publish', isAuth, publishWebsite)
galleryRouter.post('/:id/unpublish', isAuth, unpublishWebsite)
galleryRouter.post('/:id/upvote', isAuth, upvoteWebsite)

export default galleryRouter
