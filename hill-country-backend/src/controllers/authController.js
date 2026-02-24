const User = require("../models/User");
const Farmer = require("../models/Farmer");
const Supermarket = require("../models/Supermarket");
const Driver = require("../models/Driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

function getMailTransport() {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback transport for local/dev: logs the email payload instead of sending.
  return nodemailer.createTransport({ jsonTransport: true });
}

async function sendResetPasswordEmail(to, resetUrl) {
  const transport = getMailTransport();
  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || "no-reply@hillcountryinnovators.lk",
    to,
    subject: "Reset your password",
    text: `You requested a password reset. Open this link: ${resetUrl}. This link expires in 15 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2 style="color:#2e7d32;">Reset your password</h2>
        <p>You requested a password reset for your account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;background:#2e7d32;color:#fff;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>This link expires in <strong>15 minutes</strong>.</p>
      </div>
    `
  });

  if (info?.message) {
    console.log("Reset email payload:", info.message.toString());
  }
}

exports.register = async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);
    console.log("REGISTER FILES:", req.files);

    const {
      email,
      password,
      role,
      farmName,
      businessName,
      fullName,
      nic,
      contactNumber,
      district,
      licenseNumber,
      vehicleType,
      vehicleNumber,
      loadCapacityKg,
      serviceDistrict,
      address
    } = req.body;
    const vehicle = req.body.vehicle || req.body.vehicleType;

    const licenseFront = req.files?.licenseFront?.[0]?.filename || null;
    const licenseRear = req.files?.licenseRear?.[0]?.filename || null;
    const brnDoc = req.files?.brnDoc?.[0]?.filename || null;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    const roles = ["farmer", "supermarket", "driver", "admin"];
    if (!roles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (role === "admin") {
      return res.status(403).json({
        message: "Admin registration not allowed"
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
      role,
      vehicle,
      licenseFront,
      licenseRear,

      // ⭐ ADMIN AUTO APPROVE
      isVerified: false
    });

    if (role === "farmer") {
      await Farmer.create({
        user: user._id,
        farmName: farmName || "",
        fullName: fullName || "",
        nic: nic || "",
        contactNumber: contactNumber || req.body.phone || "",
        district: district || ""
      });
    }

    if (role === "supermarket") {
      await Supermarket.create({
        user: user._id,
        businessName: businessName || "",
        businessType: req.body.businessType || "Supermarket",
        brn: req.body.brn || "",
        address: req.body.address || "",
        phone: contactNumber || req.body.phone || "",
        businessEmail: req.body.businessEmail || email || "",
        contactPerson: req.body.contactPerson || fullName || "",
        registrationDocument: brnDoc || null
      });
    }

    if (role === "driver") {
      await Driver.create({
        user: user._id,
        fullName: fullName || "",
        nic: nic || "",
        phone: contactNumber || req.body.phone || "",
        email: email || "",
        address: address || "",
        serviceDistrict: serviceDistrict || "",
        licenseNumber: licenseNumber || "",
        vehicleType: vehicleType || "",
        vehicleNumber: vehicleNumber || "",
        loadCapacityKg: Number(loadCapacityKg || 0),
        licenseImage: licenseFront || null
      });
    }

    res.status(201).json({
      message: "Registered. Waiting for admin approval",
      userId: user._id
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Admin approval required" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Return generic response even if no user exists (avoid account enumeration).
    if (!user) {
      return res.json({
        message: "If this email exists, a password reset link has been sent."
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5000";
    const resetUrl = `${frontendBase}/reset-password/${rawToken}`;

    await sendResetPasswordEmail(user.email, resetUrl);

    res.json({
      message: "If this email exists, a password reset link has been sent."
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token || req.body.token;
    const password = req.body.password;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

