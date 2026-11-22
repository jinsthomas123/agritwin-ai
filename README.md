# AgriTwin AI – Smart Agriculture Digital Twin Platform

AgriTwin AI is a smart agriculture monitoring and digital twin demonstration platform built using React and FastAPI. It simulates sensor readings across multiple plantation zones, visualizes farm conditions through an interactive 3D dashboard, stores historical sensor data, and identifies potential agricultural issues through automated alerts.

## Key Features

- **3D Digital Twin:** Interactive 3D visualization of the demonstration farm.
- **Multi-Zone Monitoring:** Monitor four plantation zones independently.
- **Sensor Simulation:** Displays soil moisture, temperature, humidity, and soil pH readings.
- **Historical Analytics:** Visualizes historical sensor readings through charts and records.
- **Automated Alerts:** Detects abnormal readings and generates alerts.
- **Alert History:** Stores and displays previously generated alerts.
- **Database Integration:** Uses SQLite to persist sensor records and alert history.
- **Auto Refresh:** Periodically refreshes dashboard data.

## Technology Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS
- React Three Fiber / Three.js

**Backend**
- Python
- FastAPI
- Uvicorn

**Database**
- SQLite

## System Architecture

```text
React Dashboard
      |
      | HTTP API Requests
      v
FastAPI Backend
      |
      +---- Sensor Simulation
      |
      +---- Alert Detection
      |
      +---- Historical Data
      |
      v
SQLite Database
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Backend health |
| GET | `/api/farm/overview` | Farm overview |
| GET | `/api/sensors` | Sensor readings |
| GET | `/api/alerts` | Active alerts |
| GET | `/api/history/{zone_id}` | Zone history |
| GET | `/api/alert-history` | Historical alerts |
| GET | `/api/database/summary` | Database summary |

Interactive API documentation is available at:

`http://127.0.0.1:8013/docs`

## Getting Started

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd agritwin-ai
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```cmd
venv\Scripts\activate
```

Install dependencies:

```bash
pip install fastapi uvicorn
```

Start the API:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8013
```

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

`http://localhost:5173`

## Alert Detection Rules

The demonstration backend checks sensor readings against configured thresholds:

- Soil moisture below 40%: Critical alert.
- Temperature above 30°C: Warning.
- Humidity above 90%: Warning.
- Soil pH below 4.5 or above 6.5: Warning.

Duplicate alerts are suppressed within a five-minute window for the same zone, title, and severity.

## Project Status

The current version demonstrates simulated sensor monitoring, interactive farm visualization, historical analytics, automated threshold-based alerts, and database persistence.

**Note:** Sensor readings are simulated. Physical IoT sensor integration is not included in the current version.

## Future Enhancements

- Real IoT sensor integration.
- Machine learning-based crop health prediction.
- Weather API integration.
- Irrigation recommendations.
- User authentication and role-based access.
- Cloud deployment and remote monitoring.

## Author

Developed as an AI and smart agriculture technology project.
