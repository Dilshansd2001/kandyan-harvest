const mongoose = require("mongoose");

const supermarketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    businessName: {
      type: String,
      required: true
    },
    businessType: {
      type: String,
      enum: ["Supermarket", "Hotel", "Restaurant"],
      required: true
    },
    brn: {
      type: String,
      required: true
    },
    vatNumber: {
      type: String
    },
    contactPerson: {
      type: String,
      required: true
    },
    businessEmail: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    postalCode: {
      type: String
    },
    registrationDocument: {
      type: String // file URL later (PDF/JPG)
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supermarket", supermarketSchema);
