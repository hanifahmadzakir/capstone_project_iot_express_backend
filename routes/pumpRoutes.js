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
    const nodeRedUrl = `${process.env.NODE_RED_BASE_URL}/kebun/pompa/cmd`;
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
    // Hapus 'triggering_event' dari destructuring, kita akan buat sendiri secara cerdas
    const { device_id, Pump, duration_seconds } = req.body;

    if (Pump === "OFF" && duration_seconds > 0) {
      
      // ==========================================
      // 1. CEK STATUS MODE ALAT DI DATABASE
      // ==========================================
      const deviceQuery = await pool.query(
        "SELECT is_auto_mode FROM devices WHERE id = $1", 
        [device_id]
      );

      let event_type = "Unknown Trigger";
      
      if (deviceQuery.rows.length > 0) {
        const isAuto = deviceQuery.rows[0].is_auto_mode;
        event_type = isAuto ? "Automated System (Rules Engine)" : "Manual Trigger (Frontend/UI)";
      }

      // ==========================================
      // 2. Kalkulasi Waktu & Biaya
      // ==========================================
      const end_time = new Date(); 
      const start_time = new Date(end_time.getTime() - (duration_seconds * 1000)); 
  
      const power_kW = 0.06;
      const duration_hours = duration_seconds / 3600.0;
      const total_electric_kwh = power_kW * duration_hours;
      const total_cost = total_electric_kwh * 1500;

      // ==========================================
      // 3. Save data to Database
      // ==========================================
      const query = `
        INSERT INTO pump_logs 
        (device_id, start_time, end_time, duration_seconds, total_electric_kwh, total_cost, triggering_event)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      
      // Gunakan event_type yang sudah kita deteksi secara otomatis
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
        status: "error",
        message: "Failed to save pump log.",
        detail: error.message,
      });
  }
});

router.get("/log", async (req, res) => {
  try {
    const { device_id, limit = 50 } = req.query; 
    
    let query = `
      SELECT id, device_id, start_time, end_time, duration_seconds, 
             total_electric_kwh, total_cost, triggering_event 
      FROM pump_logs
    `;
    let values = [];

    // if frontend ask spesific device_id, filter by that, otherwise return all logs (up to limit)
    if (device_id) {
      query += ` WHERE device_id = $1 ORDER BY end_time DESC LIMIT $2`;
      values = [device_id, limit];
    } else {
      // if no device_id specified, return all logs with limit
      query += ` ORDER BY end_time DESC LIMIT $1`;
      values = [limit];
    }

    const result = await pool.query(query, values);

    res.status(200).json({
      status: "success",
      message: "Berhasil mengambil riwayat kalkulasi pompa",
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching pump logs:", error.message);
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil riwayat log pompa",
      detail: error.message
    });
  }
});

module.exports = router;
