
const mongoose = require("mongoose");

require("dotenv");

exports.dbConnect = () => {
	mongoose
		.connect(process.env.DATABASE_URL)
		.then(() => console.log("Database connection successfull"))
		.catch((err) => {
			console.log(`DB CONNECTION ISSUES`);
			console.error(err.message);
			process.exit(1);
		});
};

// module.exports = dbConnect;