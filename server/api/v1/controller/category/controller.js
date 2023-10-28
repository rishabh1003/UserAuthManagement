import successResponse from "../../../../../assets/response";
import responseMessages from "../../../../../assets/responseMessages";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
import apiError from "../../../../helper/apiError";
import commonFunction from "../../../../helper/utils";
import categoryServices from "../../services/category";
import Joi from "joi"
import mongoose from "mongoose"

const { findAdmin, createCategory, findShop, updateCategory, findCategory } = categoryServices;
export class categoryController {

    async createCategory(req, res, next) {
        const fields = Joi.object({
            shopId: Joi.string().custom((value, helpers) => {           //custom validation
                if (!mongoose.Types.ObjectId.isValid(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            }).required(),
            category: Joi.string().required(),
        })
        try {
            const { error, value } = fields.validate(req.body);
            if (error) {
                console.error(error.details);
                return res.status(400).json({ error: error.message });
            }

            const { shopId, category } = value;
            const adminDetails = await findAdmin({ _id: req.userId });
            if (!adminDetails) {
                throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND);
            };
            const isShopId = await findShop({ _id: shopId });
            if (!isShopId) {
                throw apiError.notFound(responseMessages.SHOP_NOT_FOUND)
            }
            const obj = {
                category: category,
                shopId: shopId,
            };
            const createdCategory = await createCategory(obj);
            return res.json(new successResponse(createdCategory, responseMessages.CATEGORY_CREATED));

        } catch (error) {
            console.log("Error", error);
            return next(error);
        }
    }
    async updateCategory(req, res, next) {
        try {
            const adminDetails = await findAdmin({ _id: req.userId });
            if (!adminDetails) {
                throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND);
            };

            const { shopId, category } = req.body;
            const id = req.query.id;
            const categoryResult = await findCategory({ _id: id });
            if (!id) {
                throw apiError.invalid(responseMessages.CATEGORY_ID_REQUIRED);
            } else if (!categoryResult) {
                throw apiError.notFound(responseMessages.CATEGORY_NOT_FOUND)
            }
            if (shopId) {
                const shopResult = await findShop({ _id: shopId });
                if (!shopResult) {
                    throw apiError.notFound(responseMessages.SHOP_NOT_FOUND)
                } else {
                    const updatedCategory = await updateCategory({ _id: id }, { $set: { shopId: shopId } });
                    return res.json(new successResponse(updatedCategory, responseMessages.CATEGORY_CREATED));
                }
            } else if (category) {
                const updatedCategory = await updateCategory({ _id: id }, { $set: { category: category } });
                return res.json(new successResponse(updatedCategory, responseMessages.CATEGORY_CREATED));
            } else {
                throw apiError.invalid(responseMessages.INVALID);
            }


        } catch (error) {
            console.log("Error", error);
            return next(error);
        }
    }
    
    async deleteCategory(req, res, next) {
try {
    



} catch (error) {
    console.log("Error", error);
            return next(error);
}
    }
}

export default new categoryController();