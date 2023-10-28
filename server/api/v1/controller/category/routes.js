import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth"


export default Express.Router()
    .post("/createCategory", auth.verifyToken, controller.createCategory)
    .put("/updateCategory", auth.verifyToken, controller.updateCategory)
