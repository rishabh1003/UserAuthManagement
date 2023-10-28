import categoryModel from "../../../models/category"
import shopModel from "../../../models/shop"
import userModel from "../../../models/user"
import userType from "../../../enums/userType";


module.exports = {

    findAdmin: async (id) => {
        const admin = await userModel.findOne({ $and: [{ _id: id }, { userType: userType.ADMIN }] });
        return admin;
    },
    createCategory: async (obj) => {
        const createdCategory = await categoryModel.create(obj);
        return createdCategory;
    },
    findShop: async (id) => {
        const result = await shopModel.findOne(id);
        return result;
    },
    updateCategory: async (id, obj) => {
        const updated = await categoryModel.findByIdAndUpdate(id, obj,{new:true});
        return updated;
    },
    findCategory: async(id)=>{
        const categoryResult= await categoryModel.findOne(id);
        return categoryResult;

    }



} 