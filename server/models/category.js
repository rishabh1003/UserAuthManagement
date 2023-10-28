import { model, Schema } from "mongoose";
import mongoose from "mongoose"
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const categories = new Schema({
    shopId: {
        type: mongoose.Types.ObjectId,
        ref: "shops",
    },
    category: {
        type: String,
        required: true
    },
}, { timestamps: true });
categories.plugin(aggregatePaginate)
module.exports = model("categories", categories);