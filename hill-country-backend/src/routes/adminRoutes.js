const router = require("express").Router();

const auth = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/adminMiddleware");

const {
  getAllUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllOrders,
  getOrderById,
  getAllDeliveries,
  getDeliveryById,
  getActiveDeliveries,
  getCompletedDeliveries
} = require("../controllers/adminController");

// USERS
router.get("/users", auth, isAdmin, getAllUsers);
router.get("/users/pending", auth, isAdmin, getPendingUsers);
router.put("/users/:id/approve", auth, isAdmin, approveUser);
router.put("/users/:id/reject", auth, isAdmin, rejectUser);

// ORDERS
router.get("/orders", auth, isAdmin, getAllOrders);
router.get("/orders/:id", auth, isAdmin, getOrderById);

// DELIVERIES
router.get("/deliveries", auth, isAdmin, getAllDeliveries);
router.get("/deliveries/active", auth, isAdmin, getActiveDeliveries);
router.get("/deliveries/completed", auth, isAdmin, getCompletedDeliveries);
router.get("/deliveries/:id", auth, isAdmin, getDeliveryById);


module.exports = router;
