import {model, models, Schema} from "mongoose";

const OrderSchema = new Schema({
  line_items: { type: Array, default: [] },
  name:String,
  email:String,
  city:String,
  postalCode:String,
  streetAddress:String,
  country:String,
  paid: { type: Boolean, default: false },
  orderStatus: {
    type: String,
    enum: ["draft", "pending_payment", "paid", "failed", "canceled"],
    default: "pending_payment",
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "pending", "paid", "failed", "canceled", "refunded"],
    default: "unpaid",
  },
  paymentProvider: { type: String, default: "stripe" },
  paymentIntentId: String,
  checkoutSessionId: String,
  currency: { type: String, default: "pln" },
  amountTotal: Number,
  lastPaymentError: String,
}, {
  timestamps: true,
});

export const Order = models?.Order || model('Order', OrderSchema);
