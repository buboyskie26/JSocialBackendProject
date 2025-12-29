const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifiedUser = (req, res, next) => {
  const token =
    req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // { userId: ... }
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};
