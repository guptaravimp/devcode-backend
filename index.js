const express = require("express");
const userRoutes=require("./routes/User")
const profileRoutes=require("./routes/Profile");
const paymentRoutes=require("./routes/Payment")
const courseRoutes=require("./routes/Course")
const contactus=require("./routes/Contactus")
const cookieParser=require("cookie-parser")
// const path = require("path");

const fileupload=require("express-fileupload");

/// to allow our frontent request port to acccess the bacekend 
const cors = require('cors');


const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 4000; // Fixed: Should be 4000 instead of 400
// const _dirname=path.resolve();

// database connection 
const database = require("./config/database");
database.dbConnect();

// middleware 
app.use(express.json());
app.use(cookieParser());
/// jo bhi request aapke frontend se aa rahi hai usse entertain karna hai 
app.use(
    cors({
        origin:"https://devcode-frontend-ehr9.vercel.app/",
        credentials:true,
    })
)

app.use(fileupload({
    useTempFiles:true,
    tempFileDir:'/tmp/'
})); 

/// cloudinary connection 
const cloudinary = require("./config/cloudinary");
cloudinary.cloudinaryConnect();


// routes mount
app.use("/api/v1/auth",userRoutes)
app.use("/api/v1/payment",paymentRoutes)
app.use("/api/v1/course",courseRoutes)
app.use("/api/v1/profile",profileRoutes)
app.use("/api/v1/contact",contactus)
// app.use(express.static(path.join(_dirname,"/devcode/dist")))
// app.get('*',(req,res)=>{
//     res.sendFile(path.resolve(_dirname,"devcode","dist","index.html"))
// })
// default routes 
app.get("/", (req, res) => {
    return res.json({
        success:true,
        message:"Your Server is up and running "
    })
});

// listening port backend 
app.listen(PORT, () => {
    console.log(`App is Listening on PORT : ${PORT}`);
 });
