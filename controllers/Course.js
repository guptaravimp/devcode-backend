const Course = require("../models/Course");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const Category = require("../models/Category");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
exports.createCourse = async (req, res) => {
    try {
        // fetch data name, description
        // if instructor create the course then it offcorse that instructore4 already login
        const {courseName,
			courseDescription,
			whatYouWillLearn,
			price,
			tag,
			category,
			status,
			instructions,}=req.body;
        // const { courseName, courseDescription, whatYouWillLearn, price, Category } = req.body; // tag is objectid see model
        // getthumbnail
        const thumbnail = req.files.thumbnailImage;

        /// validation
        if (
			!courseName ||
			!courseDescription ||
			!whatYouWillLearn ||
			!price ||
			!tag ||
			!thumbnail ||
			!category || 
            !instructions
		) {
			return res.status(400).json({
				success: false,
				message: "All Fields are Mandatory",
			});
		}

        // check for instructor to get objectId of instructor as we declare in model of user..js
        const userId = req.user.id; // ass we store in payload 
        const instructorDetails = await User.findById(userId, {
			accountType: "Instructor",
		});
        console.log("Instructor Details: ", instructorDetails);
        /// todo verify the userid and instructor id same or not 
        /// instructor validation
        if (!instructorDetails) {
            return res.status(400).json({
                success: false,
                message: "Instructor detail Not found"
            })
        }
        console.log("Chal; raha hu mai ")
        // check given tag is valid or not 
        
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Category Details details not found",
            })
        }

        //// upload image to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        // create a entry for new course 
        const newCourse = await Course.create({
			courseName,
			courseDescription,
			instructor: instructorDetails._id,
			whatYouWillLearn: whatYouWillLearn,
			price,
			tag: tag,
			category: categoryDetails._id,
			thumbnail: thumbnailImage.secure_url,
			status: status,
			instructions: instructions,
		});

        /// add the newcorse to the User Schema of instructor
        await User.findByIdAndUpdate(
			{
				_id: instructorDetails._id,
			},
			{
				$push: {
					courses: newCourse._id,
				},
			},
			{ new: true }
		);

        /// update the category ka schema 
        await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					courses: newCourse._id,
				},
			},
			{ new: true }
		);
        // todo HW
        // return res
        return res.status(200).json({
            success: true,
            message: "Course created successfully",
            data: newCourse,
        });


    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "failed to create the course ",
            error: error.message
        })
    }
}




//// getall courses
exports.showAllCourses = async (req, res) => {
    try {
        const allCOurse = await Course.find({})
            //     ,{
            //     courseName:true,
            //     courseDescription:true,
            //     thumbnail:true,
            //     instructor:true,
            //     ratingAndReviews:true,
            //     studentEnrolled:true
            // }
            // )
            .populate("instructor").exec();
        return res.status(200).json({
            success: true,
            message: "Data for all Course fetched successfullly",
            data: allCOurse,
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "can not fetch course data ",
            error: error.message
        })
    }
}


// getcourse detail instructor wala
exports.getCourseDetails = async (req, res) => {
    try {
        // Extract courseId from request body
        const { courseId } = req.body;

        // Validation
        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
        }
        console.log("Maitheek to hu");
        // Fetch course details using findById (returns a single document)
        const courseDetails = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: { path: "additionalDetails" },
            })
            .populate("category")
            .populate({
                path: "courseContent",
                populate: { path: "subSection" },
            });

        console.log("Course details fetched successfully");
       
        // Check if course exists
        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Course not found with ID: ${courseId}`,
            });
        }
       
        // Return response
        return res.status(200).json({
            success: true,
            message: "Course details fetched successfully",
            data: courseDetails,
        });
        

    } catch (error) {
        console.error("Error fetching course details:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch course details",
            error: error.message,
        });
    }
};


exports.editCourse = async (req, res) => {
	try {
	  const { courseId } = req.body
	  const updates = req.body
	  const course = await Course.findById(courseId)
  
	  if (!course) {
		return res.status(404).json({ error: "Course not found" })
	  }
  
	  // If Thumbnail Image is found, update it
	  if (req.files) {
		console.log("thumbnail update")
		const thumbnail = req.files.thumbnailImage
		const thumbnailImage = await uploadImageToCloudinary(
		  thumbnail,
		  process.env.FOLDER_NAME
		)
		course.thumbnail = thumbnailImage.secure_url
	  }
  
	  // Update only the fields that are present in the request body
	  for (const key in updates) {
		if (updates.hasOwnProperty(key)) {
		  if (key === "tag" || key === "instructions") {
			course[key] = JSON.parse(updates[key])
		  } else {
			course[key] = updates[key]
		  }
		}
	  }
  
	  await course.save()
  
	  const updatedCourse = await Course.findOne({
		_id: courseId,
	  })
		.populate({
		  path: "instructor",
		  populate: {
			path: "additionalDetails",
		  },
		})
		.populate("category")
		.populate("ratingAndReviews")
		.populate({
		  path: "courseContent",
		  populate: {
			path: "subSection",
		  },
		})
		.exec()
  
	  res.json({
		success: true,
		message: "Course updated successfully",
		data: updatedCourse,
	  })
	} catch (error) {
	  console.error(error)
	  res.status(500).json({
		success: false,
		message: "Internal server error",
		error: error.message,
	  })
	}
  }


  exports.getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id
        
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 })
    
      // Return the instructor's courses
      res.status(200).json({
        success: true,
        data: instructorCourses,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
      })
    }
  }
 


  exports.deleteCourse = async (req, res) => {
    try {
      const { courseId } = req.body
  
      // Find the course
      const course = await Course.findById(courseId)
      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentsEnrolled
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        })
      }
  
      // Delete sections and sub-sections
      const courseSections = course.courseContent
      for (const sectionId of courseSections) {
        // Delete sub-sections of the section
        const section = await Section.findById(sectionId)
        if (section) {
          const subSections = section.subSection
          for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId)
          }
        }
  
        // Delete the section
        await Section.findByIdAndDelete(sectionId)
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId)
  
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
    }
  }




  exports.getFullCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const userId = req.user.id
      const courseDetails = await Course.findOne({
      _id: courseId,
      })
      .populate({
        path: "instructor",
        populate: {
        path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
        path: "subSection",
        },
      })
      .exec()
  
      
      let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userID: userId,
      })
    
    
      if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
      }
    
      
    
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds;
      })
      })
    
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
    
      return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
        ? courseProgressCount?.completedVideos
        : ["none"],
      },
      })
    } catch (error) {
      return res.status(500).json({
      success: false,
      message: error.message,
      })
    }
    }
  
  
