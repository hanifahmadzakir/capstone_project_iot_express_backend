// routes/pumpRoutes.js
const express = require("express");
const router = express.Router();

// Endpoint Pump Control (Frontend -> Express -> Node-RED)
router.post("/control", async (req, res) => {
  try {
    const { command } = req.body;

    // Validasi input
    if (command !== "ON" && command !== "OFF") {
      return res.status(400).json({
        status: "error",
        message: "Command is not valid. Use 'ON' or 'OFF'.",
      });
    }

    // Hit API Node-RED
    const nodeRedUrl = "http://103.93.160.128:1880/kebun/pompa/cmd";
    const response = await fetch(nodeRedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: command }),
    });

    if (!response.ok) {
      throw new Error(`Node-RED response with status: ${response.status}`);
    }

    res.json({
      status: "success",
      message: `Command pump [${command}] successfully forwarded to OT.`,
    });
  } catch (error) {
    console.error("Error while reaching Node-RED:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to connect to Node-RED Backend.",
      detail: error.message,
    });
  }
});

module.exports = router;
