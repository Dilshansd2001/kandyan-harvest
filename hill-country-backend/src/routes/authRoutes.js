const router = require("express").Router();
const auth = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");


const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

router.post(
  "/register",
  upload.fields([
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseRear", maxCount: 1 }
  ]),

  register
);

 
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", auth, getMe);
router.post("/logout", auth, logout);

module.exports = router;
