const Category = require("../models/Category");
const Course = require("../models/Course");

/// create tag handler function
exports.createCategory=async (req,res)=>{
    try{
        // fetch data 
        const {name,description}=req.body;
        // validation 
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:"all fiel are required "
            })
        }
        /// create a entry in db
        const tagDetails=await Category.create({
            name:name,
            description:description,
        })
        console.log(tagDetails)
        // return response 
        return res.status(200).json({
            success:true,
            message:"tag created successfully"
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}


// getall tag to show in dropdown on ui 
exports.showAllCategories=async (req,res)=>{
    try{
        // ensure name and description is not null
        const allTags=await Category.find({},{name:true,description:true})
        res.status(200).json({
            success:true,
            message:"All tags return suuceessfully",
            allTags
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}
// show all the curse in a particular cateory
// exports.categoryPageDetails=async(req,res)=>{
//     try{
//         // get cateogy id 
//         const {categoryId}=req.body;
//         // get course for specified course 
//         const selectedCategory=Category.findById(categoryId);
//         // .populate("courses")
//         // .exec();
//         // validation 
//         console.log("selected categopry is ",selectedCategory)
//         if(!selectedCategory){
//             return res.status(404).json({
//                 success:false,
//                 message:"Selected category Not found "
//             })
//         }
//                 // get courses from different courses 
//         const differentCategories=await Category.find({_id:{$ne:categoryId}})
//         .populate("course").exec();   // get different category whose id is not equal to category id 

//         /// get top 10 selling courses 
// 		const allCategories = await Category.find().populate({path:"courses",match:{status:"Published"},populate:([{path:"instructor"},{path:"ratingAndReviews"}])});
// 		const allCourses = allCategories.flatMap((category) => category.courses);
// 		const mostSellingCourses = allCourses
// 			.sort((a, b) => b.sold - a.sold)
// 			.slice(0, 10);
//         // return courses 
//         return res.status(404).json({
//             success:true,
//             data:{
//                 selectedCategory,
//                 differentCategories,
//                 mostSellingCourses
//             }
//         })

//     }catch(error){
//         console.log(error)
//         return res.status(500).json({
//             success:false,
//             message:"category Not found  "
//         })
//     }
// }



exports.categoryPageDetails = async (req, res) => {
	try {
        
		const { categoryId } = req.body;
        console.log("category Id is ",categoryId)
		// Get courses for the specified category
		const selectedCategory = await Category.findById(categoryId)          //populate instuctor and rating and reviews from courses
			.populate({path:"courses"})
			.exec();
		console.log("selected category is  id ",selectedCategory);
		// Handle the case when the category is not found
		if (!selectedCategory) {
			console.log("Category not found.");
			return res
				.status(404)
				.json({ success: false, message: "Category not found" });
		}
		// Handle the case when there are no courses
		if (selectedCategory.courses.length === 0) {
			console.log("No courses found for the selected category.");
			return res.status(404).json({
				success: false,
				message: "No courses found for the selected category.",
			});
		}

		const selectedCourses = selectedCategory.courses;

		// Get courses for other categories
        console.log("delected course3er32r23r3rrrrrffffffffffffffffff",selectedCourses)
		const categoriesExceptSelected = await Category.find({
			_id: { $ne: categoryId },
		}).populate({path:"courses",match:{status:"Published"},populate:([{path:"instructor"},{path:"ratingAndReviews"}])});
		let differentCourses = [];
		for (const category of categoriesExceptSelected) {
			differentCourses.push(...category.courses);
		}

		// Get top-selling courses across all categories
		const allCategories = await Category.find().populate({path:"courses",match:{status:"Published"},populate:([{path:"instructor"},{path:"ratingAndReviews"}])});
		const allCourses = allCategories.flatMap((category) => category.courses);
		const mostSellingCourses = allCourses
			.sort((a, b) => b.sold - a.sold)
			.slice(0, 10);

		res.status(200).json({
			selectedCourses: selectedCourses,
			differentCourses: differentCourses,
			mostSellingCourses: mostSellingCourses,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};