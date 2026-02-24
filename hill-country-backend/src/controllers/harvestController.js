const Harvest = require("../models/Harvest");
const Farmer = require("../models/Farmer");

// Marketplace harvest list
exports.getMarketplace = async (req, res) => {
  try {
    const harvests = await Harvest.find({ status: "AVAILABLE" })
      .populate({
        path: "farmer",
        select: "farmName",
        populate: { path: "user", select: "email" }
      })
      .sort({ createdAt: -1 });

    const normalizedHarvests = harvests.map((harvest) => {
      const item = harvest.toObject();
      const desc = (item.description || "").toString().trim();
      item.description = desc || "Details not available";
      return item;
    });

    res.json(normalizedHarvests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADD harvest
exports.addHarvest = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const images = req.files ? req.files.map((f) => f.filename) : [];

    const harvest = await Harvest.create({
      farmer: farmer._id,
      productName: req.body.productName,
      category: req.body.category,
      district: req.body.district,
      quantityKg: req.body.quantityKg,
      pricePerKg: null,
      availableDate: req.body.availableDate,
      description: req.body.description,
      pickupLocation: {
        address: req.body.address,
        lat: req.body.lat ? Number(req.body.lat) : undefined,
        lng: req.body.lng ? Number(req.body.lng) : undefined
      },
      images
    });

    res.status(201).json(harvest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET own harvest list
exports.getMyHarvests = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const harvests = await Harvest.find({ farmer: farmer._id })
      .sort({ createdAt: -1 });

    res.json(harvests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE harvest
exports.updateHarvest = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const harvest = await Harvest.findOne({
      _id: req.params.id,
      farmer: farmer._id
    });

    if (!harvest) {
      return res.status(404).json({ message: "Harvest not found" });
    }

    harvest.productName = req.body.productName ?? harvest.productName;
    harvest.quantityKg = req.body.quantityKg ?? harvest.quantityKg;
    harvest.pricePerKg = null;
    harvest.availableDate = req.body.availableDate ?? harvest.availableDate;
    harvest.description = req.body.description ?? harvest.description;
    harvest.category = req.body.category ?? harvest.category;
    harvest.district = req.body.district ?? harvest.district;

    await harvest.save();

    res.json({ message: "Harvest updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE harvest
exports.deleteHarvest = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const deleted = await Harvest.findOneAndDelete({
      _id: req.params.id,
      farmer: farmer._id
    });

    if (!deleted) {
      return res.status(404).json({ message: "Harvest not found" });
    }

    res.json({ message: "Harvest deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
