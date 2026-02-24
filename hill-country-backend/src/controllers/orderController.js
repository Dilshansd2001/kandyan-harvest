const Order = require("../models/Order");
const Harvest = require("../models/Harvest");
const Supermarket = require("../models/Supermarket");
const Farmer = require("../models/Farmer");
const { createAndEmitNotification } = require("../services/notificationService");

exports.placeOrder = async (req, res) => {
  try {

    const {
      harvestId,
      quantityKg,
      offered_price,
      deliveryLocation,
      deliveryDate,
      deliveryAddress,
      deliveryLat,
      deliveryLng
    } = req.body;

    const qty = Number(quantityKg);
    const offeredPricePerKg = Number(offered_price);

    if (
      !harvestId ||
      !deliveryDate ||
      !Number.isFinite(qty) ||
      qty <= 0 ||
      !Number.isFinite(offeredPricePerKg) ||
      offeredPricePerKg <= 0
    ) {
      return res.status(400).json({
        message: "Invalid order data"
      });
    }

    const harvest = await Harvest.findById(harvestId);

    if (!harvest || harvest.status !== "AVAILABLE") {
      return res.status(404).json({
        message: "Harvest not available"
      });
    }

    if (!harvest.farmer) {
      return res.status(400).json({
        message: "Harvest farmer not assigned"
      });
    }

    if (qty > harvest.quantityKg) {
      return res.status(400).json({
        message: "Requested quantity exceeds stock"
      });
    }

    const totalPrice = qty * offeredPricePerKg;

    const resolvedDeliveryLocation = deliveryLocation || {
      address: deliveryAddress,
      lat: Number(deliveryLat),
      lng: Number(deliveryLng)
    };
    if (
      !resolvedDeliveryLocation ||
      resolvedDeliveryLocation.lat == null ||
      resolvedDeliveryLocation.lng == null
    ) {
      return res.status(400).json({
        message: "Delivery location required"
      });
    }

    const supermarket = await Supermarket.findOne({ user: req.user._id });
    if (!supermarket) {
      return res.status(404).json({ message: "Supermarket profile not found" });
    }

    const order = await Order.create({
      supermarket: supermarket._id,
      farmer: harvest.farmer,
      harvest: harvest._id,

      items: [
        {
          productName: harvest.productName,
          quantityKg: qty,
          pricePerKg: offeredPricePerKg
        }
      ],

      offered_price: offeredPricePerKg,
      deliveryLocation: resolvedDeliveryLocation,
      deliveryDate,
      totalPrice,
      status: "PENDING"
    });

    const notificationMessage = `New order for ${harvest.productName} (${qty} KG) at Rs ${offeredPricePerKg}/kg`;

    const farmerProfile = await Farmer.findById(harvest.farmer).select("user");
    if (farmerProfile?.user) {
      await createAndEmitNotification({
        senderId: req.user._id,
        receiverId: farmerProfile.user,
        message: notificationMessage,
        orderId: order._id
      });
    }

    res.status(201).json({
      message: "Order placed successfully",
      order
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getMyOrders = async (req, res) => {
  try {

    const supermarket = await Supermarket.findOne({ user: req.user._id });
    if (!supermarket) {
      return res.status(404).json({ message: "Supermarket profile not found" });
    }

    const orders = await Order.find({
      supermarket: supermarket._id
    })
      .populate({
        path: "farmer",
        select: "farmName",
        populate: { path: "user", select: "email" }
      })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getOrderById = async (req, res) => {
  try {

    const order = await Order.findById(req.params.id)
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

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

