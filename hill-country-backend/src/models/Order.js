const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    supermarket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supermarket",
      required: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true
    },
    harvest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Harvest"
    },
    items: [
      {
        productName: String,
        quantityKg: Number,
        pricePerKg: Number
      }
    ],
    offered_price: Number,
    totalPrice: Number,
    deliveryDate: {
      type: Date,
      required: true
    },
    deliveryLocation: {
      lat: Number,
      lng: Number,
      address: String
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "DELIVERING", "COMPLETED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
