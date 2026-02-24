const Farmer = require("../models/Farmer");
const Harvest = require("../models/Harvest");
const Order = require("../models/Order");


// CREATE or UPDATE profile
exports.saveProfile = async (req, res) => {
  try {
    const profile = await Farmer.findOneAndUpdate(
      { user: req.user._id },
      { ...req.body, user: req.user._id },
      { new: true, upsert: true }
    );

    res.json({
      message: "Farmer profile saved successfully",
      profile
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET own profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await Farmer.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Farmer analytics
exports.analytics = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const totalHarvest = await Harvest.countDocuments({
      farmer: farmer._id
    });

    const totalOrders = await Order.countDocuments({
      farmer: farmer._id
    });

    const totalRevenueAgg = await Order.aggregate([
      { $match: { farmer: farmer._id } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);

    res.json({
      totalHarvest,
      totalOrders,
      totalRevenue: totalRevenueAgg[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Farmer market analytics for a specific product (last 4 weeks)
exports.marketAnalytics = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const productName = (req.query.productName || "").trim();
    if (!productName) {
      return res.status(400).json({ message: "productName query is required" });
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 28);

    const weeklyWindows = [];
    for (let i = 0; i < 4; i += 1) {
      const start = new Date(startDate);
      start.setDate(startDate.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      weeklyWindows.push({ start, end, label: `Week ${i + 1}` });
    }

    const orders = await Order.find({
      farmer: farmer._id,
      status: { $ne: "REJECTED" },
      createdAt: { $gte: startDate },
      "items.productName": productName
    }).select("items createdAt");

    const weekly = weeklyWindows.map((window) => {
      const matchingItems = [];

      orders.forEach((order) => {
        if (order.createdAt < window.start || order.createdAt >= window.end) return;
        (order.items || []).forEach((item) => {
          if (item.productName === productName) matchingItems.push(item);
        });
      });

      const totalQty = matchingItems.reduce(
        (sum, item) => sum + Number(item.quantityKg || 0),
        0
      );
      const totalPrice = matchingItems.reduce(
        (sum, item) => sum + Number(item.pricePerKg || 0),
        0
      );

      return {
        label: window.label,
        avgPrice: matchingItems.length ? Number((totalPrice / matchingItems.length).toFixed(2)) : 0,
        demandQty: Number(totalQty.toFixed(2))
      };
    });

    const averageWeeklyDemand = Number(
      (
        weekly.reduce((sum, week) => sum + week.demandQty, 0) / 4
      ).toFixed(2)
    );

    const availableAgg = await Harvest.aggregate([
      {
        $match: {
          farmer: farmer._id,
          productName,
          status: "AVAILABLE"
        }
      },
      { $group: { _id: null, totalQty: { $sum: "$quantityKg" } } }
    ]);

    const availableQuantity = Number((availableAgg[0]?.totalQty || 0).toFixed(2));
    const lowSupplyThreshold = Number((averageWeeklyDemand * 0.7).toFixed(2));
    const lowSupply = availableQuantity < lowSupplyThreshold;

    res.json({
      productName,
      weeklyAverages: weekly,
      averageWeeklyDemand,
      availableQuantity,
      lowSupplyThreshold,
      message: lowSupply
        ? "Price hike expected due to low supply"
        : "Supply level is stable for current demand"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
