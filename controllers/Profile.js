// that is additional detail in user model 
const Course = require("../models/Course");
const Profile=require("../models/Profile");
const User=require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
//// here we need to update profile that is user but initially see that during signup we put dummy data of all detail so we need to update beacuse intially it is INITIALLY CREATED 



exports.updateProfile = async (req, res) => {
	try {
		console.log("Mujhe call kiya ja rha ahia ")
		const { dateOfBirth = "", about = "", contactNumber="",firstName,lastName,gender="" } = req.body;
		const id = req.user.id;

		// Find the profile by id
		const userDetails = await User.findById(id);
		const profile = await Profile.findById(userDetails.additionalDetails);
         
		// Update the profile fields
		userDetails.firstName = firstName || userDetails.firstName;
		userDetails.lastName = lastName || userDetails.lastName;
		profile.dateOfBirth = dateOfBirth || profile.dateOfBirth;
		profile.about = about || profile.about;
		profile.gender=gender || profile.gender;
		profile.contactNumber = contactNumber || profile.contactNumber;
        
		// Save the updated profile
		await profile.save();
		await userDetails.save();
        console.log("all are saved ")
		return res.json({
			success: true,
			message: "Profile updated successfully",
			profile,
			userDetails,
		});
		
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

exports.deleteAccount = async (req, res) => {
	try {
		// TODO: Find More on Job Schedule
		// const job = schedule.scheduleJob("10 * * * * *", function () {
		// 	console.log("The answer to life, the universe, and everything!");
		// });
		// console.log(job);
		const id = req.user.id;
		const user = await User.findById({ _id: id });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}
		// Delete Assosiated Profile with the User
		await Profile.findByIdAndDelete({ _id: user.additionalDetails });
		// TODO: Unenroll User From All the Enrolled Courses
		// Now Delete User
		await User.findByIdAndDelete({ _id: id });
		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		console.log(error);
		res
			.status(500)
			.json({ success: false, message: "User Cannot be deleted successfully",error:error.message });
	}
};









/// get all user details 
exports.getAlluserdetails=async(req,res)=>{
    
    try{
    // get id
    const id=req.user.id;
    console.log("Ha ho gaya ")
    // validation
    const UserDetails=await User.findById(id)
                    .populate("additionalDetails")
                    .exec(); // by populating we find all details
      
    /// retrun res
    return res.status(200).json({
        success:true,
        message:"User data fetched successfully",
        data: UserDetails,
    })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"User data fetched failed "
        })
    }
}








// }

exports.updateDisplayPicture = async (req, res) => {
    try {
        const id = req.user.id;
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const profilepic = req.files?.displayPicture;

        if (!profilepic) {
            return res.status(400).json({
                success: false,
                message: "Picture not uploaded"
            });
        }

        const profilePicture = await uploadImageToCloudinary(profilepic, process.env.FOLDER_NAME);
        console.log(profilePicture);

        const updatedImage = await User.findByIdAndUpdate(
            id,
            { image: profilePicture.secure_url },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            data: updatedImage
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile picture"
        });
    }
};




exports.getEnrolledCourses = async (req, res) => {
	
	try {
	  const userId = req.user.id
	  let userDetails = await User.findOne({
		_id: userId,
	  })
		.populate({
		  path: "courses",
		  populate: {
			path: "courseContent",
			populate: {
			  path: "subSection",
			},
		  },
		})
		.exec()
		
	  userDetails = userDetails.toObject()
	  
	//   var SubsectionLength = 0
	//   for (var i = 0; i < userDetails.courses.length; i++) {
	// 	let totalDurationInSeconds = 0
	// 	SubsectionLength = 0
	// 	for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
	// 	  totalDurationInSeconds += userDetails.courses[i].courseContent[
	// 		j
	// 	  ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
	// 	  userDetails.courses[i].totalDuration = convertSecondsToDuration(
	// 		totalDurationInSeconds
	// 	  )
	// 	  SubsectionLength +=
	// 		userDetails.courses[i].courseContent[j].subSection.length
	// 	}
	// 	let courseProgressCount = await CourseProgress.findOne({
	// 	  courseID: userDetails.courses[i]._id,
	// 	  userId: userId,
	// 	})
	// 	courseProgressCount = courseProgressCount?.completedVideos.length
	// 	if (SubsectionLength === 0) {
	// 	  userDetails.courses[i].progressPercentage = 100
	// 	} else {
	// 	  // To make it up to 2 decimal point
	// 	  const multiplier = Math.pow(10, 2)
	// 	  userDetails.courses[i].progressPercentage =
	// 		Math.round(
	// 		  (courseProgressCount / SubsectionLength) * 100 * multiplier
	// 		) / multiplier
	// 	}
	//   }
	// console.log("ha backenc ko abhi call aaya hai hhhhhhhggg ",userDetails)
	  if (!userDetails) {
		return res.status(400).json({
		  success: false,
		  message: `Could not find user with id: ${userDetails}`,
		})
	  }
	  return res.status(200).json({
		success: true,
		data: userDetails.courses,
	  })
	} catch (error) {
	  return res.status(500).json({
		success: false,
		message: error.message,
	  })
	}
  }


//   exports.instructorDashboard=async(req,res)=>{
// 	try{
// 		const courseDetails=await Course.find({instructor:req.user.id});

// 		const courseData=courseDetails.map((course)=>{
// 			const totalStudentEnrolled=Course.studentEnrolled.length
// 			const totalAmountGenerated=totalStudentEnrolled*course.price


// 			const xourseDataWith
// 		})

// 	}catch(error){
		
// 	}
//   }



exports.instructorDashboard = async (req, res) => {
	try {
		
	  const courseDetails = await Course.find({ instructor: req.user.id })
	 
	  const courseData = courseDetails.map((course) => {
		const totalStudentsEnrolled = course.studentsEnrolled.length
		const totalAmountGenerated = totalStudentsEnrolled * course.price
  
		// Create a new object with the additional fields
		const courseDataWithStats = {
		  _id: course._id,
		  courseName: course.courseName,
		  courseDescription: course.courseDescription,
		  // Include other course properties as needed
		  totalStudentsEnrolled,
		  totalAmountGenerated,
		}
  
		return courseDataWithStats
	  })
     console.log("qwdgrdb3rd3r",courseData)
	  res.status(200).json({ courses: courseData })
	} catch (error) {
	  console.error(error)
	  res.status(500).json({ message: "Server Error" })
	}
  }
//   exports.instructorDashboard = async (req, res) => {
// 	try {
		
// 		const id = req.user.id;

// 		const courseData = await Course.find({instructor:req.user.id});
		
// 		const courseDetails = courseData.map((course) => {
// 			totalStudents = course?.studentsEnrolled?.length;
// 			totalRevenue = course?.price * totalStudents;
// 			const courseDataWithStats = {
// 				_id: course._id,
// 				courseName: course.courseName,
// 				courseDescription: course.courseDescription,
// 				totalStudents,
// 				totalRevenue,
// 			};
// 			return courseDataWithStats;
			
// 		});
//           console.log("yaha sab hai ",courseDetails)
// 		res.status(200).json({
// 			success: true,
// 			message: "User Data fetched successfully",
// 			data: courseDetails,
// 		});
// 	} catch (error) {
// 		return res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// }
