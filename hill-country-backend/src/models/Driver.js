const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    // Personal
    fullName: { type: String, required: true },
    nic: { type: String, required: true },
    dob: { type: Date },
    phone: { type: String, required: true },
    email: { type: String },

    // Address
    address: { type: String, required: true },
    serviceDistrict: { type: String, required: true },

    // License
    licenseNumber: { type: String, required: true },
    licenseIssueDate: { type: Date },
    licenseExpiryDate: { type: Date },
    licenseCategories: [String],
    drivingExperienceYears: { type: Number },

    // Vehicle
    vehicleType: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    loadCapacityKg: { type: Number, required: true },

    // Bank
    bankName: { type: String },
    accountHolderName: { type: String },
    accountNumber: { type: String },

    // Documents (file URLs)
    profilePhoto: { type: String },
    nicFront: { type: String },
    nicBack: { type: String },
    licenseImage: { type: String },

    // Status
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);
