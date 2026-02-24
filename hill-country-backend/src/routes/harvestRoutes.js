const express = require("express");
const router = express.Router();

const { getMarketplace } = require("../controllers/harvestController");

// Marketplace harvest list
router.get("/marketplace", getMarketplace);

module.exports = router;
