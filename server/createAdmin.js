const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const User = require("./models/User");

const createAdmin = async () => {
    try {

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log("MongoDB connected");

        const existingAdmin =
            await User.findOne({
                email: "admin@myoney.com",
            });

        if (existingAdmin) {

            console.log(
                "Admin already exists."
            );

            process.exit(0);
        }

        const hashedPassword =
            await bcrypt.hash(
                "Admin@12345",
                12
            );

        const admin =
            await User.create({

                fullName: "Myoney Admin",

                email: "admin@myoney.com",

                phone: "9999999999",

                password: hashedPassword,

                phoneVerified: true,

                role: "admin",
            });

        console.log(
            "Admin created successfully!"
        );

        console.log(
            "Email: admin@myoney.com"
        );

        console.log(
            "Password: Admin@12345"
        );

        process.exit(0);

    } catch (error) {

        console.error(
            "Admin creation failed:",
            error
        );

        process.exit(1);
    }
};

createAdmin();