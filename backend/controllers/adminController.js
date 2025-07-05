const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { findAdminByEmail } = require("../models/adminModel");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
};
