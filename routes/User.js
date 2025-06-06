const express = require("express");
const { signUp, login, sendOTP, changePassword } = require("../controllers/Auth");
const { auth } = require("../middlewares/auth");
const { resetPasswordToken, resetPassword } = require("../controllers/ResetPassword");
// const { updateDisplayPicture } = require("../controllers/Profile");
const router = express.Router();


router.post("/login", login);
router.post("/signup", signUp)
router.post("/sendotp", sendOTP)

router.post("/changepassword", auth, changePassword)



router.post("/reset-password-token", resetPasswordToken);
router.post("/reset-password", resetPassword);

module.exports = router;