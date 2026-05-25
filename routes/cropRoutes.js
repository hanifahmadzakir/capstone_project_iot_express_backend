const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ==========================================
// 1. CREATE
// Endpoint: POST /api/crops
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { name, min_moisture, max_moisture } = req.body;

    // Validasi input
    if (!name || min_moisture === undefined || max_moisture === undefined) {
      return res.status(400).json({ 
        status: "error", 
        message: "Nama tanaman, min_moisture, dan max_moisture wajib diisi" 
      });
    }

    const query = `
      INSERT INTO crop (name, min_moisture, max_moisture)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [name, min_moisture, max_moisture]);

    res.status(201).json({
      status: "success",
      message: "Tanaman baru berhasil ditambahkan",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating crop:", error.message);
    res.status(500).json({ status: "error", message: "Gagal menambahkan tanaman" });
  }
});

// ==========================================
// 2. READ ALL
// Endpoint: GET /api/crops
// ==========================================
router.get("/", async (req, res) => {
  try {
    const query = "SELECT id, name, min_moisture, max_moisture FROM crop ORDER BY id ASC;";
    const result = await pool.query(query);

    res.status(200).json({
      status: "success",
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching crops:", error.message);
    res.status(500).json({ status: "error", message: "Gagal mengambil data tanaman" });
  }
});

// ==========================================
// 3. READ ONE: Mengambil 1 Tanaman by ID
// Endpoint: GET /api/crops/:id
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM crop WHERE id = $1;";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Tanaman tidak ditemukan" });
    }

    res.status(200).json({
      status: "success",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error fetching crop by ID:", error.message);
    res.status(500).json({ status: "error", message: "Gagal mengambil data tanaman" });
  }
});

// ==========================================
// 4. UPDATE: Mengubah Data Tanaman
// Endpoint: PUT /api/crops/:id
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, min_moisture, max_moisture } = req.body;

    if (!name || min_moisture === undefined || max_moisture === undefined) {
      return res.status(400).json({ 
        status: "error", 
        message: "Nama tanaman, min_moisture, dan max_moisture wajib diisi" 
      });
    }

    const query = `
      UPDATE crop 
      SET name = $1, min_moisture = $2, max_moisture = $3
      WHERE id = $4
      RETURNING *;
    `;
    const result = await pool.query(query, [name, min_moisture, max_moisture, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Tanaman tidak ditemukan untuk diupdate" });
    }

    res.status(200).json({
      status: "success",
      message: "Data tanaman berhasil diperbarui",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating crop:", error.message);
    res.status(500).json({ status: "error", message: "Gagal memperbarui data tanaman" });
  }
});

// ==========================================
// 5. DELETE: Menghapus Data Tanaman
// Endpoint: DELETE /api/crops/:id
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM crop WHERE id = $1 RETURNING *;";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Tanaman tidak ditemukan" });
    }

    res.status(200).json({
      status: "success",
      message: `Tanaman ${result.rows[0].name} berhasil dihapus`
    });
  } catch (error) {
    console.error("Error deleting crop:", error.message);
    
    // Validasi pencegahan error dari PostgreSQL (Foreign Key Violation)
    // Error code 23503 berarti data ini sedang dipakai di tabel devices
    if (error.code === '23503') {
      return res.status(409).json({ 
        status: "error", 
        message: "Gagal menghapus! Tanaman ini sedang digunakan oleh satu atau lebih perangkat ESP32." 
      });
    }

    res.status(500).json({ status: "error", message: "Gagal menghapus tanaman" });
  }
});

module.exports = router;