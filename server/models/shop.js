import { model, Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";


const shop = new Schema({
    shopName: {
        type: String,
    },
    location: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    imageUrl: {
        type: String
    },
},
    { timestamps: true }
)

shop.index({ location: "2dsphere" })
shop.plugin(aggregatePaginate)
module.exports = model("shops", shop);