
from datetime import datetime, timezone, timedelta
from pathlib import Path
import random
import sqlite3
import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware


# ---------------------------------------------------------
# APPLICATION CONFIGURATION
# ---------------------------------------------------------

app = FastAPI(
    title="AgriTwin AI",
    description="Smart Cardamom Farming Digital Twin and Intelligence API",
    version="1.0.0",
)



BASE_DIR = Path(__file__).resolve().parent

DB_PATH = Path(
    os.getenv("DATABASE_PATH", str(BASE_DIR / "agritwin.db"))
)


ZONES = [
    {"zone_id": 1, "zone_name": "North Plantation"},
    {"zone_id": 2, "zone_name": "South Plantation"},
    {"zone_id": 3, "zone_name": "East Plantation"},
    {"zone_id": 4, "zone_name": "West Plantation"},
]

# Current readings are refreshed by /api/sensors.
current_readings = []


def current_timestamp():
    """Return an ISO timestamp in UTC."""
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------
# DATABASE
# ---------------------------------------------------------

def get_connection():
    connection = sqlite3.connect(DB_PATH, timeout=20)
    connection.row_factory = sqlite3.Row
    return connection


def ensure_column(connection, table_name, column_name, definition):
    """Add a missing column without deleting existing records."""
    existing = {
        row["name"]
        for row in connection.execute(
            f"PRAGMA table_info({table_name})"
        ).fetchall()
    }

    if column_name not in existing:
        connection.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"
        )


def initialize_database():
    connection = get_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS sensor_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_id INTEGER NOT NULL,
                zone_name TEXT NOT NULL,
                soil_moisture REAL,
                temperature REAL,
                humidity REAL,
                soil_ph REAL,
                rainfall REAL,
                timestamp TEXT NOT NULL
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS alert_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_id INTEGER NOT NULL,
                zone_name TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT,
                severity TEXT NOT NULL,
                type TEXT,
                timestamp TEXT NOT NULL
            )
        """)

        # Safe schema additions for databases created by earlier versions.
        sensor_columns = {
            "zone_id": "INTEGER",
            "zone_name": "TEXT",
            "soil_moisture": "REAL",
            "temperature": "REAL",
            "humidity": "REAL",
            "soil_ph": "REAL",
            "rainfall": "REAL",
            "timestamp": "TEXT",
        }

        alert_columns = {
            "zone_id": "INTEGER",
            "zone_name": "TEXT",
            "title": "TEXT",
            "message": "TEXT",
            "severity": "TEXT",
            "type": "TEXT",
            "timestamp": "TEXT",
        }

        for column, definition in sensor_columns.items():
            ensure_column(connection, "sensor_history", column, definition)

        for column, definition in alert_columns.items():
            ensure_column(connection, "alert_history", column, definition)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_sensor_zone_timestamp
            ON sensor_history(zone_id, timestamp)
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_alert_timestamp
            ON alert_history(timestamp)
        """)

        connection.commit()

    finally:
        connection.close()


initialize_database()


# ---------------------------------------------------------
# SENSOR SIMULATION
# ---------------------------------------------------------

def generate_sensor_readings():
    """
    Generate demonstration readings for four plantation zones.
    These are simulated values, not real IoT sensor readings.
    """

    global current_readings

    # Baselines deliberately vary between zones so the dashboard
    # has realistic-looking differences.
    baselines = {
        1: {
            "soil_moisture": 58,
            "temperature": 25.5,
            "humidity": 78,
            "soil_ph": 5.5,
            "rainfall": 2.5,
        },
        2: {
            "soil_moisture": 46,
            "temperature": 27.0,
            "humidity": 74,
            "soil_ph": 5.8,
            "rainfall": 1.5,
        },
        3: {
            "soil_moisture": 48,
            "temperature": 29.0,
            "humidity": 82,
            "soil_ph": 4.3,
            "rainfall": 0.8,
        },
        4: {
            "soil_moisture": 63,
            "temperature": 24.5,
            "humidity": 88,
            "soil_ph": 6.0,
            "rainfall": 3.2,
        },
    }

    readings = []
    timestamp = current_timestamp()

    for zone in ZONES:
        zone_id = zone["zone_id"]
        baseline = baselines[zone_id]

        reading = {
            "zone_id": zone_id,
            "zone_name": zone["zone_name"],
            "soil_moisture": round(
                max(0, min(100, baseline["soil_moisture"] + random.uniform(-5, 5))),
                2,
            ),
            "temperature": round(
                baseline["temperature"] + random.uniform(-2, 2),
                2,
            ),
            "humidity": round(
                max(0, min(100, baseline["humidity"] + random.uniform(-5, 5))),
                2,
            ),
            "soil_ph": round(
                max(0, min(14, baseline["soil_ph"] + random.uniform(-0.3, 0.3))),
                2,
            ),
            "rainfall": round(
                max(0, baseline["rainfall"] + random.uniform(-1, 1)),
                2,
            ),
            "timestamp": timestamp,
        }

        readings.append(reading)

    current_readings = readings

    save_sensor_readings(readings)

    return readings


def save_sensor_readings(readings):
    connection = get_connection()

    try:
        connection.executemany(
            """
            INSERT INTO sensor_history (
                zone_id,
                zone_name,
                soil_moisture,
                temperature,
                humidity,
                soil_ph,
                rainfall,
                timestamp
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    item["zone_id"],
                    item["zone_name"],
                    item["soil_moisture"],
                    item["temperature"],
                    item["humidity"],
                    item["soil_ph"],
                    item["rainfall"],
                    item["timestamp"],
                )
                for item in readings
            ],
        )

        connection.commit()

    finally:
        connection.close()


# ---------------------------------------------------------
# ALERT DETECTION
# ---------------------------------------------------------

def detect_zone_alerts(reading):
    """
    Apply demonstration alert rules to one zone reading.
    """

    detected = []

    moisture = float(reading["soil_moisture"])
    temperature = float(reading["temperature"])
    humidity = float(reading["humidity"])
    soil_ph = float(reading["soil_ph"])

    zone_id = reading["zone_id"]
    zone_name = reading["zone_name"]

    if moisture < 40:
        detected.append({
            "zone_id": zone_id,
            "zone_name": zone_name,
            "title": "Low Soil Moisture",
            "message": (
                f"{zone_name} has low soil moisture "
                f"({moisture:.2f}%). Check irrigation requirements."
            ),
            "severity": "critical",
            "type": "low_soil_moisture",
        })

    if temperature > 30:
        detected.append({
            "zone_id": zone_id,
            "zone_name": zone_name,
            "title": "High Temperature",
            "message": (
                f"{zone_name} has high temperature "
                f"({temperature:.2f}°C). Monitor heat stress."
            ),
            "severity": "warning",
            "type": "high_temperature",
        })

    if humidity > 90:
        detected.append({
            "zone_id": zone_id,
            "zone_name": zone_name,
            "title": "High Humidity",
            "message": (
                f"{zone_name} has high humidity "
                f"({humidity:.2f}%). Monitor fungal disease risk."
            ),
            "severity": "warning",
            "type": "high_humidity",
        })

    if soil_ph < 4.5 or soil_ph > 6.5:
        detected.append({
            "zone_id": zone_id,
            "zone_name": zone_name,
            "title": "Abnormal Soil pH",
            "message": (
                f"{zone_name} has soil pH {soil_ph:.2f}. "
                "Check soil conditions."
            ),
            "severity": "warning",
            "type": "abnormal_soil_ph",
        })

    return detected


def save_alert_if_new(alert):
    """
    Avoid saving an identical zone alert repeatedly within five minutes.
    Existing alert history is preserved.
    """

    connection = get_connection()

    try:
        cutoff = (
            datetime.now(timezone.utc) - timedelta(minutes=5)
        ).isoformat()

        existing = connection.execute(
            """
            SELECT id
            FROM alert_history
            WHERE zone_id = ?
              AND title = ?
              AND severity = ?
              AND timestamp >= ?
            LIMIT 1
            """,
            (
                alert["zone_id"],
                alert["title"],
                alert["severity"],
                cutoff,
            ),
        ).fetchone()

        if existing:
            return

        connection.execute(
            """
            INSERT INTO alert_history (
                zone_id,
                zone_name,
                title,
                message,
                severity,
                type,
                timestamp
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                alert["zone_id"],
                alert["zone_name"],
                alert["title"],
                alert["message"],
                alert["severity"],
                alert["type"],
                current_timestamp(),
            ),
        )

        connection.commit()

    finally:
        connection.close()


# ---------------------------------------------------------
# API: ROOT AND HEALTH
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "project": "AgriTwin AI",
        "status": "online",
        "description": "Smart Cardamom Farming Digital Twin API",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": current_timestamp(),
    }


# ---------------------------------------------------------
# API: FARM OVERVIEW
# ---------------------------------------------------------

@app.get("/api/farm/overview")
def farm_overview():
    return {
        "farm_name": "AgriTwin Demonstration Farm",
        "location": "Idukki, Kerala",
        "crop": "Small Cardamom",
        "total_zones": len(ZONES),
        "data_mode": "simulated",
        "status": "operational",
    }


# ---------------------------------------------------------
# API: SENSOR READINGS
# ---------------------------------------------------------

@app.get("/api/sensors")
def get_sensors():
    readings = generate_sensor_readings()

    return {
        "farm_name": "AgriTwin Demonstration Farm",
        "total_zones": len(readings),
        "sensor_readings": readings,
        "timestamp": current_timestamp(),
        "data_mode": "simulated",
    }


# ---------------------------------------------------------
# API: ACTIVE ALERTS
# ---------------------------------------------------------

@app.get("/api/alerts")
def get_alerts():
    global current_readings

    # Use the most recently generated sensor readings.
    # Generate readings if the sensor endpoint has not been called yet.
    if not current_readings:
        current_readings = generate_sensor_readings()

    all_alerts = []

    for reading in current_readings:
        detected = detect_zone_alerts(reading)

        for alert in detected:
            save_alert_if_new(alert)
            all_alerts.append(alert)

    return {
        "farm_name": "AgriTwin Demonstration Farm",
        "total_alerts": len(all_alerts),
        "alerts": all_alerts,
        "timestamp": current_timestamp(),
    }


# ---------------------------------------------------------
# API: SENSOR HISTORY
# ---------------------------------------------------------

@app.get("/api/history/{zone_id}")
def get_sensor_history(
    zone_id: int,
    limit: int = Query(default=100, ge=1, le=1000),
):
    if zone_id not in [zone["zone_id"] for zone in ZONES]:
        raise HTTPException(
            status_code=404,
            detail="Plantation zone not found.",
        )

    connection = get_connection()

    try:
        rows = connection.execute(
            """
            SELECT
                id,
                zone_id,
                zone_name,
                soil_moisture,
                temperature,
                humidity,
                soil_ph,
                rainfall,
                timestamp
            FROM sensor_history
            WHERE zone_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (zone_id, limit),
        ).fetchall()

        # Reverse to return oldest-to-newest chart data.
        records = [dict(row) for row in reversed(rows)]

        total = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM sensor_history
            WHERE zone_id = ?
            """,
            (zone_id,),
        ).fetchone()["count"]

        return {
            "zone_id": zone_id,
            "total_records": total,
            "returned_records": len(records),
            "history": records,
        }

    finally:
        connection.close()


# ---------------------------------------------------------
# API: HISTORICAL ALERTS
# ---------------------------------------------------------

@app.get("/api/alert-history")
def get_alert_history(
    limit: int = Query(default=100, ge=1, le=1000),
):
    connection = get_connection()

    try:
        rows = connection.execute(
            """
            SELECT
                id,
                zone_id,
                zone_name,
                title,
                message,
                severity,
                type,
                timestamp
            FROM alert_history
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        return {
            "total_records": len(rows),
            "history": [dict(row) for row in rows],
        }

    finally:
        connection.close()


# ---------------------------------------------------------
# API: DATABASE SUMMARY
# ---------------------------------------------------------

@app.get("/api/database/summary")
def database_summary():
    connection = get_connection()

    try:
        sensor_count = connection.execute(
            "SELECT COUNT(*) AS count FROM sensor_history"
        ).fetchone()["count"]

        alert_count = connection.execute(
            "SELECT COUNT(*) AS count FROM alert_history"
        ).fetchone()["count"]

        return {
            "database": str(DB_PATH.name),
            "sensor_records": sensor_count,
            "alert_records": alert_count,
            "status": "connected",
        }

    finally:
        connection.close()


# ---------------------------------------------------------
# STARTUP MESSAGE
# ---------------------------------------------------------

@app.on_event("startup")
def startup_event():
    print("-----------------------------------------")
    print("AgriTwin AI API started successfully")
    print(f"Database: {DB_PATH}")
    print("API documentation: http://127.0.0.1:8013/docs")
    print("-----------------------------------------")
