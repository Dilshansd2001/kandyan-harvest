const User = require("../models/User");
const Order = require("../models/Order");
const Delivery = require("../models/Delivery");
const Supermarket = require("../models/Supermarket");


// ✅ Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get Pending Users
exports.getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isVerified: false })
      .select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Approve User
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "supermarket") {
      const existingProfile = await Supermarket.findOne({ user: user._id });
      if (!existingProfile) {
        await Supermarket.create({
          user: user._id,
          businessName: user.businessName || "",
          businessEmail: user.email || "",
          contactPerson: user.fullName || "",
          phone: user.phone || ""
        });
      }
    }

    res.json({
      message: "User approved successfully",
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Reject User
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User rejected & removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// GET ALL ORDERS
exports.getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate({
      path: "farmer",
      select: "farmName",
      populate: { path: "user", select: "email" }
    })
    .populate({
      path: "supermarket",
      select: "businessName businessEmail phone",
      populate: { path: "user", select: "email" }
    });

  res.json(orders);
};

// GET SINGLE ORDER
exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate({
      path: "farmer",
      populate: { path: "user", select: "email" }
    })
    .populate({
      path: "supermarket",
      populate: { path: "user", select: "email" }
    });

  res.json(order);
};

// GET ALL DELIVERIES
exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate({ path: "driver", populate: { path: "user", select: "email" } })
      .populate({ path: "farmer", populate: { path: "user", select: "email" } })
      .populate({ path: "supermarket", populate: { path: "user", select: "email" } })
      .populate("order");
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET SINGLE DELIVERY
exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate({ path: "driver", populate: { path: "user", select: "email" } })
      .populate({ path: "farmer", populate: { path: "user", select: "email" } })
      .populate({ path: "supermarket", populate: { path: "user", select: "email" } })
      .populate("order");

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    res.json(delivery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ACTIVE DELIVERIES (ADMIN)
exports.getActiveDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      status: { $in: ["ACCEPTED", "IN_TRANSIT"] }
    })
      .populate({ path: "driver", populate: { path: "user", select: "email" } })
      .populate({ path: "farmer", populate: { path: "user", select: "email" } })
      .populate({ path: "supermarket", populate: { path: "user", select: "email" } })
      .populate("order");

    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET COMPLETED DELIVERIES (ADMIN)
exports.getCompletedDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      status: "COMPLETED"
    })
      .populate({ path: "driver", populate: { path: "user", select: "email" } })
      .populate({ path: "farmer", populate: { path: "user", select: "email" } })
      .populate({ path: "supermarket", populate: { path: "user", select: "email" } })
      .populate("order");

    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getActiveDeliveries = async (req, res) => {

  const deliveries = await Delivery.find({
    status: { $in: ["ACCEPTED", "IN_TRANSIT"] }
  })
    .populate({ path: "driver", populate: { path: "user", select: "email" } })
    .populate({ path: "farmer", populate: { path: "user", select: "email" } })
    .populate({ path: "supermarket", populate: { path: "user", select: "email" } })
    .populate("order");

  res.json(deliveries);
};
exports.getCompletedDeliveries = async (req, res) => {

  const deliveries = await Delivery.find({
    status: "COMPLETED"
  })
    .populate({ path: "driver", populate: { path: "user", select: "email" } })
    .populate({ path: "farmer", populate: { path: "user", select: "email" } })
    .populate({ path: "supermarket", populate: { path: "user", select: "email" } })
    .populate("order");

  res.json(deliveries);
};
