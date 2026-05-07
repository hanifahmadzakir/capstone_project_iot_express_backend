// routes/pumpRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Pastikan letak folder config ini sesuai

// Endpoint 1: Pump Control (Frontend -> Express -> Node-RED)
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
    const nodeRedUrl = "http://localhost:1880/kebun/pompa/cmd";
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

// Endpoint 2: recive pump log from Node-RED (Node-RED -> Express -> Database)
router.post("/log", async (req, res) => {
  try {
    const { device_id, Pump, duration_seconds, triggering_event } = req.body;

    if (Pump === "OFF" && duration_seconds > 0) {
  // 1. Kalkulasi Waktu (Start & End)
      const end_time = new Date(); 
      const start_time = new Date(end_time.getTime() - (duration_seconds * 1000)); 
  
      // 2. Kalkulasi Listrik & Biaya (Gunakan Angka Asli / Real)
      const power_kW = 0.06;
      const duration_hours = duration_seconds / 3600.0;
      const total_electric_kwh = power_kW * duration_hours;
      
      const total_cost = total_electric_kwh * 1500;

      const event_type = triggering_event || "Manual Trigger";

      // 3. Save data to Database
      const query = `
        INSERT INTO pump_logs 
        (device_id, start_time, end_time, duration_seconds, total_electric_kwh, total_cost, triggering_event)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      
      const values = [
        device_id, 
        start_time, 
        end_time, 
        duration_seconds,
        total_electric_kwh, 
        total_cost, 
        event_type
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        status: "success",
        message: "Log pompa berhasil dihitung dan dicatat!",
        data: result.rows[0],
      });
    } else {
      res.status(200).json({
        status: "ignored",
        message: "Only logs for OFF state are recorded.",
      });
    }
  } catch (error) {
    console.error("Error saving pump log:", error.message);
    res
      .status(500)
      .json({
        status: "error failed to save pump log.",
        detail: error.message,
      });
  }
});

module.exports = router;
