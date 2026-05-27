import User from "../models/user.model.js"
import jwt from "jsonwebtoken"
export const googleAuth = async (req, res)=>{
    try{
        const { email, avatar } = req.body
        const name = req.body.name || email?.split('@')[0] || 'User'

        if(!email){
            return res.status(400).json({ message:"email is required" })
        }

        let user = await User.findOne({email}) 
        if(!user){
            user = await User.create({name, email, avatar})
        } 

        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET, {expiresIn:"7d"})

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json(user)
    }catch(error){
        console.error('googleAuth error:', error.message, error.stack)
        return res.status(500).json({message:`google auth error: ${error.message}`})
    }
}




export const logOut = async (req, res)=>{
    try{
         res.clearCookie("token",{
            httpOnly: true,
            secure:false,
            sameSite:"strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
        return res.status(200).json({message:"log out sucessfully"})
    }catch(error){
       return res.status(500).json({message:`logout error ${error}`}) 
    }

}

