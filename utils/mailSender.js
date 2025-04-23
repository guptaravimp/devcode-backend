const { default: mongoose } = require("mongoose")
const nodemailer=require("nodemailer")

const mailSender=async (email,title,body)=>{
    try{
        let transpoter=nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        })

        // send email
        let info=await transpoter.sendMail({
            from:`devcode-By ravi`,
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`,
        })
        console.log(info);
        return info;
    }catch(error){
       console.log(error.message)
    }
}


module.exports=mailSender;






