const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {

  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  try {
    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid token"
      });
    }

    req.user = user;
    next();

  } catch (err) {
    res.status(401).json({
      message: "Token invalid"
    });
  }

};
