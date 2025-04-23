const jwt=require("jsonwebtoken");
require("dotenv").config();
const User=require("../models/User");
// auth 
exports.auth=async(req,res,next)=>{
    try {
		// Extracting JWT from request cookies, body or header
       
		const token =
			req.cookies.token ||
			req.body.token ||
			req.header("Authorization").replace("Bearer ", "");
     
		// If JWT is missing, return 401 Unauthorized response
		if (!token) {
			return res.status(401).json({ success: false, message: `Token Missing` });
		}
        
		try {
			// Verifying the JWT using the secret key stored in environment variables
			const decode = jwt.verify(token, process.env.JWT_SECRET);
			console.log("decode is ", decode);
			// Storing the decoded JWT payload in the request object for further use
			req.user = decode;
		} catch (error) {
			// If JWT verification fails, return 401 Unauthorized response
			return res
				.status(401)
				.json({ success: false, message: "token is invalid" });
		}
        console.log(" I am DOnr bro",token)
		// If JWT is valid, move on to the next middleware or request handler
		next();
	} catch (error) {
		// If there is an error during the authentication process, return 401 Unauthorized response
		return res.status(401).json({
			success: false,
			message: `Something Went Wrong While Validating the Token`,
		});
	}
    // try{
    //     // extract token 
    //     console.log("start ho gaya hu token yhai hai  caklll aa raha hai auth ko ")
    //     const token =
	// 		req.cookies.token ||
	// 		req.body.token ||
	// 		req.header("Authorization")?.replace("Bearer ", "")
       
    //     console.log("Extracted token:", token);

     
    //     // iftoken is missing 
    //     if(!token){
    //         return res.status(401).json({
    //             success:false,
    //             message:"Token is missing "
    //         })
    //     }
    //     /// verify the token 
    //     try{
            
    //        const decode=await jwt.verify(token,process.env.JWT_SECRET);
    //        console.log("Authentication running...")
    //        console.log(decode);
    //        req.user=decode;
    //     }catch(error){
    //           ///// token issue 
    //           return res.status(401).json({
    //             success:false,
    //             message:"Token is invalid "
    //         })
    //     }
        
    //     next();
    // }catch(error){
    //     return res.status(401).json({
    //         success:false,
    //         message:"Something went wrong via validating the token"
    //     })
    // }
}



// isstudent
exports.isStudent=async(req,res,next)=>{
      try{
          if(req.user.accountType!=="Student"){
            return res.status(400).json({
                success:false,
                message:"This is a protected routes for student "
            })
          }
          next();
      }catch(error){
        return res.status(500).json({
            success:false,
            message:"User role is not matching "  
        })
      }
}




// is admin
exports.isAdmin=(req,res,next)=>{
    try{
        /// access role from stored payload in req.user
        if(req.user.accountType!=="Admin"){
            return res.status(400).json({
                success:false,
                message:"This is a protected routes for Admin "
            })
        }
        next();
    }catch(error){
      return res.status(500).json({
        success:false,
    message:"User role is not matching "  
    })
    }
}



// isInstructor
exports.isInstructor=async(req,res,next)=>{
    try{
       console.log("Instructor ko call ja raha hai ")
        if(req.user.accountType!=="Instructor"){
            console.log(req.user.accountType)
          return res.status(400).json({
              success:false,
              message:"This is a protected routes for Instructor "
          })
        }
        next();
    }catch(error){
      return res.status(500).json({
          success:false,
          message:"User role is not matching "  
      })
    }
}