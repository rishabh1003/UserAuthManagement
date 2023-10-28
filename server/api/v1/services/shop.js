import shopModel from "../../../models/shop"
import userModel from "../../../models/user"
import categoryModel from "../../../models/category"
import userType from "../../../enums/userType";
import status from "../../../enums/status";
const shopServices = {
    createShop: async (obj) => {
        const created = await shopModel.create(obj);
        return created;
    },
    findAdmin: async (id) => {
        const admin = await userModel.findOne({ $and: [{ _id: id }, { userType: userType.ADMIN }] });
        return admin;
    },
    deleteShop: async (id) => {
        const deletedShop = await shopModel.findByIdAndDelete(id);
        return deletedShop;
    },
    updateShop: async (id, obj) => {
        const updated = await shopModel.findByIdAndUpdate(id, obj);
        return updated;
    },
    findCategory: async (id) => {
        const category = await categoryModel.findOne(id);
        return category;

    },
    findUserDetails: async (id) => {
        const query = {$and:[{_id:id }, { status: status.ACTIVE }]};
        const userDetails = await userModel.findOne(query);
        return userDetails;
    },
    geonear: async (query) => {
        const result = await shopModel.aggregate(query);
        console.log(result);
        return result;
    }







}
module.exports = shopServices;