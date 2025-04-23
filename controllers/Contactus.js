const { contactUsEmail } = require("../mail/contactFormRes");
const mailSender = require("../utils/mailSender");

exports.SendContactEmail = async (req, res) => {
    try {
        const { email, firstName, lastName, message, phoneNo } = req.body;

        if (!firstName || !email || !message) {
            return res.status(403).json({
                success: false,
                message: "All fields are required.",
            });
        }
console.log("Mai chala ")
        try {
            // Send mail to user
            const userMailResponse = await mailSender(
                email,
                "Received response",
                contactUsEmail(email, firstName, lastName, message, phoneNo)
            );

            // Send mail to admin
            const adminMailResponse = await mailSender(
                process.env.MAIL_USER,
                "User Response to Admin",
                contactUsEmail(email, firstName, lastName, message, phoneNo)
            );

            // Check if both emails were sent successfully
            if (userMailResponse && adminMailResponse) {
                return res.status(200).json({
                    success: true,
                    message: "Email successfully sent to user and admin.",
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Failed to send contact response.",
                });
            }
        } catch (error) {
            console.error("Mail Sending Error:", error);
            return res.status(500).json({
                success: false,
                message: "Mail not sent due to an error.",
            });
        }
    } catch (error) {
        console.error("Internal Server Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};
