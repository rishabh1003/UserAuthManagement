import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth"

export default Express.Router()
    .post("/adminLogin", controller.adminLogin)
    .put("/adminResetPassword", auth.verifyToken, controller.adminResetPassword)
    .get("/paginateAlluserList", controller.paginateAlluserList)
