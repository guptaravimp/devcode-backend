const express = require("express")
const { auth } = require("../middlewares/auth");
const { SendContactEmail } = require("../controllers/Contactus");
const router = express.Router()
router.post("/contactus",auth, SendContactEmail);


module.exports=router;