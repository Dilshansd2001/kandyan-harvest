const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    fullName: {
      type: String,
      required: true
    },
    nic: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    farmName: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farmer", farmerSchema);
