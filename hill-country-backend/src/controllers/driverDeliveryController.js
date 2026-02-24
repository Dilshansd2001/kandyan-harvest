const Delivery = require("../models/Delivery");
const Driver = require("../models/Driver");
const { createAndEmitNotification } = require("../services/notificationService");

const ensureDriver = (req, res) => {
  if (!req.user || req.user.role !== "driver") {
    res.status(403).json({ message: "Drivers only" });
    return false;
  }
  return true;
};

// GET /api/driver/deliveries (available)
exports.getAvailableDeliveries = async (req, res) => {
  try {
    if (!ensureDriver(req, res)) return;

    const deliveries = await Delivery.find({
      status: "AVAILABLE",
      driver: null
    })
      .populate({
        path: "farmer",
        select: "farmName",
        populate: { path: "user", select: "email" }
      })
      .populate({
        path: "supermarket",
        select: "businessName businessEmail",
        populate: { path: "user", select: "email" }
      })
      .populate("order");

    console.log("FOUND AVAILABLE DELIVERIES:", deliveries.length);
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/driver/deliveries/:id/accept
exports.acceptDelivery = async (req, res) => {
  try {
    if (!ensureDriver(req, res)) return;

    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, status: "AVAILABLE" },
      { status: "ASSIGNED", driver: driver._id },
      { new: true }
    )
      .populate({
        path: "farmer",
        select: "farmName",
        populate: { path: "user", select: "email" }
      })
      .populate({
        path: "supermarket",
        select: "businessName businessEmail",
        populate: { path: "user", select: "email" }
      });

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not available" });
    }

    const driverName = driver.fullName || "Driver";
    const hireMessage = `Driver ${driverName} has accepted the delivery and is on the way to pick up your harvest.`;

    if (delivery.farmer?.user?._id) {
      await createAndEmitNotification({
        senderId: req.user._id,
        receiverId: delivery.farmer.user._id,
        message: hireMessage,
        orderId: delivery.order,
        deliveryId: delivery._id
      });
    }

    if (delivery.supermarket?.user?._id) {
      await createAndEmitNotification({
        senderId: req.user._id,
        receiverId: delivery.supermarket.user._id,
        message: hireMessage,
        orderId: delivery.order,
        deliveryId: delivery._id
      });
    }

    res.json({ message: "Delivery accepted", delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/driver/deliveries/:id/start
exports.startDelivery = async (req, res) => {
  try {
    if (!ensureDriver(req, res)) return;

    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, driver: driver._id, status: "ASSIGNED" },
      { status: "IN_TRANSIT" },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    res.json({ message: "Delivery started", delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/driver/deliveries/:id/complete
exports.completeDelivery = async (req, res) => {
  try {
    if (!ensureDriver(req, res)) return;

    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const delivery = await Delivery.findOneAndUpdate(
      { _id: req.params.id, driver: driver._id, status: "IN_TRANSIT" },
      { status: "COMPLETED" },
      { new: true }
    )
      .populate({
        path: "farmer",
        select: "farmName",
        populate: { path: "user", select: "email" }
      })
      .populate({
        path: "supermarket",
        select: "businessName businessEmail",
        populate: { path: "user", select: "email" }
      })
      .populate("order");

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    const deliveredItem =
      delivery.order && Array.isArray(delivery.order.items) && delivery.order.items.length
        ? delivery.order.items[0].productName
        : "product";

    const completeMessage = `Your delivery for ${deliveredItem} has been successfully completed and delivered.`;

    if (delivery.farmer?.user?._id) {
      await createAndEmitNotification({
        senderId: req.user._id,
        receiverId: delivery.farmer.user._id,
        message: completeMessage,
        orderId: delivery.order?._id || null,
        deliveryId: delivery._id
      });
    }

    if (delivery.supermarket?.user?._id) {
      await createAndEmitNotification({
        senderId: req.user._id,
        receiverId: delivery.supermarket.user._id,
        message: completeMessage,
        orderId: delivery.order?._id || null,
        deliveryId: delivery._id
      });
    }

    res.json({ message: "Delivery completed", delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/driver/deliveries/active
exports.getActiveDeliveries = async (req, res) => {
  try {
    if (!ensureDriver(req, res)) return;

    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const deliveries = await Delivery.find({
      driver: driver._id,
      status: { $in: ["ASSIGNED", "IN_TRANSIT"] }
    })
      .populate({
        path: "farmer",
        select: "farmName",
        populate: { path: "user", select: "email" }
      })
      .populate({
        path: "supermarket",
        select: "businessName businessEmail",
        populate: { path: "user", select: "email" }
      })
      .populate("order");

    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/driver/deliveries/completed
exports.getCompletedDeliveries = async (req, res) => {
  try {
    if (!ensureDriver(req, res)) return;

    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const deliveries = await Delivery.find({
      driver: driver._id,
      status: "COMPLETED"
    })
      .populate({
        path: "farmer",
        select: "farmName",
        populate: { path: "user", select: "email" }
      })
      .populate({
        path: "supermarket",
        select: "businessName businessEmail",
        populate: { path: "user", select: "email" }
      })
      .populate("order");

    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
