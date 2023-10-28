import shopServices from "../../../v1/services/shop";
import apiError from "../../../../helper/apiError";
import responseMessages from "../../../../../assets/responseMessages";
import successResponse from "../../../../../assets/response";
import commonFunction from "../../../../helper/utils";
import Joi from "joi"
const { createShop, findAdmin, deleteShop, updateShop, findUserDetails, geonear } = shopServices;

export class shopController {

    async createShop(req, res, next) {
        try {
            const admin = await findAdmin( req.userId );
            if (!admin) {
                throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND);
            };
            const requiredFields = ["latitude", "longitude", "shopName", "imageUrl"];
            const missingFields = [];
            const body = req.body;
            requiredFields.forEach((field) => {
                if (!body[field]) {
                    missingFields.push(field);
                }
            });
            if (missingFields.length > 0) {
                const err = missingFields.map((fields) => `${fields} is required`);
                return res.json({ responseMessages: err });
            }
            const image = await commonFunction.getSecureUrl(body.imageUrl);
            const obj = {
                shopName: body.shopName,
                location: {
                    coordinates: [parseFloat(body.longitude), parseFloat(body.latitude)]
                },
                imageUrl: image
            }
            const shopCreate = await createShop(obj);
            res.json(new successResponse(shopCreate, responseMessages.SHOP_CREATED));
        } catch (error) {
            console.log("Error", error);
            return next(error);

        }
    }

    async deleteShop(req, res, next) {
        try {
            const admin = await findAdmin(req.userId);
            if (!admin) {
                throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND);
            };
            const id = req.query.id;
            if (!id) {
                throw apiError.invalid(responseMessages.INVALID);
            }
             await deleteShop({ _id: id });
            return res.json(new successResponse(responseMessages.DELETE_SUCCESS));
        } catch (error) {
            console.log(error);
            return next(error);
        }
    }

    async updateShop(req, res, next) {
        try {
            const admin = await findAdmin( req.userId);
            if (!admin) {
                throw apiError.notFound(responseMessages.ADMIN_NOT_FOUND);
            };
            const id = req.query.id;
            if (!id) {
                throw apiError.invalid(responseMessages.INVALID);
            }
            const { latitude, longitude, shopName, image } = req.body;
            const updated = await updateShop({ _id: id }, { $set: req.body });
            return res.json(new successResponse(updated, responseMessages.UPDATE_SUCCESS));
        } catch (error) {
            console.log("Error", error);
            return next(error);
        }
    }
    //geonrear
    async getShop(req, res, next) {
        const validateMaxDistance = (value, helpers) => {
            const validDistances = [2, 5, 8, 10];    // Valid distances in km
            if (!validDistances.includes(value)) {
                return helpers.message(`Max distance must be one of: ${validDistances.join(', ')} km`);
            }
            return value;
        };
        const field = Joi.object({
            maxDistance: Joi.number().custom(validateMaxDistance).required(),
            longitude: Joi.number().required(),
            latitude: Joi.number().required(),
        })
        try {
            const { error, value } = field.validate(req.body);
            if (error) {
                console.error(error.details);
                return res.status(400).json({ error: error.details[0].message });
            }
            const { maxDistance, latitude, longitude } = value;
            const userDetails = await findUserDetails({ _id: req.userId });

            if (!userDetails) {
                throw apiError.notFound(responseMessages.USER_NOT_FOUND);
            };
            const result = await geonear([
                {
                    $geoNear: {
                        near: {
                            type: "point",
                            coordinates: [ parseFloat(longitude),parseFloat(latitude)],
                        },
                        // key:"location",
                        distanceField: "distance",
                        maxDistance: maxDistance * 1000,
                        spherical: true,
                    }
                }
            ])
            if (!result) {
                throw apiError.notFound(responseMessages.SHOP_NOT_FOUND);

            }
            return res.json(new successResponse(result, responseMessages.SUCCESS));
        } catch (error) {
            console.log(error);
            return next(error);
        }
    }















}

export default new shopController();