require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const adminRoutes = require("./routes/admin");
const adminApiRoutes = require("./routes/admins");
const studentsRoutes = require("./routes/students");
const logsRoutes = require("./routes/logs");
const hardwareRoutes = require("./routes/hardware");
const announcementsRoutes = require("./routes/announcements");
const schedulesRoutes = require("./routes/schedules");
const kioskController = require("./controllers/kioskController");
const { testConnection } = require("./database/db");
const { startAutoReportScheduler } = require("./services/reportService");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions keep the prototype admin area local and simple for beginners.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "iwatar-local-dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(path.join(__dirname, "public"), { index: false }));
app.use("/vendor/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
app.use("/vendor/bootstrap-icons", express.static(path.join(__dirname, "node_modules/bootstrap-icons/font")));

app.get("/", kioskController.showKiosk);

app.get("/api/health", async (req, res) => {
  const database = await testConnection();

  res.json({
    status: "ok",
    app: "iwatar-system",
    database,
    timestamp: new Date().toISOString(),
  });
});

app.use("/admin", adminRoutes);
app.use("/api/admins", adminApiRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/hardware", hardwareRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/schedules", schedulesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`IWATAR backend running at http://localhost:${PORT}`);
  startAutoReportScheduler();
});
