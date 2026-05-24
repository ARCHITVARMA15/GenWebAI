import express from  "express"
import { getCurrentUser } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"


const userRouter = express.Router()


userRouter.get("/me",isAuth,getCurrentUser)


export default userRouter

//http:localhost:8000/api/user/me


// import { generateResponse } from "../config/openRouter.js"   
// export const generateDemo = async (req, res) => { 
//     try{
//         const response = await generateResponse("hello")
//         return res.status(200).json({response})

//     }catch(error){
//         return res.status(500).json({message:`generate demo error ${error}`})
//     }
// }