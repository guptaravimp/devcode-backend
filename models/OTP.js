const mongoose=require("mongoose");
const mailSender = require("../utils/mailSender");
const { emailTemplate } = require("../mail/emailVerificationTemplate");
const otpTemplate = require("../mail/emailVerificationTemplate");
const otpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type: String,
        required:true,
    },
    createdAt:{
        type: Date,
        default:Date.now(),
        expires:5*60,
    }
})

/// embed the mailsender function file 
async function sendvarificationEmail(email,otp){
    try{
       const mailResponse=await mailSender(email,"Verification Email From devcode",otpTemplate(otp));
       console.log("email send successfully",mailResponse)

    }catch(error){
        console.log("error occured while sending mailserver",error);
        throw error;
    }
}

otpSchema.pre("save",async function(next){
    await sendvarificationEmail(this.email,this.otp);
    next();
})


module.exports=mongoose.model("OTP",otpSchema)