import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth"

export default Express.Router()
.post('/userSignUp', controller.userSignup)
.put('/otpVerification',controller.otpVerification)
.put('/resendOtp',controller.resendOtp)
.post('/userLogin',controller.userLogin)
.get("/getProfile",auth.verifyToken,controller.getProfile)
.put("/userEditProfile",auth.verifyToken,controller.userEditProfile) 
.post("/emailVerification",auth.verifyToken,controller.emailVerification)
.put("/verififcationLink/:id",controller.verififcationLink)
.put("/reSetPassword",auth.verifyToken,controller.reSetPassword)
.put("/updateProfilePhoto",auth.verifyToken,controller.updateProfilePhoto)
.get("/qrcodeGeneration",auth.verifyToken,controller.qrcodeGeneration)
.get("/twoFa",controller.twoFa)
.post("/twoFaVerification" ,controller.twoFaVerification)
.post("/cronJob",auth.verifyToken,controller.cronJob)




