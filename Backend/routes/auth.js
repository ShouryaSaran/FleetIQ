const express = require("express");
const { body } = require("express-validator");

const {
  signup,
  login,
  logout,
  me,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required.")
      .isEmail()
      .withMessage("Email must be valid."),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required.")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long."),
    body("password")
      .notEmpty()
      .withMessage("Password is required.")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long."),
    body("role_id").notEmpty().withMessage("Role ID is required."),
  ],
  signup
);

router.post(
  "/login",
  [
    body("username").trim().notEmpty().withMessage("Username is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  login
);

router.post("/logout", logout);
router.get("/me", authMiddleware, me);

module.exports = router;
