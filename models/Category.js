import mongoose, {model, models, Schema} from "mongoose";

const CategorySchema = new Schema({
  name: {type:String,required:true},
  slug: {type:String, required:true, unique:true},
  parent: {type:mongoose.Types.ObjectId, ref:'Category'},
  isActive: {type:Boolean, default:true},
  sortOrder: {type:Number, default:0},
  properties: [{type:Object}]
});

export const Category = models?.Category || model('Category', CategorySchema);
