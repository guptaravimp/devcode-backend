const express=require("express");
const { createCourse, showAllCourses, getCourseDetails, editCourse, getInstructorCourses, deleteCourse, getFullCourseDetails } = require("../controllers/Course");
const { isInstructor, auth, isStudent, isAdmin } = require("../middlewares/auth");
const { createSection, updateSection, deleteSection } = require("../controllers/Section");
const { createSubSection, updateSubSection, deleteSubSection } = require("../controllers/SubSection");
const { createCategory, showAllCategories, categoryPageDetails } = require("../controllers/Category");
const { createRating, getAllRating, getAverageRating } = require("../controllers/RatingAndReview");
const router=express.Router();


/// Student routes 
router.get("/showAllCourses", auth, isStudent, showAllCourses);
router.post("/getCourseDetails",getCourseDetails);


// instructor routes
router.post("/createCourse",auth,isInstructor,createCourse);
// router.get("/getCourseDetails",auth,isInstructor,getCourseDetails)
router.post("/editCourse",auth,isInstructor,editCourse);
router.post("/addSection",auth,isInstructor,createSection)
router.post("/addSubSection",auth,isInstructor,createSubSection)
router.put("/updateSection", auth,isInstructor, updateSection)
router.post("/deleteSection", auth, isInstructor, deleteSection)
router.put("/updateSubSection",auth,isInstructor, updateSubSection)
router.delete("/deleteSubSection", auth, isInstructor,deleteSubSection);
router.delete("/deleteCourse",auth,isInstructor,deleteCourse)
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
// category routes for admin
router.post("/getFullCourseDetails", auth, getFullCourseDetails)
router.post("/createCategory",auth, isAdmin,createCategory)
router.get("/showAllCategories",showAllCategories)
router.post("/getCategoryPageDetails",categoryPageDetails)


// Rating and Reviews 
router.post("/createRating",auth, isStudent ,createRating)
router.get("/getAverageRating",getAverageRating);
router.get("/getReviews",getAllRating)


module.exports=router;


