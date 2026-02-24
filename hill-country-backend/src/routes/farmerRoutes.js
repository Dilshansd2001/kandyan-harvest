const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const {
  addHarvest,
  getMyHarvests,
  updateHarvest,
  deleteHarvest
} = require("../controllers/harvestController");

const {
  getMyOrders,
  acceptOrder,
  rejectOrder
} = require("../controllers/farmerOrderController");

const {
  saveProfile,
  getProfile,
  analytics,
  marketAnalytics
} = require("../controllers/farmerController");

// Orders
router.get("/orders", auth, getMyOrders);
router.put("/orders/:id/accept", auth, acceptOrder);
router.put("/orders/:id/reject", auth, rejectOrder);

// Farmer profile
router.post("/profile", auth, saveProfile);
router.get("/profile", auth, getProfile);
router.get("/analytics", auth, analytics);
router.get("/market-analytics", auth, marketAnalytics);

// Harvest / stock
router.post("/add-harvest", auth, upload.array("images", 5), addHarvest);
router.post("/harvest", auth, upload.array("images", 5), addHarvest);
router.get("/harvest", auth, getMyHarvests);
router.put("/harvest/:id", auth, updateHarvest);
router.delete("/harvest/:id", auth, deleteHarvest);

module.exports = router;
