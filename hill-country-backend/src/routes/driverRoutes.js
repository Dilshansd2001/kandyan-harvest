const router = require("express").Router();

const auth = require("../middlewares/authMiddleware");

const {
  getAvailableDeliveries,
  acceptDelivery,
  startDelivery,
  completeDelivery,
  getActiveDeliveries,
  getCompletedDeliveries
} = require("../controllers/driverDeliveryController");

// Available requests
router.get("/deliveries", auth, getAvailableDeliveries);
router.get("/deliveries/available", auth, getAvailableDeliveries);

// Accept request
router.put("/deliveries/:id/accept", auth, acceptDelivery);

// Start delivery
router.put("/deliveries/:id/start", auth, startDelivery);

// Complete delivery
router.put("/deliveries/:id/complete", auth, completeDelivery);

router.get("/deliveries/active", auth, getActiveDeliveries);
router.get("/deliveries/completed", auth, getCompletedDeliveries);

module.exports = router;
