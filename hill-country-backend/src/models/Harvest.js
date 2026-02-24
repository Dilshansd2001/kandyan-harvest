const mongoose = require("mongoose");

const harvestSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true
    },
    productName: String,
    category: String,
    district: String,
    quantityKg: Number,
    pricePerKg: Number,
    availableDate: Date,
    description: String,
    pickupLocation: {
      address: String,
      lat: Number,
      lng: Number
    },
    images: [String],
    status: {
      type: String,
      enum: ["AVAILABLE", "SOLD_OUT"],
      default: "AVAILABLE"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Harvest", harvestSchema);
