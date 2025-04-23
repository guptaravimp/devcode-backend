const Section = require("../models/Section")
const Course = require("../models/Course")
exports.createSection = async (req, res) => {
    try {
        // datafetch
        //// when we create course course id is created automatically
        const { sectionName, courseId } = req.body;
        // validation
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Missing properties "
            })
        }
        // console.log("Ha create section controller call hua hai ")
        
        // section create 
        const newSection = await Section.create({ sectionName })
        // update course schema with section objectId(push in courseContent)
        const updatedCourseDetails = await Course.findByIdAndUpdate(courseId,
            {
                $push: {
                    courseContent: newSection._id,
                }
            },
            { new: true }
        ).populate({
            path: "courseContent",
            populate: {
                path: "subSection", // Nested populate
            }
        });
        // HW:use populate to replace section/subsection both in the updatedCourseDetails
        console.log(updatedCourseDetails)
        // console.log("dekhlo ",updatedCourseDetails[0].sectionName)
        /// return response 
        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updatedCourseDetails,
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "unable to create section please try again ",
        })

    }

}


/// update section
exports.updateSection = async (req, res) => {
    try {
        // fetch data 
        const { sectionName, sectionId,courseId } = req.body;
        // validation 
        if (!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Missing properties "
            })
        }
        // update data
        const course =await Course.findById(courseId).populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            },
                
            
        })
        const section = await Section.findByIdAndUpdate(sectionId, {
            sectionName
        }, { new: true });
        // returern response 
        return res.status(200).json({
            success: true,
            message: "Section updated  successfully",
            data:course,
        })



    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Section not updated ",
        })
    }
}


/// delete section 
exports.deleteSection = async (req, res) => {
	try {
		const { sectionId,courseId } = req.body;
		await Section.findByIdAndDelete(sectionId);
		const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();
		res.status(200).json({
			success: true,
			message: "Section deleted",
			updatedCourse,
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
// exports.deleteSection = async (req, res) => {
//     try {
//         // getId( let see using parameter)-> assuming that we are sending id in params 
//         const {sectionId,courseId}=req.params
//         await Course.findByIdAndUpdate(courseId)
//         // use findbyidanddelete
//         await Section.findByIdAndDelete(sectionId);

//         // tODO{TESTING]}: DO WE NEED TO DELETE ENTRY FROM COURSE SCHEMA 
//         // return res
//         return  res.status(200).json({
//             success:true,
//             message:"Section deleted successfully"
//         })
       
        



//     } catch (error) {
//         return  res.status(500).json({
//             success:false,
//             message:"Section deleted failed"
//         })
//     }
// }

