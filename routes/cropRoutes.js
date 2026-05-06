// routes/cropRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET semua data tanaman
router.get("/", async (req, res) => {
  try {
    // Query ke database PostgreSQL
    const result = await pool.query('SELECT * FROM crop ORDER BY id ASC');
    
    res.json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching crops:", error.message);
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data dari database",
      detail: error.message
    });
  }
});

// GET data tanaman berdasarkan ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM crop WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: `Tanaman dengan ID ${id} tidak ditemukan`,
      });
    }

    res.json({
      status: "success",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching crop by ID:", error.message);
    res.status(500).json({
      status: "error",
      message: "Gagal mengambil data dari database",
    });
  }
});

module.exports = router;