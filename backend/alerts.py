
def generate_zone_alert(sensor):
    alerts = []

    moisture = sensor["soil_moisture"]
    temperature = sensor["temperature"]
    humidity = sensor["humidity"]
    soil_ph = sensor["soil_ph"]

    if moisture < 40:
        alerts.append({
            "type": "LOW_SOIL_MOISTURE",
            "severity": "WARNING",
            "message": "Soil moisture is relatively low in this zone."
        })

    if temperature > 30:
        alerts.append({
            "type": "HIGH_TEMPERATURE",
            "severity": "WARNING",
            "message": "Temperature is relatively high in this zone."
        })

    if humidity > 90:
        alerts.append({
            "type": "HIGH_HUMIDITY",
            "severity": "INFO",
            "message": "Humidity is relatively high in this zone."
        })

    if soil_ph < 4.5 or soil_ph > 6.5:
        alerts.append({
            "type": "SOIL_PH_OUTSIDE_DEMO_RANGE",
            "severity": "INFO",
            "message": "Soil pH is outside the demonstration range."
        })

    return alerts
