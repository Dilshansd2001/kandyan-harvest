const router = require("express").Router();
const {
  getDistricts,
  getCategories
} = require("../controllers/metaController");

router.get("/districts", getDistricts);
router.get("/categories", getCategories);

module.exports = router;
