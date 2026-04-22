// index.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Smart Agriculture API is running smoothly!",
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
app.post("/api/pump/control", async (req, res) => {
  try {
    const { command } = req.body;

    if (command !== "ON" && command !== "OFF") {
      return res.status(400).json({
        status: "error",
        message: "Perintah tidak valid. Gunakan 'ON' atau 'OFF'.",
      });
    }

    const nodeRedUrl = "http://103.93.160.128:1880/kebun/pompa/cmd";

    const response = await fetch(nodeRedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: command }),
    });

    if (!response.ok) {
      throw new Error(`Node-RED merespons dengan status: ${response.status}`);
    }

    res.json({
      status: "success",
      message: `Perintah pompa [${command}] berhasil diteruskan ke sistem OT.`,
    });
  } catch (error) {
    console.error("Error saat menghubungi Node-RED:", error.message);
    res.status(500).json({
      status: "error",
      message: "Gagal menghubungi Node-RED Backend.",
      detail: error.message,
    });
  }
});

// Run server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
