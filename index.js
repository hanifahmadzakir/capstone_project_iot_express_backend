// index.js
const express = require("express");
const cors = require("cors");
require('dotenv').config();
const pool = require('./config/db');

//import routes
const pumpRoutes = require('./routes/pumpRoutes');
const sensorRoutes = require('./routes/sensorRoutes');


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Smart Agriculture API is running smooth operator!",
  });
});

// Endpoint Dummy
app.get("/api/crops", (req, res) => {
  const dummyCrops = [
    { id: 1, name: "Cabai Merah", min_moisture: 40.5 },
    { id: 2, name: "Tomat", min_moisture: 50.0 },
  ];

  res.json({
    status: "success",
    data: dummyCrops,
  });
});

// Endpoint Pump Control (Frontend -> Express -> Node-RED)
app.use("/api/pump", pumpRoutes);


// Endpoint Get Latest Telemetry (Frontend -> Express -> Node-RED)
app.use("/api/sensor", sensorRoutes);

// 404 handler error 
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Endpoint ${req.originalUrl} Not found.`,
  });
});

// Run server
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
