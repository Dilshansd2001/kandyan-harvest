const mongoose = require("mongoose");
require("dotenv").config();

const Delivery = require("./src/models/Delivery");
const Driver = require("./src/models/Driver");
const Farmer = require("./src/models/Farmer");
const Supermarket = require("./src/models/Supermarket");
const Harvest = require("./src/models/Harvest");
const Order = require("./src/models/Order");

const mapProfileId = async (Model, id) => {
  if (!id) return null;

  // If already a profile id, keep it
  const byId = await Model.findById(id);
  if (byId) return id;

  // Otherwise, treat it as a User id and map via user field
  const byUser = await Model.findOne({ user: id });
  if (byUser) return byUser._id;

  return id;
};

const migrate = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let deliveryUpdates = 0;
  let harvestUpdates = 0;
  let orderUpdates = 0;

  const deliveries = await Delivery.find();
  for (const d of deliveries) {
    const newDriver = await mapProfileId(Driver, d.driver);
    const newFarmer = await mapProfileId(Farmer, d.farmer);
    const newSupermarket = await mapProfileId(Supermarket, d.supermarket);

    if (
      String(newDriver || "") !== String(d.driver || "") ||
      String(newFarmer || "") !== String(d.farmer || "") ||
      String(newSupermarket || "") !== String(d.supermarket || "")
    ) {
      d.driver = newDriver;
      d.farmer = newFarmer;
      d.supermarket = newSupermarket;
      await d.save();
      deliveryUpdates += 1;
    }
  }

  const harvests = await Harvest.find();
  for (const h of harvests) {
    const newFarmer = await mapProfileId(Farmer, h.farmer);
    if (String(newFarmer || "") !== String(h.farmer || "")) {
      h.farmer = newFarmer;
      await h.save();
      harvestUpdates += 1;
    }
  }

  const orders = await Order.find();
  for (const o of orders) {
    const newFarmer = await mapProfileId(Farmer, o.farmer);
    const newSupermarket = await mapProfileId(Supermarket, o.supermarket);
    if (
      String(newFarmer || "") !== String(o.farmer || "") ||
      String(newSupermarket || "") !== String(o.supermarket || "")
    ) {
      o.farmer = newFarmer;
      o.supermarket = newSupermarket;
      await o.save();
      orderUpdates += 1;
    }
  }

  console.log("Migration complete");
  console.log("Deliveries updated:", deliveryUpdates);
  console.log("Harvests updated:", harvestUpdates);
  console.log("Orders updated:", orderUpdates);

  await mongoose.disconnect();
};

migrate().catch((err) => {
  console.error("Migration failed:", err);
  mongoose.disconnect();
});
