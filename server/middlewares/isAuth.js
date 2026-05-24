import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({ message: 'token not found' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id)

        if (!req.user) {
            return res.status(401).json({ message: 'user not found' })
        }

        next()
    } catch (error) {
        return res.status(401).json({ message: 'unauthorized' })
    }
}

export default isAuth