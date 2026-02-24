const Notification = require("../models/Notification");
const { getIO } = require("../socket");

async function createAndEmitNotification({
  senderId = null,
  receiverId,
  message,
  orderId = null,
  deliveryId = null
}) {
  if (!receiverId || !message) {
    return null;
  }

  const notification = await Notification.create({
    sender_id: senderId || null,
    receiver_id: receiverId,
    message,
    order_id: orderId || null,
    delivery_id: deliveryId || null,
    is_read: false
  });

  try {
    const io = getIO();
    io.to(`user:${receiverId.toString()}`).emit("new_notification", {
      notificationId: notification._id,
      sender_id: notification.sender_id,
      receiver_id: notification.receiver_id,
      message: notification.message,
      order_id: notification.order_id,
      delivery_id: notification.delivery_id,
      is_read: notification.is_read,
      timestamp: notification.timestamp
    });
  } catch (err) {
    console.error("Notification emit failed:", err.message);
  }

  return notification;
}

module.exports = { createAndEmitNotification };
