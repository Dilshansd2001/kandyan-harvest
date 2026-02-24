const router = require("express").Router();

const auth = require("../middlewares/authMiddleware");

const {
  getProfile,
  updateProfile,
  getActiveDeliveries,
  getCompletedDeliveries
} = require("../controllers/supermarketController");

// GET profile
router.get("/profile", auth, getProfile);

// UPDATE profile
router.put("/profile", auth, updateProfile);

// Deliveries
router.get("/deliveries/active", auth, getActiveDeliveries);
router.get("/deliveries/completed", auth, getCompletedDeliveries);

module.exports = router;
