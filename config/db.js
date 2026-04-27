// config/db.js
const { Pool } = require("pg");
require("dotenv").config(); // Membaca file .env

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Tes koneksi
pool.connect((err, client, release) => {
  if (err) {
    console.error("failed to connect to PostgreSQL:", err.stack);
  } else {
    console.log("Success connected to PostgreSQL Database");
  }
  if (client) release();
});

module.exports = pool;
