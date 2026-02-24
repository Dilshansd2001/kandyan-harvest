const Supermarket = require("../models/Supermarket");
const Delivery = require("../models/Delivery");

// CREATE / UPDATE PROFILE
exports.saveProfile = async (req, res) => {
  try {
    const profile = await Supermarket.findOneAndUpdate(
      { user: req.user.id },
      { ...req.body, user: req.user.id },
      { new: true, upsert: true }
    );

    res.json({
      message: "Supermarket profile saved successfully",
      profile
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const profile = await Supermarket.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const profile = await Supermarket.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, upsert: true }
    );

    res.json({
      message: "Profile updated successfully",
      profile
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveDeliveries = async (req, res) => {

  const supermarket = await Supermarket.findOne({ user: req.user._id });
  if (!supermarket) {
    return res.status(404).json({ message: "Profile not found" });
  }

  const deliveries = await Delivery.find({
    supermarket: supermarket._id,
    status: { $in: ["ASSIGNED", "IN_TRANSIT"] }
  }).populate({
    path: "driver",
    select: "fullName phone"
  });

  res.json(deliveries);
};
exports.getCompletedDeliveries = async (req, res) => {

  const supermarket = await Supermarket.findOne({ user: req.user._id });
  if (!supermarket) {
    return res.status(404).json({ message: "Profile not found" });
  }

  const deliveries = await Delivery.find({
    supermarket: supermarket._id,
    status: "COMPLETED"
  }).populate({
    path: "driver",
    select: "fullName phone"
  });

  res.json(deliveries);
};
