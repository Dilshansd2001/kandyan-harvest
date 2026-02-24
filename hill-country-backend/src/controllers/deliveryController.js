const Delivery = require("../models/Delivery");
const Driver = require("../models/Driver");

exports.getDeliveryById = async (req, res) => {
  try {

    const delivery = await Delivery.findById(req.params.id)
      .populate({ path: "driver", populate: { path: "user", select: "email" } })
      .populate({ path: "farmer", populate: { path: "user", select: "email" } })
      .populate({ path: "supermarket", populate: { path: "user", select: "email" } })
      .populate("order");

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery not found"
      });
    }

    res.json(delivery);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateDeliveryStatus = async (req, res) => {
  try {

    const { status } = req.body;

    const validStatuses = [
      "REQUESTED",
      "ACCEPTED",
      "IN_TRANSIT",
      "COMPLETED"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value"
      });
    }

    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        message: "Delivery not found"
      });
    }

    // 🔐 Driver only update own delivery
    if (delivery.driver) {
      const driver = await Driver.findOne({ user: req.user._id });
      if (!driver || delivery.driver.toString() !== driver._id.toString()) {
        return res.status(403).json({
          message: "Not authorized"
        });
      }
    }

    delivery.status = status;

    await delivery.save();

    res.json({
      message: "Delivery status updated",
      delivery
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

