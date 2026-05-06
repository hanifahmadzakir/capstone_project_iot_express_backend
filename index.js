// index.js
const express = require("express");
const cors = require("cors");
require('dotenv').config();
const pool = require('./config/db');

//import routes
const pumpRoutes = require('./routes/pumpRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const cropRoutes = require('./routes/cropRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Main Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Smart Agriculture API is running smooth operator!",
  });
});

// Endpoint Pump Control (Frontend -> Express -> Node-RED)
app.use("/api/pump", pumpRoutes);

// Endpoint Get Latest Telemetry (Frontend -> Express -> Node-RED)
app.use("/api/sensor", sensorRoutes);

// Crop Routes
app.use("/api/crops", cropRoutes);

// Device Routes
app.use("/api/devices", deviceRoutes);

// 404 handler error 
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Endpoint ${req.originalUrl} Not found.`,
  });
});

// Run server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// --- GRACEFUL SHUTDOWN HANDLER ---
const gracefulShutdown = () => {
  console.log("\n[SYSTEM] Menerima sinyal terminasi. Menjalankan Graceful Shutdown...");
  
  // 1. Berhenti menerima request HTTP baru
  server.close(() => {
    console.log("[SYSTEM] HTTP Server ditutup. Tidak ada request baru yang diterima.");
    
    // 2. Tutup koneksi Pool PostgreSQL dengan aman
    pool.end(() => {
      console.log("[SYSTEM] Koneksi PostgreSQL Pool berhasil ditutup.");
      process.exit(0);
    });
  });

  // Failsafe:
  setTimeout(() => {
    console.error("[SYSTEM] Shutdown memakan waktu terlalu lama. Mematikan paksa!");
    process.exit(1);
  }, 10000);
};

// Menangkap sinyal SIGTERM (dari sistem seperti Docker / VPS)
process.on('SIGTERM', gracefulShutdown);

// Menangkap sinyal SIGINT (dari terminal lokal saat menekan Ctrl+C)
process.on('SIGINT', gracefulShutdown);