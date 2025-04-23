const {instance}=require("../config/razorpay")
const Course=require("../models/Course")
const mailSender = require("../utils/mailSender")
const User=require("../models/User")
const {courseEnrollmentEmail}=require("../mail/courseEnrollementEmail") // to send desired format email 
const mongoose = require("mongoose");
const crypto = require("crypto");
courseEnrollmentEmail
const { paymentSuccess } = require("../mail/paymentSuccess")

require('dotenv').config();



exports.capturePayment=async(req,res)=>{
    const {courses}=req.body;
    const userId=req.user.id;
    if(courses.length===0){
        return res.json({success:false,
            message:"Please provide courseID"
        })
    }

    let totalAmount=0;
    for(const course_id of courses){
        let course;
        try{
            course=await Course.findById(course_id)
            if(!course){
                return res.status(401).json({
                    success:false,
                    message:"Could not find the course"
            })



            }
            const uid=new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)){
                return res.status(200).json({
                    success:false,
                    message:"Student is already Enrolled "
                })
            }
            totalAmount+=course.price;
        }catch(error){
            console.log(error)
        return res.status(500).json({
            success:false,
            message:error.message,
        })

        }
    }

        const currency="INR";
    const options={
        amount:totalAmount*100,
        currency,
        receipt:Math.random(Date.now()).toString()
        // notes:{
        //     courseId:course_id,
        //     userId,
        // }
    }
    try{
        const paymentResponse=await instance.orders.create(options)
        res.json({
            success:true,
            message:paymentResponse,
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"could not Initialize the order"
        })
    }

}



/// verification of payment 
exports.verifyPayment=async(req,res)=>{
    const razorpay_order_id=req.body?.razorpay_order_id;
    const razorpay_payment_id=req.body?.razorpay_payment_id;
    const razorpay_signature=req.body?.razorpay_signature;
    const courses=req.body?.courses;
    const userId=req.user?.id;

    console.log("data is ",razorpay_order_id, razorpay_payment_id,razorpay_signature,courses,userId)
    if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId){
       return res.status(400).json({
            success:false,
            message:"Payment failed"
        })
    }
        
    let body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature=crypto
          .createHmac("sha256",process.env.RAZORPAY_SECRET)
          .update(body.toString())
          .digest("hex");

          console.log("expected signature is ",expectedSignature)
          console.log("expected signature is ",razorpay_signature)
          if(expectedSignature===razorpay_signature){
            ///enroll course
            console.log("Theek to hai jjjjjjj ")
               await enrollStudents(courses,userId,res)
            // return res 
            return res.status(200).json({
                success:true,
                message:"Payment Verified"
            })
          }
          return res.status(400).json({
            success: false,
            message: "Invalid signature. Payment verification failed."
        });

}

const enrollStudents=async(courses,userId,res)=>{
      
    if(!courses || !userId ){
        return res.status(400).json({
            success:false,
            message:"Please Provide data for Courses or userId"
        })
    }

    for(const courseId of courses){
       try{
        const enrolledCourse=await Course.findOneAndUpdate(
            {_id:courseId},
            {$push:{studentsEnrolled:userId}},
            {new:true},
        )

        if(!enrolledCourse){
            return res.status(500).json({
                success:false,
                message:"Course not found"
            })
        }

     //// find the student and add the course to their list of entrolled courses 
        const enrolledStudent = await User.findByIdAndUpdate(
            userId,
            {
                $push:{
                    courses:courseId,
                }
            },{new:true}
        )
        console.log("ENrolled STudent is ",enrolledStudent)
        console.log("ENrolled course is ",enrolledCourse)
        /// bacche ko mai send kar do 
        const courseName = enrolledCourse.courseName;
        const courseDescription = enrolledCourse.courseDescription;
        const thumbnail = enrolledCourse.thumbnail;
        const userName = enrolledStudent.firstName + " " + enrolledStudent.lastName;
        const emailTemplate = courseEnrollmentEmail(courseName,userName, courseDescription, thumbnail);
        const emailResponse=await mailSender(
            enrolledStudent.email,
            `successfully  Enrolled into : ${enrolledCourse.courseName}`,
            emailTemplate
        )
         console.log("EMail sent successfully",emailResponse)
       }catch(error){
        console.log(error);
        return res.status(500).json({succcess:false,message:error.message})
       }
    }

} 

exports.sendPaymentSuccessEmail = async (req, res) => {
    console.log("yha apr call aaaya hai ")
    const { amount, paymentId, orderId } = req.body;
    const userId = req.user.id;

    if (!amount || !paymentId || !orderId || !userId) {
        return res.status(400).json({
            success: false,
            message: 'Please provide valid payment details',
        });
    }

    try {
        const enrolledStudent = await User.findById(userId);
        if (!enrolledStudent) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        await mailSender(
            enrolledStudent.email,
            `Devcode Payment Received`,
            paymentSuccess(
                amount / 100,
                paymentId,
                orderId,
                enrolledStudent.firstName,
                enrolledStudent.lastName,
                
            )
        );

        return res.status(200).json({
            success: true,
            message: 'Payment success email sent successfully',
        });

    } catch (error) {
        console.error("Error in sending email", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// exports.sendPaymentSuccessEmail = async (req, res) => {
//     const {amount,paymentId,orderId} = req.body;
//     const userId = req.user.id;
//     if( !paymentId ||!amount || !orderId) {
//         return res.status(400).json({
//             success:false,
//             message:'Please provide valid payment details',
//         });
//     }
//     try{
//         const enrolledStudent =  await User.findById(userId);
//         await mailSender(
//             enrolledStudent.email,
//             `Devcode Payment Received`,
//             paymentSuccess(`${enrolledStudent.firstName}`,amount/100,orderId,paymentId),
//         );
// }
//     catch(error) {
//         console.error("errorss in sending email",error);
//         return res.status(500).json({
//             success:false,
//             message:error.message,
//         });
//     }
// }



// capture the payment and initiate the razorpay order 
// exports.capturePayment=async(req,res)=>{
    
//     try{
//      // get course id and user id 
//     const {course_id}=req.body;
//     const userId=req.user.id;

//     // validation\
//     // vald course id 
//     if(!course_id){
//         return res.json({
//             success:false,
//             message:"Please provide valid course id"
//     })
//     }
//     // valid course detail 
//     let course;
//     try{
//         course=await Course.findById(course_id)
//         if(!course){
//             return res.json({
//                 success:false,
//                 message:"could not find the course "
//             })
//         }
//         // user already pay for the samecourse 
//         // convert userid to object id 
//         const uid=new mongoose.Types.ObjectId(userId)
//         // check that object id is already present in course or not 
//         if(course.studentEnrolled.includes(uid)){ // check in Course model 
//             return res.status(200).json({
//                 success:false,
//                 message:"Student is already enrolled "
//             })
//         }
//     } catch(error){
//         console.log(error)
//         return res.status(500).json({
//             success:false,
//             message:error.message,
//         })
//     }
    
//     // order create 
//     const amount=course.price;
//     const currency="INR";
//     const options={
//         amount:amount*100,
//         currency,
//         receipt:Math.random(Date.now()).toString(),
//         notes:{
//             courseId:course_id,
//             userId,
//         }
//     };
//     try{
//         // initiate the payment using razorpay
//         const paymentResponse=await instance.orders.create(options)
//         console.log(paymentResponse);
//          // return response 
//          return res.status(200).json({
//             success:true,
//             courseName: course.courseName,
//             courseDescription: course.courseDescription,
//             thumbnail: course.thumbnail,
//             orderId: paymentResponse.id,
//             currency: paymentResponse.currency,
//             amount: paymentResponse.amount
//          })
//     }catch(error){
//         console.log(error);
//         return res.status(500).json({
//             success:false,
//             message:"COuld not initate order ",
//         })
//     }
       
// }catch(error){
//     console.log(error)
//     return res.status(500).json({
//         success:false,
//         message:error.message,
//     })
// }
   
// }


// /// verify signature of razorpay and server 

// exports.verifySignature=async(req,res)=>{
//     const webhookSecret="12345678"; /// on our server lets assume dummy 
//     const signature=req.headers["x-razorpay-signature"] // that is behaviour of razorpay to send the signature key or secret key
//     const shasum=crypto.createHmack("sha256",webhookSecret)
//     // Hased based message authentication code (Hmack) 
//     // SHA( secure hashing algorithm )
//     shasum.update(JSON.stringify(req.body));
//     const digest=shasum.digest("hex");

//     // now match digest and signature 
//     if(signature===digest){
//         console.log("Payment is authorized ")
//         /// now add student to enrolled course everywhere 
//         // as we send user id and course id in oayment response in notes 
//         // location of user_is and course_id is -> req.body.payload.paymentResponse.entity.notes
//         const {courseId,userId}=req.body.payload.entity.notes;
//         try{
//             // fullfill the action 
//             // find the course and enroll the student in it 
//             const enrolledCourse=await Course.findOneAndUpdate(
//                 {id:courseId},
//                 {$push:{studentEnrolled:userId}},  // see the model of course
//                 {new:true}
//             )
//             if(!enrolledCourse){
//                 return res.status(500).json({
//                     success:false,
//                     message:"Course Not found",
//                 })
//             }
//             console.log(enrolledCourse)

//             // find the student and add the course in list of  enrolledcourses in dashboard of student 
//             const enrolledStudent=await User.findByIdAndUpdate(
//                 {id:userId},
//                 {$push:{courses:courseId}}, // see the model of useer 
//                 {new:true}
//             )
//             console.log(enrolledStudent);

//             // mailed send of course enrollment 
//             const emailResponse=await mailSender(
//                 enrolledStudent.email,
//                 "Congratulatio from devcode" ,
//                 "Congratulation You are onboarded in New Course of devcode ",

//             );
//             console.log(emailResponse);
//             return res.status(200).json({
//                 success:true,
//                 message:"Signature verified and course added "
//             })

//         }catch(error){
//            console.log(error);
//            return res.status(500).json({
//             success:false,
//             message:error.message
//            })
//         }
//     }else{
//         return res.status(400).json({
//             success:false,
//             message:"Invalid request"
//            })
//     }
// }