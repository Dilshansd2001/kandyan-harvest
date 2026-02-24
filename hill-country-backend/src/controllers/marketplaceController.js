const Harvest = require("../models/Harvest");

// Get all active harvests
exports.getAllHarvests = async (req, res) => {
  try {
    const harvests = await Harvest.find({ isActive: true })
      .populate("farmer", "email");

    res.json(harvests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single harvest by id
exports.getHarvestById = async (req, res) => {
  try {
    const harvest = await Harvest.findById(req.params.id)
      .populate("farmer", "email");

    if (!harvest) {
      return res.status(404).json({ message: "Harvest not found" });
    }

    res.json(harvest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchHarvests = async (req, res) => {
  try {

    const { district, category, availableDate } = req.query;

    let filter = { isActive: true };

    if (district) {
      filter.district = district;
    }

    if (category) {
      filter.category = category;
    }

    if (availableDate) {
      filter.availableDate = {
        $gte: new Date(availableDate)
      };
    }

    const harvests = await Harvest.find(filter)
      .populate("farmer", "email");

    res.json(harvests);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
