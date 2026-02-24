const router = require("express").Router();

const auth = require("../middlewares/authMiddleware");

const {
  placeOrder,
  getMyOrders,
  getOrderById
} = require("../controllers/orderController");

// Place order
router.post("/", auth, placeOrder);

// Supermarket orders
router.get("/my", auth, getMyOrders);

// Order details
router.get("/:id", auth, getOrderById);

module.exports = router;
