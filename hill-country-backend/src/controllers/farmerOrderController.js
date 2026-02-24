const Order = require("../models/Order");
const Harvest = require("../models/Harvest");
const Delivery = require("../models/Delivery");
const Farmer = require("../models/Farmer");
const Supermarket = require("../models/Supermarket");
const Driver = require("../models/Driver");
const { getDistanceInKm } = require("../services/distanceService");
const { calculateDeliveryCharge } = require("../services/pricingService");
const { createAndEmitNotification } = require("../services/notificationService");

// GET farmer's orders
exports.getMyOrders = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const orders = await Order.find({ farmer: farmer._id })
      .populate({
        path: "supermarket",
        select: "businessName businessEmail phone",
        populate: { path: "user", select: "email" }
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ACCEPT ORDER + CREATE DELIVERY
exports.acceptOrder = async (req, res) => {
  try {

    console.log("ACCEPT ORDER HIT");

    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      farmer: farmer._id,
      status: "PENDING"
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ===== REDUCE STOCK =====
    for (let item of order.items) {

      const harvest = await Harvest.findOne({
        farmer: farmer._id,
        productName: item.productName,
        status: "AVAILABLE"
      });

      if (!harvest || harvest.quantityKg < item.quantityKg) {
        return res.status(400).json({
          message: `Not enough stock for ${item.productName}`
        });
      }

      harvest.quantityKg -= item.quantityKg;

      if (harvest.quantityKg <= 0) {
        harvest.quantityKg = 0;
        harvest.status = "SOLD_OUT";
      }

      await harvest.save();
    }

    // ===== UPDATE ORDER STATUS =====
    order.status = "ACCEPTED";
    await order.save();

    // ===== DELIVERY CALCULATION =====
    let harvest = null;
    if (order.harvest) {
      harvest = await Harvest.findById(order.harvest);
    }
    if (!harvest) {
      const firstItem = order.items && order.items.length ? order.items[0] : null;
      if (firstItem) {
        harvest = await Harvest.findOne({
          farmer: farmer._id,
          productName: firstItem.productName,
          status: "AVAILABLE"
        });
      }
    }

    const pickupLocation = harvest && harvest.pickupLocation
      ? harvest.pickupLocation
      : { address: "Unknown", lat: null, lng: null };

    const dropLocation = order.deliveryLocation || {};

    const distanceKm = await getDistanceInKm(
      pickupLocation.lat,
      pickupLocation.lng,
      dropLocation.lat,
      dropLocation.lng
    );

    const totalLoadKg = order.items.reduce(
      (sum, item) => sum + item.quantityKg,
      0
    );

    const deliveryCharge = calculateDeliveryCharge({
      distanceKm,
      loadKg: totalLoadKg
    });

    // ===== CREATE DELIVERY =====
    const delivery = await Delivery.create({
      order: order._id,
      farmer: order.farmer,
      supermarket: order.supermarket,
      pickupLocation,
      dropLocation,
      deliveryDate: order.deliveryDate,
      distanceKm,
      loadKg: totalLoadKg,
      deliveryCharge,
      status: "AVAILABLE"
    });

    console.log("Delivery created:", delivery._id);

    const firstItem = order.items && order.items.length ? order.items[0] : null;
    const productName = firstItem?.productName || "your product";
    const acceptedPrice = Number(order.offered_price || firstItem?.pricePerKg || 0);

    const supermarketProfile = await Supermarket.findById(order.supermarket).select("user");
    if (supermarketProfile?.user) {
      await createAndEmitNotification({
        senderId: req.user._id,
        receiverId: supermarketProfile.user,
        message: `Farmer ${farmer.farmName} has accepted your order for ${productName} at Rs.${acceptedPrice}.`,
        orderId: order._id,
        deliveryId: delivery._id
      });
    }

    const nearbyDrivers = await Driver.find({
      isAvailable: true,
      isVerified: true,
      serviceDistrict: farmer.district
    }).select("user");

    const pickupLabel = pickupLocation?.address || "Farm pickup location";
    const dropLabel = dropLocation?.address || "Supermarket location";

    await Promise.all(
      nearbyDrivers
        .filter((driver) => driver.user)
        .map((driver) =>
          createAndEmitNotification({
            senderId: null,
            receiverId: driver.user,
            message: `New Delivery Available! Pickup from ${pickupLabel} to ${dropLabel}.`,
            orderId: order._id,
            deliveryId: delivery._id
          })
        )
    );

    res.json({
      message: "Order accepted & delivery created",
      delivery
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// REJECT order
exports.rejectOrder = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        farmer: farmer._id,
        status: "PENDING"
      },
      { status: "REJECTED" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found or already handled" });
    }

    res.json({
      message: "Order rejected",
      order
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
