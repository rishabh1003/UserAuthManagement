import userModel from "../../../models/user"
import status from "../../../enums/status";

const userServices = {
  checkUserExists: async (email, mobileNumber) => {
    let query = { $and: [{ status: { $ne: status.DELETE } }, { $or: [{ email: email }, { mobileNumber: mobileNumber }] }] }
    return await userModel.findOne(query);
  },
  createUser: async (insertObj) => {
    return await userModel.create(insertObj);
  },
  findUser: async (email) => {
    return await userModel.findOne({ $and: [{ email: email }, { status: { $ne: status.DELETE } }] });
  },
  findUserById: async (id) => {
    return await userModel.findOne({ $and: [{ _id: id }, { status: { $ne: status.DELETE } }] });
  },
  updateUserById: async (query, obj) => {
    return await userModel.findByIdAndUpdate(query, obj, { new: true });
  },
  findAll: async () => {
    return await userModel.find()
  },
  findAdmin: async (query) => {
    return await userModel.findOne(query);
  },
  paginate: async (query, page, limit) => {
    try {
      const options = {
        page: parseInt(page) || parseInt(1),
        limit: parseInt(limit) || parseInt(5),
      };
      const data = await userModel.paginate(query, options)
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
}
module.exports = userServices;