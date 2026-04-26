const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRole = req.user?.role_name;

    if (!userRole) {
      return res.status(403).json({ message: "User role is required." });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "You do not have permission for this action." });
    }

    next();
  };
};

module.exports = roleMiddleware;
