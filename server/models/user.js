import { model, Schema } from "mongoose";
import Mongoose from "mongoose";
import bcrypt from 'bcrypt';
import status from "../enums/status";
import userType from "../enums/userType";
import paginate from "mongoose-paginate-v2";




const users = Schema(
    {
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        email: {
            type: String,
        },
        password: {
            type: String,
        },
        mobileNumber: {
            type: String,
        },
        userName: {
            type: String,
        },
        address: {
            type: String,
        },
        countryCode: {
            type: String,
        },
        dateOfBirth: {
            type: String,
        },
        otp: {
            type: String,
        },
        otpExpireTime: {
            type: Date,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isVerifiedEmail: {
            type: Boolean,
            default: false,
        },

        userType: {
            type: String,
            default: status.ACTIVE
        },
        status: {
            type: String,

            default: userType.USER
        },
        profileImage: {
            type: String
        }

    },
    { timestamps: true }
);
users.plugin(paginate);
module.exports = model("new-api", users);

Mongoose.model("new-api", users).findOne({ userType: "ADMIN" }).then((result) => {

    if (result) {
        console.log("Admin already present.")
    } else {
        let obj = {
            firstName: "node-",
            lastName: "admin",
            email: "node-admin@gmail.com",
            password: bcrypt.hashSync("admin@123", 10),
            mobileNumber: 7985853065,
            userName: "admin3064",
            address: "azamgarh",
            dateOfBirth: "28-06-2002",
            userType: "ADMIN",
            status: "ACTIVE",
            isVerified: "true",
            profileImage: "https://asset.cloudinary.com/df2ckvd8a/a97c5b7f18528ab71ae9c1bb4133191c",

        };
        Mongoose.model("new-api", users).create(obj).then((result1) => {
            if (result1) {
                console.log("Default admin created", result1);
            };
        }).catch((err1) => {
            if (err1) {
                console.log("Error while creating default admin", err1);
            }
        })
    }


})
