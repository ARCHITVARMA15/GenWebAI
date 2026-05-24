import mongoose from "mongoose"

export const connectDb = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("databse conncted")
    }catch(error){
        console.log("db error")
    }
}

export default connectDb