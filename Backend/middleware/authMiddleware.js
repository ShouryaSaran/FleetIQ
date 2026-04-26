const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/auth");
const logger = require("../config/logger");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const route = `${req.method} ${req.path}`;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn(`[MIDDLEWARE] No token provided for ${route}`);
    return res.status(401).json({ message: "Authorization token is required." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    logger.debug(`[MIDDLEWARE] Route accessed: ${route} user=${decoded.username} role=${decoded.role_name}`);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      logger.warn(`[MIDDLEWARE] Token expired for ${route}`);
      return res.status(403).json({ message: "Authorization token has expired." });
    }
    logger.warn(`[MIDDLEWARE] Invalid token for ${route}`);
    return res.status(401).json({ message: "Invalid authorization token." });
  }
};

module.exports = authMiddleware;
