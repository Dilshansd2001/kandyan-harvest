const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require("../controllers/notificationController");

router.get("/my", auth, getMyNotifications);
router.put("/read-all", auth, markAllNotificationsRead);
router.put("/:id/read", auth, markNotificationRead);

module.exports = router;
