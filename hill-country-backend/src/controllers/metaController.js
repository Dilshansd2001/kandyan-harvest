const districts = require("../constants/districts");
const categories = require("../constants/categories");

exports.getDistricts = (req, res) => {
  res.json(districts);
};

exports.getCategories = (req, res) => {
  res.json(categories);
};
