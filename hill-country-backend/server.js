const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { initSocket } = require("./src/socket");

const app = express();
const server = http.createServer(app);

// middleware
app.use(cors());
app.use(express.json());

// 🔥 TEST ROUTE (must work)
app.get("/ping", (req, res) => {
  res.send("API WORKING ✅");
});

// routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/harvest", require("./src/routes/harvestRoutes"));
app.use("/api/orders", require("./src/routes/orderRoutes"));
app.use("/api/supermarket", require("./src/routes/supermarketRoutes"));
app.use("/api/farmer", require("./src/routes/farmerRoutes"));
app.use("/api/driver", require("./src/routes/driverRoutes"));
app.use("/api/marketplace", require("./src/routes/marketplaceRoutes"));
app.use("/api/driver", require("./src/routes/driverRoutes"));
app.use("/api", require("./src/routes/deliveryRoutes"));
app.use("/api/meta", require("./src/routes/metaRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/uploads", express.static("uploads"));
app.get("/reset-password/:token", (req, res) => {
  res.sendFile(path.join(__dirname, "../hill-country-frontend/reset-password.html"));
});
app.use(express.static(path.join(__dirname, "../hill-country-frontend")));







// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// start server
const PORT = process.env.PORT || 5000;
initSocket(server);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
