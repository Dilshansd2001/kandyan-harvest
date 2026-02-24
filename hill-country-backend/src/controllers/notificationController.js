const Notification = require("../models/Notification");

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver_id: req.user._id,
      is_read: false
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      count: notifications.length,
      notifications
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        receiver_id: req.user._id
      },
      {
        is_read: true
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        receiver_id: req.user._id,
        is_read: false
      },
      {
        is_read: true
      }
    );

    res.json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
