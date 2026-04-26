const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/auth");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Authorization token has expired." });
    }

    return res.status(401).json({ message: "Invalid authorization token." });
  }
};

module.exports = authMiddleware;
