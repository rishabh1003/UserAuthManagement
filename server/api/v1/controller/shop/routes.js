import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth"


export default Express.Router()
.post("/createShop",auth.verifyToken,controller.createShop)
.delete("/deleteShop",auth.verifyToken,controller.deleteShop)
.put("/updateShop",auth.verifyToken,controller.updateShop)
.get("/getShop",auth.verifyToken,controller.getShop)
