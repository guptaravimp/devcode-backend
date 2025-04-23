const RatingAndReview = require("../models/RatingAndReview")
const Course = require("../models/Course")



/// create rating 
exports.createRating = async (req, res) => {
    try {
        // get userid 
        const userId = req.user.id; // as we sent in payload of auth middleware as user is login so we can access it 
        // fetch data from req.body
        const { rating, review, courseId } = req.body;
        // check if user is enrolled or not 
        const courseDetails = await Course.findOne(
            {
                _id: courseId,
                studentEnrolled: { $elemMatch: { $eq: userId } }  // eq-> equal, elemMatch i.e function 
            }
        );
        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "User is not enrolled in the course "
            })
        }
        // user already reviewed the course or not 
        const alreadyReviewed = await RatingAndReview.findOne(
            { user: userId, course: courseId }
        )
        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: "course is already reviewed by user"
            })
        }
        // craete a rating
        const ratingReview = RatingAndReview.create({ rating, review, course: courseId, user: userId });
        // update  this rating in that course 
        const updatedCourseDetails = await Course.findByIdAndUpdate({ _id: courseId }, {
            $push: {
                ratingAndReviews: ratingReview._id,
            }
        }, { new: true })
        console.log(updatedCourseDetails);
        // return response 
        return res.status(200).json({
            success: true,
            message: "Rating and review created successfully".
                ratingReview
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Rating and review not created  successfully"
        })
    }
}



///  get average rating 
exports.getAverageRating = async (req, res) => {
    try {
        /// get course id
        const courseId = req.body.courseId;
        // calculate average rating 
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId)  // means course include courseId return this using match
                }
            }, {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" }  // rating ka average
                }
            }
        ])
        // return rating 
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            })
        }
        return res.status(200).json({
            success:true,
            message:"Average rating is 0 No Rating given till Now",
            averageRating:0,
        })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: " Average Rating and review not created  successfully"
        })
    }
}

// getAllRatingandReviews
exports.getAllRating=async(req,res)=>{
    try{
        const allReviews=await RatingAndReview.find({})
        .sort({rating:"desc"})
        .populate({
            path:"user",
            select:"firstName lastName email image"
        })
        .populate({
            path:"course",
            select:"courseName"
        })
        .exec();
        return res.status(200).json({
            success:true,
            message:"Al; reviws fetched successfull",
            detail:allReviews,
        })

    }catch(error){

    }
}
