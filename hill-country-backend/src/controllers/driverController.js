const Driver = require("../models/Driver");
const Delivery = require("../models/Delivery");

// create / update profile
exports.saveProfile = async (req, res) => {
  const profile = await Driver.findOneAndUpdate(
    { user: req.user._id },
    { ...req.body, user: req.user._id },
    { new: true, upsert: true }
  );
  res.json({ message: "Driver profile saved", profile });
};

// get own profile
exports.getProfile = async (req, res) => {
  const profile = await Driver.findOne({ user: req.user._id });
  res.json(profile);
};

// available deliveries
exports.getAvailableJobs = async (req, res) => {
  const jobs = await Delivery.find({ status: "AVAILABLE" })
    .populate("order");
  res.json(jobs);
};

// accept delivery
exports.acceptJob = async (req, res) => {
  const job = await Delivery.findOneAndUpdate(
    { _id: req.params.id, status: "AVAILABLE" },
    { status: "ASSIGNED", driver: req.user._id },
    { new: true }
  );

  if (!job) {
    return res.status(404).json({ message: "Job not available" });
  }

  res.json({ message: "Delivery accepted", job });
};

// complete delivery
exports.completeJob = async (req, res) => {
  const job = await Delivery.findOneAndUpdate(
    { _id: req.params.id, driver: req.user._id },
    { status: "COMPLETED" },
    { new: true }
  );

  res.json({ message: "Delivery completed", job });
};
