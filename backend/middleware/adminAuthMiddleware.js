const jwt = require("jsonwebtoken");

const adminProtect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔐 Incoming auth header:", authHeader);
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ Decoded token:", decoded);

    if (!decoded.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.admin = decoded; // attach admin info to req
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = adminProtect;
