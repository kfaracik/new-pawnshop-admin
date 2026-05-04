import mongoose, {model, Schema, models} from "mongoose";

const ProductSchema = new Schema({
  title: {type:String, required:true},
  description: String,
  price: {type: Number, required: true},
  images: [{type:String}],
  category: {type:mongoose.Types.ObjectId, ref:'Category'},
  properties: {type:Object},
  quantity: {type:Number, default: undefined, min: 0},
  stock: {type:Number, default: 0, min: 0},
  availabilityMode: {type:String, default:"online_only"},
  availableLocations: [{type:mongoose.Types.ObjectId, ref:'Location'}],
}, {
  timestamps: true,
});

export const Product = models.Product || model('Product', ProductSchema);
