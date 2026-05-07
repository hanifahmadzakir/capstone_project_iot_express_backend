// routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET: Ambil semua daftar perangkat beserta info tanamannya
router.get("/", async (req, res) => {
  try {
    // Query untuk mengambil data perangkat beserta info tanaman yang dipilih
    const query = `
      SELECT d.id, d.device_name, d.mqtt_topic, d.current_status, d.last_seen,
             c.name AS crop_name, c.min_moisture, c.max_moisture
      FROM devices d
      LEFT JOIN crop c ON d.selected_crop_id = c.id
    `;
    const result = await pool.query(query);
    
    res.json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching devices:", error.message);
    res.status(500).json({ status: "error", message: "Gagal mengambil data perangkat" });
  }
});

// POST: Daftarkan perangkat ESP32 baru
router.get("/register", async (req, res) => {
    // Note: place holder
});

router.post("/register", async (req, res) => {
  try {
    const { user_id, selected_crop_id, device_name, mqtt_topic } = req.body;

    // Validasi input dasar
    if (!user_id || !selected_crop_id || !device_name || !mqtt_topic) {
      return res.status(400).json({
        status: "error",
        message: "Semua field (user_id, selected_crop_id, device_name, mqtt_topic) harus diisi!"
      });
    }

    const query = `
      INSERT INTO devices (user_id, selected_crop_id, device_name, mqtt_topic, current_status, last_seen, update_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      RETURNING *;
    `;
    
    const values = [user_id, selected_crop_id, device_name, mqtt_topic];
    const result = await pool.query(query, values);

    res.status(201).json({
      status: "success",
      message: "Perangkat ESP32 berhasil didaftarkan!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error registering device:", error.message);
    res.status(500).json({ status: "error", message: "Gagal mendaftarkan perangkat", detail: error.message });
  }
});

// Endpoint untuk Update Status Device (Dari LWT / Node-RED)
router.patch("/status", async (req, res) => {
  try {
    const { device_id, status } = req.body;

    if (!device_id || !status) {
      return res.status(400).json({ status: "error", message: "device_id dan status wajib diisi" });
    }

    // Konversi status teks ke Boolean (ONLINE = true, OFFLINE = false)
    const isOnline = status.toUpperCase() === "ONLINE";
    const lastSeen = new Date(); // Update waktu terakhir alat terdeteksi

    const query = `
      UPDATE devices 
      SET current_status = $1, last_seen = $2, update_at = $2
      WHERE id = $3
      RETURNING id, device_name, current_status, last_seen;
    `;
    
    const result = await pool.query(query, [isOnline, lastSeen, device_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Device tidak ditemukan" });
    }

    res.json({
      status: "success",
      message: `Status device berhasil diubah menjadi ${status}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating device status:", error);
    res.status(500).json({ status: "error", message: "Gagal update status device" });
  }
});

router.patch("/:id/mode", async (req, res) => {
  try {
    const { is_auto_mode } = req.body;
    const deviceId = req.params.id;

    if (typeof is_auto_mode !== 'boolean') {
      return res.status(400).json({ status: "error", message: "is_auto_mode harus berupa boolean (true/false)" });
    }

    const query = `
      UPDATE devices 
      SET is_auto_mode = $1, update_at = NOW()
      WHERE id = $2
      RETURNING id, device_name, is_auto_mode;
    `;
    
    const result = await pool.query(query, [is_auto_mode, deviceId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Device tidak ditemukan" });
    }

    const modeName = is_auto_mode ? "AUTO" : "MANUAL";
    res.json({
      status: "success",
      message: `Mode device berhasil diubah ke ${modeName}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating device mode:", error);
    res.status(500).json({ status: "error", message: "Gagal update mode device" });
  }
});

// Endpoint untuk Mengganti Tanaman pada Device
router.patch("/:id/crop", async (req, res) => {
  try {
    const { selected_crop_id } = req.body;
    const deviceId = req.params.id;

    if (!selected_crop_id) {
      return res.status(400).json({ status: "error", message: "selected_crop_id wajib diisi" });
    }

    const query = `
      UPDATE devices 
      SET selected_crop_id = $1, update_at = NOW()
      WHERE id = $2
      RETURNING id, device_name, selected_crop_id;
    `;
    
    const result = await pool.query(query, [selected_crop_id, deviceId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Device tidak ditemukan" });
    }

    res.json({
      status: "success",
      message: "Tanaman pada device berhasil diganti",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating device crop:", error);
    res.status(500).json({ status: "error", message: "Gagal mengganti tanaman" });
  }
}); 
module.exports = router;