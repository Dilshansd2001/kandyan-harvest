const router = require("express").Router();

const {
  getAllHarvests,
  getHarvestById,
  searchHarvests
} = require("../controllers/marketplaceController");

// marketplace browsing
router.get("/", getAllHarvests);
router.get("/search", searchHarvests);
router.get("/:id", getHarvestById);

module.exports = router;
