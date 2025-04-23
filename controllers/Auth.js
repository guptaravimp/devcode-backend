const User = require("../models/User")
const bcrypt = require("bcrypt");
const OTP = require("../models/OTP")
const otpGenerator = require("otp-generator")
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const Profile = require("../models/Profile");
require("dotenv").config();
// sendotp verification 
exports.sendOTP = async (req, res) => {
    try {

        /// fetch email
        const { email } = req.body;

        /// check user exist or not 
        const checkUserPresent = await User.findOne({ email })
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User already exist"
            })
        }
        /// generate otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        //  check unique otp or not 
        const result = await OTP.findOne({ otp: otp });
        // while we didinot find unique generate till 
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({ otp: otp });
        }
        /// db save data 
        const otpPayload = { email, otp };
        // create a entry in db 
        const otpBody = await OTP.create(otpPayload);
        console.log("Otp created in db")
        console.log(otpBody);
        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

}
// signup

exports.signUp = async (req, res) => {
    try {
        // data fetch from request ki body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;
        // validate karlo.
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(401).json({
                success: false,
                message: "All fied are required "
            })
        }
        // 2 password match karlo
        if (password !== confirmPassword) {
            return res.status(401).json({
                success: false,
                message: "password not match with confirm passsword  "
            })
        }
        // check user already exist or not 
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists  "
            })
        }
        // find most recent otp stored for the user 
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
        console.log(recentOtp);
        /// validation of otp
        if (recentOtp.length == 0) {
            return res.status(400).json({
                success: false,
                message: 'otp not found'
            })
        } else if (otp !== recentOtp[0].otp) {
            // invalid otp
            return res.status(400).json({
                success: false,
                message: "Invalid otp"
            })
        }
        /// hashes passsword 
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (error) {
            console.log(error)
            return res.status(400).json({
                success: false,
                message: "Password hashing failed "
            })
        }

        const profileDetails = await Profile.create({ gender: null, dateOfBirth: null, about: null, contactNumber: null })
        const user = await User.create({
            firstName, lastName, email, contactNumber, password: hashedPassword, accountType, additionalDetails: profileDetails,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        })
        return res.status(200).json({
            success: true,
            message: "User is registered Successfully",
            user,
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "User is Not registered please try again",
        })
    }

}


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: "All field are required "
            })
        }
        const user =await User.findOne({ email }).populate("additionalDetails");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User is not registed please signup first"
            })
        }

        if (await bcrypt.compare(password,user.password)) {
            const payload = {
                email: user.email,
                id: user.id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h",
            })
            user.token = token;
            user.password = undefined;
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "User loged in  successfully"
            })
        } else {
            res.status(403).json({
                success: false,
                message: "Password incorrect"
            })
        }



    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Login failure"
        })
    }
}

exports.changePassword = async (req, res) => {
    try {
        const userDetails = await User.findById(req.user.id);
        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const { oldPassword, newPassword, confirmNewPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect old password",
            });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password cannot be the same as old password",
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "New password and confirm password do not match",
            });
        }

        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.user.id, { password: encryptedPassword });

        try {
            const emailResponse = await mailSender(
                userDetails.email,
                "devcode-Password Updated ",
                passwordUpdated(
                    userDetails.email,
                    `Password updated successfully for ${userDetails.firstName} ${userDetails.lastName}`
                ),

            );
            console.log(emailResponse);

        } catch (error) {
            console.error("Error sending email:", error);
        }


        // return response 
        return res.status(200).json({
            success: true,
            messager: "Password updated successfully"
        })




    } catch (error) {

        console.error(error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
    }

}