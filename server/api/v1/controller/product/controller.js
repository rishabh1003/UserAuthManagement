import responseMessages from "../../../../../assets/responseMessages";
import successResponse from "../../../../../assets/response";
import commonFunction from "../../../../helper/utils";
import Joi from "joi";
import productServices from "../../services/product";
import mongoose from "mongoose";
import apiError from "../../../../helper/apiError";

const {
    findUser,
    findCategoryById,
    createProduct,
    findProductById,
    deleteProduct,
    updateProduct,
    populateProduct,
    productList,
    paginate,
    lookups
} = productServices;

export class product {
    async addProduct(req, res, next) {
        const fields = Joi.object({
            categoryId: Joi.string()
                .custom((value, helpers) => {
                    //custom validation
                    if (!mongoose.Types.ObjectId.isValid(value)) {
                        return helpers.error("any.invalid");
                    }
                    return value;
                })
                .required(),
            productImage: Joi.string().required(),
            productName: Joi.string().required(),
            productDescription: Joi.string(),
            productPrice:Joi.string(),
        });
        try {
            const { error, value } = fields.validate(req.body);
            if (error) {
                console.error(error.details);
                return res.status(400).json({ error: error.message });
            }
            const { categoryId, productImage, productName, productDescription, productPrice } =
                value;
            const users = await findUser(req.userId);
            if (!users) {
                throw apiError.notFound(responseMessages.USER_NOT_FOUND);
            }
            const categoryDetail = await findCategoryById(categoryId);
            if (!categoryDetail) {
                throw apiError.notFound(responseMessages.CATEGORY_NOT_FOUND);
            }
            const image = await commonFunction.getSecureUrl(productImage);
            const obj = {
                productName: productName,
                categoryId: categoryId,
                productImage: image,
                productDescription: productDescription,
                productPrice:productPrice
            };
            const createdProduct = await createProduct(obj);
            return res.json(
                new successResponse(createdProduct, responseMessages.PRODUCT_ADDED)
            );
        } catch (error) {
            console.log("Error", error);
            return next(error);
        }
    }

    async deleteProduct(req, res, next) {
        const field = Joi.object({
            id: Joi.string()
                .custom((value, helpers) => {
                    //custom validation
                    if (!mongoose.Types.ObjectId.isValid(value)) {
                        return helpers.error("any.invalid");
                    }
                    return value;
                })
                .required(),
        });
        try {
            const { error, value } = field.validate(req.query);
            if (error) {
                console.error(error.details);
                return res.status(400).json({ error: error.message });
            }
            const { id } = value;
            const users = await findUser(req.userId);
            if (!users) {
                throw apiError.notFound(responseMessages.USER_NOT_FOUND);
            }
            const productDetails = await findProductById(id);
            if (!productDetails) {
                throw apiError.notFound(responseMessages.PRODUCT_NOT_FOUND);
            }
            await deleteProduct(id);
            return res.json(new successResponse(responseMessages.PRODUCT_DELETED));
        } catch (error) {
            console.log(error);
            return next(error);
        }
    }

    async editProduct(req, res, next) {
        try {
            const id = req.query.id;
            const { productImage, categoryId } = req.body;
            if (!id) {
                throw apiError.invalid(responseMessages.PRODUCT_ID_REQUIRED);
            }
            const users = await findUser(req.userId);
            if (!users) {
                throw apiError.notFound(responseMessages.USER_NOT_FOUND);
            }
            const productDetails = await findProductById(id);
            if (!productDetails) {
                throw apiError.notFound(responseMessages.PRODUCT_NOT_FOUND);
            }
            if (productImage) {
                const imageUrl = await commonFunction.getSecureUrl(productImage);
                const data = await updateProduct(
                    { _id: id },
                    { $set: { productImage: imageUrl } }
                );
                return res.json(
                    new successResponse(data, responseMessages.PRODUCT_UPDATED)
                );
            } else if (categoryId) {
                const categoryDetail = await findCategoryById(categoryId);
                if (!categoryDetail) {
                    throw apiError.notFound(responseMessages.CATEGORY_NOT_FOUND);
                } else {
                    const data = await updateProduct(
                        { _id: id },
                        { $set: { categoryDetail: categoryDetail } }
                    );
                    return res.json(
                        new successResponse(data, responseMessages.PRODUCT_UPDATED)
                    );
                }
            } else {
                const updatedProduct = await updateProduct(
                    { _id: id },
                    { $set: req.body }
                );
                return res.json(
                    new successResponse(updatedProduct, responseMessages.PRODUCT_UPDATED)
                );
            }
        } catch (error) {
            console.log("Error", error);
            return next(error);
        }
    }
    // geting specific product with id using populate category and shop.
    async getProduct(req, res, next) {
        const field = Joi.object({
            id: Joi.string()
                .custom((value, helpers) => {
                    //custom validation
                    if (!mongoose.Types.ObjectId.isValid(value)) {
                        return helpers.error("any.invalid");
                    }
                    return value;
                })
                .required(),
        });
        try {
            const { error, value } = field.validate(req.query);
            if (error) {
                console.error(error.details);
                return res.status(400).json({ error: error.message });
            }
            const { id } = value;
            const productDetails = await populateProduct(id);
            if (!productDetails) {
                throw apiError.notFound(responseMessages.PRODUCT_NOT_FOUND);
            }
            return res.json(
                new successResponse(productDetails, responseMessages.SUCCESS)
            );
        } catch (error) {
            console.log(error);
            return next(error);
        }
    }
    // geting  products using pagination.

    async getProductList(req, res, next) {
        try {
            const { page, limit } = req.query;
            if (page < 1) {
                throw apiError.badRequest(responseMessages.PAGE_UNSPECIFIED);
            } else if (limit < 1) {
                throw apiError.badRequest(responseMessages.LIMIT_UNSPECIFIED);
            }
            const products = await paginate({}, page, limit);
            if (!products) {
                throw apiError.notFound(responseMessages.PRODUCT_NOT_FOUND);
            }
            return res.json(new successResponse(products, responseMessages.SUCCESS));
        } catch (error) {
            console.log(error);
            return next(error);
        }
    }

    // geting  products using populate category and shop using aggregatepagination.

    async getSpecificProduct(req, res, next) {
        try {
            const {productName}=req.body;
            if(productName==null || productName==undefined || productName==""){
                throw apiError.badRequest(responseMessages.INVALID)
            }
            const result = await lookups(productName);
           return res.json(new successResponse(result ,responseMessages.SUCCESS));
        } catch (error) {
            console.log(error);
            return next(error);
        }
    }











}

export default new product();
