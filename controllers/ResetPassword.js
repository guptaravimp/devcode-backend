const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const bcrypt = require('bcrypt')
const crypto = require("crypto");

/// reset password token 
exports.resetPasswordToken = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `This Email: ${email} is not registered with us. Please enter a valid email.`,
            });
        }

        // Generate reset token
        const token = crypto.randomBytes(20).toString("hex");
        // Update user with reset token and expiration
        const updatedDetails = await User.findOneAndUpdate(
            { email },
            {
                token,
                resetPasswordExpires: Date.now() + 3600000, // 1 hour expiration
            },
            { new: true }
        );

        console.log("DETAILS:", updatedDetails);

        // Password reset link
        const url = `http://localhost:3001/update-password/${token}`;

        // Send email with reset link
        await mailSender(
            email,
            "Password Reset",
            `Your link for email verification is ${url}. Please click this link to reset your password.`
        );

        return res.status(200).json({
            success: true,
            message: "Email sent successfully. Please check your email to continue further.",
        });
    } catch (error) {
        console.error("Error in resetPasswordToken:", error);
        return res.status(500).json({
            success: false,
            message: "Some error occurred while sending the reset message.",
            error: error.message,
        });
    }
};
// exports.resetPasswordToken = async (req, res) => {
// 	try {
// 		const email = req.body.email;
// 		const user = await User.findOne({ email: email });
// 		if (!user) {
// 			return res.json({
// 				success: false,
// 				message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
// 			});
// 		}
// 		const token = crypto.randomBytes(20).toString("hex");

// 		const updatedDetails = await User.findOneAndUpdate(
// 			{ email: email },
// 			{
// 				token: token,
// 				resetPasswordExpires: Date.now() + 3600000,
// 			},
// 			{ new: true }
// 		);
// 		console.log("DETAILS", updatedDetails);

// 		const url = `http://localhost:3000/update-password/${token}`;

// 		await mailSender(
// 			email,
// 			"Password Reset",
// 			`Your Link for email verification is ${url}. Please click this url to reset your password.`
// 		);

// 		res.json({
// 			success: true,
// 			message:
// 				"Email Sent Successfully, Please Check Your Email to Continue Further",
// 		});
// 	} catch (error) {
// 		return res.json({
// 			error: error.message,
// 			success: false,
// 			message: `Some Error in Sending the Reset Message`,
// 		});
// 	}
// };

// exports.resetPasswordToken = async (req, res) => {
//     try {
       
//         /// get email from req.body
//         const email = req.body.email;
		
//         /// check user for this email or validation etc
//         const user = await User.findOne({ email: email });
//         console.log(user)
//         if (!user) {
// 			return res.json({
// 				success: false,
// 				message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
// 			});
// 		}
//         /// generate token(using crypto random uid)
//         // const token = randomUUID();
//         // Generate token and hash it
//         const resetToken = crypto.randomBytes(20).toString("hex");
//         const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

//         // Update user with token & expiry
//         user.token = hashedToken;
//         user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
//         await user.save();
//         // const token = crypto.randomBytes(20).toString("hex");
//         console.log(" ia mam  running")
//         // // update user by updating tkoen and expiration time (add the token and resetexpire in model type string )
//         // const updatedDetails = await User.findOneAndUpdate(
// 		// 	{ email: email },
// 		// 	{
// 		// 		token: token,
// 		// 		resetPasswordExpires: Date.now() + 3600000,
// 		// 	},
// 		// 	{ new: true }
// 		// );
//         // create url
       
//         const url = `http://localhost:3000/update-password/${token}` // we will write in routes folder to handle this url 
//         // send email containg the url 
//         await mailSender(email, "Password reset link", `Password reset link:${url}`);
//         // return response 
//         return res.json({
//             success: true,
//             message: "Email Sent successfully Please check email and change password ",
//             data:updatedDetails
//         })


//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: "Something went rong while reset password "
//         })
//     }


// }
// reset password 
exports.resetPassword = async (req, res) => {
    try {
      const { password, confirmPassword, token } = req.body;
  
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match",
        });
      }
  
      console.log("Reset password called with token: ", token);
  
      const userDetails = await User.findOne({ token: token });
  
      if (!userDetails) {
        return res.status(404).json({
          success: false,
          message: "Invalid token or user does not exist",
        });
      }
  
      if (new Date(userDetails.resetPasswordExpires) < new Date()) {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please request a new password reset.",
        });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await User.findOneAndUpdate(
        { token: token },
        {
          password: hashedPassword,
          token: null,
          resetPasswordExpires: null,
        },
        { new: true }
      );
  
      return res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong while resetting the password",
      });
    }
  };
  
// exports.resetPassword = async (req, res) => {
//     try {
//         // data fetch
//         const { password, confirmPassword, token } = req.body;
//         // validation
//         if (password != confirmPassword) {
//             return res.status(400).json({ success: false, message: "Password not matching" })
//         }
//         console.log("mujhe call kiya ja raha hai")
//         // get userdetails from db using token 
//         const userDetails = await User.findOne({ token: token });
        
//         // if no entry-invalid token 
//         if (!userDetails) {
//             return res.status(404).json({ success: false, message: "User not found" })
//         }
//         // token time check I mean expiry check 
//         if (userDetails.resetPasswordExpires < Date.now()) {
//             return res.status(401).json({ success: false, message: "Token expired" })
//         }
//         // hash pasword 
//         const hashedPassword = await bcrypt.hash(password, 10);
//         // password update 
//         await User.findOneAndUpdate(
//             { token: token },
//             {
//               password: hashedPassword,
//               token: null,
//               resetPasswordExpires: null
//             },
//             { new: true }
//           )
          
//         // return response 
//         return res.status(200).json({
//             success: true,
//             message: "Password reset successfully"
//         })
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: "Something went rong while reset password "
//         })
//     }

// }