# 🌱 Smart Agriculture IoT Backend - Capstone Project

This repository contains the backend service for the Smart Agriculture Capstone Project. Built with Express.js, this application acts as an **API Gateway** bridging the Information Technology (IT) layer (Frontend/ReactJS) with the Operational Technology (OT) layer (Node-RED, MQTT, ESP32).

## 🏗️ Architecture Overview

To maintain a clean Separation of Concerns and ensure enterprise-grade security, this backend sits between the user-facing application and the hardware infrastructure:
- **Frontend requests** are sent here for validation and logging.
- **Hardware control (Pump)** commands are securely forwarded to the Node-RED Rule Engine via HTTP, which then publishes to the MQTT Broker.
- **Telemetry data (Sensors)** is aggregated by Node-RED and fetched by this API to serve a clean, unified JSON to the frontend.
- **Data Persistence** is handled using PostgreSQL for relational records (Users, Crops, Logs) and InfluxDB for time-series telemetry.

## 🚀 Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via `pg` driver)
- **Environment Management:** `dotenv`
- **Cross-Origin Resource Sharing:** `cors`

## 📂 Folder Structure

```text
iot_express_api/
├── config/
│   └── db.js              # PostgreSQL connection pool setup
├── routes/
│   ├── pumpRoutes.js      # Endpoints for actuator/pump control
│   └── sensorRoutes.js    # Endpoints for retrieving sensor telemetry
├── .env                   # Environment variables (Ignored in Git)
├── .gitignore             # Ignored files and directories
├── index.js               # Application entry point & global middlewares
├── package.json           # Project metadata and dependencies
└── README.md              # Project documentation

🛠️ Prerequisites
Before you begin, ensure you have met the following requirements:

Node.js installed (v16.x or higher recommended)

PostgreSQL database up and running

Node-RED and MQTT broker running on your OT server/VPS

⚙️ Installation & Local Setup
1. Clone the repository:
git clone git@github.com:hanifahmadzakir/capstone_project_iot_express_backend.git
cd iot_express_api

2. Install depedencies
npm install

3. Configure Environment Variables:
Create a .env file in the root directory and configure your database credentials:
PORT=3001
DB_USER=admin
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=capstone_db

4. Run dev server
npm run dev
The server will start on http://localhost:3001.

📡 API Documentation
1. General Routes
GET /

Description: Health check endpoint.

Response: 200 OK

JSON
{
  "status": "success",
  "message": "Smart Agriculture API is running smooth operator!"
}
2. Sensor Routes (/api/sensor)
GET /api/sensor/latest

Description: Fetches the most recent aggregated telemetry data (Temperature, Humidity, Light Intensity, Soil Moisture) from the Node-RED memory.

Response: 200 OK

JSON
{
  "status": "success",
  "data": {
    "temperature": 28.5,
    "humidity": 75.2,
    "light_intensity": 12450,
    "soil_moisture": 65
  }
}
3. Pump Control Routes (/api/pump)
POST /api/pump/control

Description: Sends a command to turn the irrigation pump ON or OFF.

Body (JSON):

JSON
{
  "command": "ON" 
}
(Accepted values: "ON" or "OFF")

Response: 200 OK

JSON
{
  "status": "success",
  "message": "Command pump [ON] successfully forwarded to OT."
}
