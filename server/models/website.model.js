import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role:{
        type:String,
        enum:["ai","user"],
        required:true
    },
    content:{
        type:String,
        required:true
    }


},{timestamps:true})


const websiteSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    title:{
        type:String,
        default:"Untitled Website"
    },

    latestCode:{
        type:String,
        required:true
    },
    conversation:[messageSchema],
    deployed:{
        type:Boolean,
        default:false
    },



   deployedUrl:{
    type:String,

   },
   slug:{
    type:String,
    unique:true,
    sparse:true
   },
   modelUsed:{
    type:String,
    default:"gemini"
   },
   isPublished:{
    type:Boolean,
    default:false
   },
   publishedAt:{
    type:Date
   },
   upvotes:{
    type:Number,
    default:0
   },
   upvotedBy:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
   }],
   previewImageUrl:{
    type:String
   },
   tags:[String]



},{timestamps:true});

websiteSchema.index({ isPublished: 1, upvotes: -1 })
websiteSchema.index({ isPublished: 1, publishedAt: -1 })

const Website = mongoose.model("Website" , websiteSchema)
export default Website