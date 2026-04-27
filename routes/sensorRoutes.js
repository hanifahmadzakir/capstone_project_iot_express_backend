// routes/sensorRoutes.js
const express = require("express");
const router = express.Router();

// Endpoint: GET /api/sensor/latest
router.get("/latest", async (req, res) => {
  try {
    const nodeRedUrl = "http://103.93.160.128:1880/kebun/sensor/latest";
    const response = await fetch(nodeRedUrl);

    if (!response.ok) {
      throw new Error(`Node-RED response with status: ${response.status}`);
    }

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error fetching telemetry from Node-RED:", error.message);
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data sensor dari sistem OT.",
      detail: error.message,
    });
  }
});

module.exports = router;
