const express=require("express");
const { updateProfile, deleteAccount, getAlluserdetails, updateDisplayPicture, getEnrolledCourses, instructorDashboard } = require("../controllers/Profile");
const router=express.Router();

const { auth, isStudent, isInstructor } = require("../middlewares/auth");
const { resetPasswordToken, resetPassword } = require("../controllers/ResetPassword");
router.put("/updateProfile",auth, updateProfile);
router.delete("/deleteProfile",auth,deleteAccount);
router.get("/getUserDetails",auth,getAlluserdetails);
router.put("/updateDisplayPicture",auth,updateDisplayPicture);
router.post("/reset-password-token",resetPasswordToken)
router.put("/update-password",resetPassword)
router.get("/getEnrolledCourses", auth,isStudent, getEnrolledCourses)
router.get("/instructorDashboard",auth,isInstructor,instructorDashboard)
module.exports=router;