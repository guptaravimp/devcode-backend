const SubSection = require("../models/SubSection")
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/ImageUploader");
const Course = require("../models/Course");
// create subsection 
exports.createSubSection = async (req, res) => {
    try {
        
        // fetch data (section id comes from section because we are creating subsection after creation of section and if section already created then id is also created okkkkkay)
        const { sectionId, title, timeDuration, description } = req.body;
        //extract file video
         
        const video = req.files.video;
        
        if(!video ){
            return res.status(404).json({
                success:false,
                message:"video detail notf ound "
            })
        }
        
       
        const sectiondetail=await Section.findById(sectionId);
      
        if(!sectiondetail){
            return res.status(404).json({
                success:false,
                message:"section detail is rong "
            })
        }
        
        // validation 
        if (!sectionId || !title || timeDuration || !description ) {
            return res.status(400).json({
                success: false,
                message: "All fieldf are required"
            })
        }
        // upload video to cloudinary 
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        // create a subsection 
       
        const SubSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })
        // insert subsection id into section as it is refence in model 
        const updatedSection = await Section.findByIdAndUpdate({ _id: sectionId }, {
            $push: {
                subSection: SubSectionDetails._id,
            }
        }, { new: true }).populate("subSection");
        /// HW; Log updated section here after adding populate query
        // return res
        console.log("updated subsection is ",updatedSection)
        return res.status(200).json({
            success: true,
            message: "Sub Section created successfully ",
            updatedSection
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Sub Section created failed  "
        })
    }
}



// HW; update Subsection
// delete subsection 
// UPDATE a sub-section
exports.updateSubSection = async (req,res) => {

	try {
		// Extract necessary information from the request body
		const { SubsectionId, title , description,courseId } = req.body;
		const video = req?.files?.videoFile;

		
		let uploadDetails = null;
		// Upload the video file to Cloudinary
		if(video){
		 uploadDetails = await uploadImageToCloudinary(
			video,
			process.env.FOLDER_VIDEO
		);
		}

		// Create a new sub-section with the necessary information
		const SubSectionDetails = await SubSection.findByIdAndUpdate({_id:SubsectionId},{
			title: title || SubSection.title,
			// timeDuration: timeDuration,
			description: description || SubSection.description,
			videoUrl: uploadDetails?.secure_url || SubSection.videoUrl,
		},{ new: true });

		
		const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();
		// Return the updated section in the response
		return res.status(200).json({ success: true, data: updatedCourse });
	} catch (error) {
		// Handle any errors that may occur during the process
		console.error("Error creating new sub-section:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}

}


exports.deleteSubSection = async(req, res) => {

	try {
		const {subSectionId,courseId} = req.body;
		const sectionId=req.body.sectionId;
	if(!subSectionId || !sectionId){
		return res.status(404).json({
            success: false,
            message: "all fields are required",
        });
	}
	const ifsubSection = await SubSection.findById({_id:subSectionId});
	const ifsection= await Section.findById({_id:sectionId});
	if(!ifsubSection){
		return res.status(404).json({
            success: false,
            message: "Sub-section not found",
        });
	}
	if(!ifsection){
		return res.status(404).json({
            success: false,
            message: "Section not found",
        });
    }
	await SubSection.findByIdAndDelete(subSectionId);
	await Section.findByIdAndUpdate({_id:sectionId},{$pull:{subSection:subSectionId}},{new:true});
	const updatedCourse = await Course.findById(courseId).populate({ path: "courseContent", populate: { path: "subSection" } }).exec();
	return res.status(200).json({ success: true, message: "Sub-section deleted", data: updatedCourse });
		
	} catch (error) {
		// Handle any errors that may occur during the process
        console.error("Error deleting sub-section:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
		
	}
};