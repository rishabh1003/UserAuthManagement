import categoryModel from "../../../models/category";
import shopModel from "../../../models/shop";
import userModel from "../../../models/user";
import productModel from "../../../models/product";
import userType from "../../../enums/userType";

module.exports = {
    findUser: async (id) => {
        const query = await userModel.findOne({
            $and: [{ _id: id }, { userType: { $in: userType.ADMIN } }],
        });
        return query;
    },
    findCategoryById: async (id) => {
        return await categoryModel.findOne({ _id: id });
    },
    createProduct: async (obj) => {
        const categorycreated = await productModel.create(obj);
        return categorycreated;
    },
    findProductById: async (id) => {
        return await productModel.findOne({ _id: id });
    },
    deleteProduct: async (id) => {
        return await productModel.findByIdAndDelete({ _id: id });
    },
    updateProduct: async (id, query) => {
        return await productModel.findByIdAndUpdate(id, query, { new: true });
    },
    populateProduct: async (id) => {
        return await productModel
            .findOne({ _id: id }, { createdAt: 0, updatedAt: 0 })
            .populate({
                path: "categoryId",
                select: "-createdAt -updatedAt",
                populate: {
                    path: "shopId",
                    select: "-createdAt -updatedAt",
                },
            });
    },
    productList: async (id) => {
        return await productModel
            .find({}, { createdAt: 0, updatedAt: 0 })
            .populate({
                path: "categoryId",
                select: "-createdAt -updatedAt",
                populate: {
                    path: "shopId",
                    select: "-createdAt -updatedAt",
                },
            });
    },
    paginate: async (query, page, limit) => {
        try {
            const options = {
                page: parseInt(page) || parseInt(1),
                limit: parseInt(limit) || parseInt(5),
            };
            const data = await productModel.paginate(query, options);
            return data;
        } catch (error) {
            console.log(error);
            return error;
        }
    },
    //lookup,unwind,project
    lookups: async (query) => {

        const aggregates = ([
            {
                $match: { productName: { $regex: `^[^\\d\\s]*${query}` } }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "categoryId"
                },
            },
            { $unwind: { path: "$categoryId", preserveNullAndEmptyArrays: true } },
            {
                "$lookup": {
                    from: "shops",
                    localField: "categoryId.shopId",
                    foreignField: "_id",
                    as: "categoryId.shopId"
                }
            },
            { $unwind: { path: "$shopId", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    "createdAt": 0,
                    "updatedAt": 0,
                    "categoryId.createdAt": 0,
                    "categoryId.updatedAt": 0,
                    "categoryId.shopId.updatedAt": 0,
                    "categoryId.shopId.createdAt": 0,
                }
            },
        ])
        return await productModel.aggregate(aggregates);
    }
};
