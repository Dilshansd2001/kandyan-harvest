const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "farmer", "supermarket", "driver"],
    required: true
  },
  farmName: { type: String },
  businessName: { type: String },
  vehicle: { type: String },
  licenseFront: { type: String },
  licenseRear: { type: String },
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String, default: null, index: true },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
