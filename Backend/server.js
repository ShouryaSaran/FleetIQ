const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const logger = require("./config/logger");
const db = require("./config/db");
const carsRoutes = require("./routes/carsRoutes");
const customersRoutes = require("./routes/customersRoutes");
const suppliersRoutes = require("./routes/suppliersRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const serviceCenterRoutes = require("./routes/serviceCenterRoutes");
const salesRoutes = require("./routes/salesRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const usersRoutes = require("./routes/usersRoutes");
const authRoutes = require("./routes/auth");
const rolesRoutes = require("./routes/rolesRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = "http://localhost:5175";

const ADMIN_ONLY          = ["Admin"];
const ADMIN_MANAGER       = ["Admin", "Manager"];
const ADMIN_MANAGER_SALES = ["Admin", "Manager", "Sales Executive"];
const ADMIN_MANAGER_MECH  = ["Admin", "Manager", "Mechanic"];

const rbac = (rules) => (req, res, next) => {
  const allowed = rules[req.method] ?? rules["*"];
  if (!allowed) return next();
  return roleMiddleware(allowed)(req, res, next);
};

// HTTP request logging — only in development
if (process.env.NODE_ENV === "development") {
  morgan.token("prefix", () => "[HTTP]");
  app.use(
    morgan(":prefix :method :url :status :response-time ms", {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth and roles — no role guard needed
app.use("/api/auth", authRoutes);
app.use("/api/roles", rolesRoutes);

// Cars: GET → all roles; POST/PUT → Admin/Manager/Sales; DELETE → Admin/Manager
app.use("/api/cars", authMiddleware, rbac({
  POST:   ADMIN_MANAGER_SALES,
  PUT:    ADMIN_MANAGER_SALES,
  PATCH:  ADMIN_MANAGER_SALES,
  DELETE: ADMIN_MANAGER,
}), carsRoutes);

// Customers: GET/POST/PUT → Admin/Manager/Sales; DELETE → Admin/Manager
app.use("/api/customers", authMiddleware, rbac({
  GET:    ADMIN_MANAGER_SALES,
  POST:   ADMIN_MANAGER_SALES,
  PUT:    ADMIN_MANAGER_SALES,
  PATCH:  ADMIN_MANAGER_SALES,
  DELETE: ADMIN_MANAGER,
}), customersRoutes);

// Suppliers: all methods → Admin/Manager only
app.use("/api/suppliers", authMiddleware, rbac({
  "*": ADMIN_MANAGER,
}), suppliersRoutes);

// Inventory: GET → all roles; POST/PUT → Admin/Manager
app.use("/api/inventory", authMiddleware, rbac({
  POST:  ADMIN_MANAGER,
  PUT:   ADMIN_MANAGER,
  PATCH: ADMIN_MANAGER,
}), inventoryRoutes);

// Sales: GET/POST → Admin/Manager/Sales; DELETE → Admin/Manager
app.use("/api/sales", authMiddleware, rbac({
  GET:    ADMIN_MANAGER_SALES,
  POST:   ADMIN_MANAGER_SALES,
  DELETE: ADMIN_MANAGER,
}), salesRoutes);

// Payments: GET/POST → Admin/Manager/Sales; DELETE → Admin/Manager
app.use("/api/payments", authMiddleware, rbac({
  GET:    ADMIN_MANAGER_SALES,
  POST:   ADMIN_MANAGER_SALES,
  DELETE: ADMIN_MANAGER,
}), paymentsRoutes);

// Service records: GET/POST/PUT → Admin/Manager/Mechanic; DELETE → Admin/Manager
app.use("/api/service", authMiddleware, rbac({
  GET:    ADMIN_MANAGER_MECH,
  POST:   ADMIN_MANAGER_MECH,
  PUT:    ADMIN_MANAGER_MECH,
  PATCH:  ADMIN_MANAGER_MECH,
  DELETE: ADMIN_MANAGER,
}), serviceRoutes);

// Service centers: GET → Admin/Manager/Mechanic; POST/PUT/DELETE → Admin/Manager
app.use("/api/service-centers", authMiddleware, rbac({
  GET:    ADMIN_MANAGER_MECH,
  POST:   ADMIN_MANAGER,
  PUT:    ADMIN_MANAGER,
  PATCH:  ADMIN_MANAGER,
  DELETE: ADMIN_MANAGER,
}), serviceCenterRoutes);

// Reports: GET → Admin/Manager only
app.use("/api/reports", authMiddleware, rbac({
  GET: ADMIN_MANAGER,
}), reportsRoutes);

// User management: all methods → Admin only
app.use("/api/users", authMiddleware, rbac({
  "*": ADMIN_ONLY,
}), usersRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Smart Vehicle Inventory Management System API is running" });
});

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", message: error.message });
  }
});

logger.info("[SERVER] Starting Smart Vehicle IMS Backend...");

app.listen(PORT, () => {
  logger.info(`[SERVER] Server running on port ${PORT}`);
  logger.info(`[SERVER] Environment: ${process.env.NODE_ENV || "production"}`);
  logger.info(`[SERVER] CORS enabled for: ${CORS_ORIGIN}`);

  db.query("SELECT 1")
    .then(() => logger.info(`[SERVER] Connected to MySQL database: ${process.env.DB_NAME}`))
    .catch((err) => logger.error(`[SERVER] Database connection failed: ${err.message}`));
});
