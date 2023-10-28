import { model, Schema } from "mongoose";
import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import  paginate  from "mongoose-paginate-v2";


const product = new Schema({
    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: "categories",
    },
    productImage: {
        type: String,
    },

    productName: {
        type: String,
    },
    productDescription: {
        type: String
    },
    productPrice: {
        type: String
    }

}, { timestamps: true });
product.plugin(paginate)
product.plugin(aggregatePaginate)

module.exports = model("products", product);