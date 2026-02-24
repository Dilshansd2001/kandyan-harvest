const router = require("express").Router();

const auth = require("../middlewares/authMiddleware");

const {
  getDeliveryById,
  updateDeliveryStatus
} = require("../controllers/deliveryController");

// GET delivery details
router.get("/deliveries/:id", auth, getDeliveryById);

// UPDATE delivery status
router.put("/deliveries/:id/status", auth, updateDeliveryStatus);

module.exports = router;