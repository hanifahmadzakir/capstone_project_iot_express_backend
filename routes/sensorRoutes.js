// routes/sensorRoutes.js
const express = require("express");
const router = express.Router();
const pool = require('../config/db');

// Endpoint: GET /api/sensor/latest
router.get("/latest", async (req, res) => {
  try {
    const nodeRedUrl = "http://localhost:1880/kebun/sensor/latest";
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
      message: "Failed to fetch sensor data from OT system.",
      detail: error.message,
    });
  }
});

// Endpoint Rules Engine: Mengevaluasi telemetri sensor
router.post("/evaluate", async (req, res) => {
  try {
    const { device_id, soil_moisture } = req.body;

    if (!device_id || soil_moisture === undefined) {
      return res.status(400).json({ status: "error", message: "device_id dan soil_moisture wajib dikirim" });
    }

// 1. Ambil data tanaman DAN status mode auto alat saat ini
    const query = `
      SELECT d.device_name, d.is_auto_mode, c.name as crop_name, c.min_moisture, c.max_moisture
      FROM devices d
      JOIN crop c ON d.selected_crop_id = c.id
      WHERE d.id = $1;
    `;
    
    const { rows } = await pool.query(query, [device_id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Device atau Tanaman tidak ditemukan" });
    }

    const cropInfo = rows[0];

    // --- FITUR AUTO / MANUAL ---
    // Jika mode auto dimatikan (false), langsung hentikan proses evaluasi di sini.
    if (!cropInfo.is_auto_mode) {
      return res.json({
        status: "success",
        message: "Rules Engine diabaikan karena device dalam mode MANUAL.",
        data: {
          crop: cropInfo.crop_name,
          current_moisture: soil_moisture,
          action: "IGNORED_MANUAL_MODE"
        }
      });
    }
    // ---------------------------

    let action_taken = "NONE";
    let pump_command = null;
    // 2. Evaluasi Logika (Rules Engine)
    if (soil_moisture < cropInfo.min_moisture) {
      action_taken = "TURN_ON_PUMP";
      pump_command = "ON";
    } else if (soil_moisture >= cropInfo.max_moisture) {
      action_taken = "TURN_OFF_PUMP";
      pump_command = "OFF";
    }

    // 3. Eksekusi Perintah ke Node-RED (Jika ada aksi yang harus diambil)
    if (pump_command) {
      const nodeRedUrl = "http://localhost:1880/kebun/pompa/cmd";
      
      // Kita pakai fetch untuk menembak API Pompa yang sudah kita buat sebelumnya
      await fetch(nodeRedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: pump_command }),
      });
      
      console.log(`[RULES ENGINE] Kelembapan ${soil_moisture}% (Target: ${cropInfo.min_moisture}%-${cropInfo.max_moisture}%). Mengirim perintah pompa: ${pump_command}`);
    }

    res.json({
      status: "success",
      message: "Evaluasi sensor selesai",
      data: {
        crop: cropInfo.crop_name,
        current_moisture: soil_moisture,
        action: action_taken
      }
    });

  } catch (error) {
    console.error("Error evaluating sensor data:", error);
    res.status(500).json({ status: "error", message: "Gagal mengevaluasi data sensor" });
  }
});

module.exports = router;
