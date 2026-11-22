
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "agritwin.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


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
                timestamp TEXT NOT NULL,
                data_mode TEXT DEFAULT 'simulated'
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
                timestamp TEXT NOT NULL,
                data_mode TEXT DEFAULT 'simulated'
            )
        """)
        connection.commit()

    finally:
        connection.close()


def save_sensor_readings(readings):
    connection = get_connection()

    try:
        for sensor in readings:
            connection.execute("""
                INSERT INTO sensor_history (
                    zone_id,
                    zone_name,
                    soil_moisture,
                    temperature,
                    humidity,
                    soil_ph,
                    rainfall,
                    timestamp,
                    data_mode
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sensor["zone_id"],
                sensor["zone_name"],
                sensor["soil_moisture"],
                sensor["temperature"],
                sensor["humidity"],
                sensor["soil_ph"],
                sensor["rainfall"],
                sensor["timestamp"],
                sensor.get("data_mode", "simulated")
            ))

        connection.commit()

    finally:
        connection.close()


def get_sensor_history(zone_id, limit=100):
    connection = get_connection()

    try:
        rows = connection.execute("""
            SELECT *
            FROM sensor_history
            WHERE zone_id = ?
            ORDER BY id DESC
            LIMIT ?
        """, (zone_id, limit)).fetchall()

        return [dict(row) for row in reversed(rows)]

    finally:
        connection.close()
def save_alerts(alerts):
    connection = get_connection()

    try:
        for alert in alerts:
            connection.execute("""
                INSERT INTO alert_history (
                    zone_id,
                    zone_name,
                    title,
                    message,
                    severity,
                    timestamp,
                    data_mode
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                alert["zone_id"],
                alert["zone_name"],
                alert["title"],
                alert.get("message", ""),
                alert["severity"],
                alert["timestamp"],
                alert.get("data_mode", "simulated")
            ))

        connection.commit()

    finally:
        connection.close()
def get_alert_history(zone_id=None, limit=100):
    connection = get_connection()

    try:
        if zone_id is not None:
            rows = connection.execute("""
                SELECT *
                FROM alert_history
                WHERE zone_id = ?
                ORDER BY id DESC
                LIMIT ?
            """, (zone_id, limit)).fetchall()
        else:
            rows = connection.execute("""
                SELECT *
                FROM alert_history
                ORDER BY id DESC
                LIMIT ?
            """, (limit,)).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()