
def calculate_risk_score(humidity, rainfall, soil_moisture, disease):
    """
    Prototype rule-based disease risk scoring.
    Scores are heuristic, not validated diagnostic probabilities.
    """

    score = 0
    reasons = []

    if disease == "Capsule Rot (Azhukal)":
        if humidity >= 85:
            score += 30
            reasons.append("Very high humidity")

        if rainfall >= 15:
            score += 30
            reasons.append("High rainfall reading")

        if soil_moisture >= 65:
            score += 25
            reasons.append("High soil moisture")

        if humidity >= 75 and rainfall >= 10:
            score += 15
            reasons.append("Combined humid and wet conditions")

    elif disease == "Leaf Blight":
        if humidity >= 80:
            score += 30
            reasons.append("High humidity")

        if rainfall >= 10:
            score += 25
            reasons.append("Wet weather conditions")

        if soil_moisture >= 60:
            score += 20
            reasons.append("Elevated soil moisture")

        if humidity >= 75 and rainfall >= 15:
            score += 15
            reasons.append("Persistent wet-condition risk")

    elif disease == "Rhizome Rot":
        if soil_moisture >= 70:
            score += 35
            reasons.append("Very high soil moisture")

        if rainfall >= 15:
            score += 30
            reasons.append("High rainfall reading")

        if humidity >= 80:
            score += 20
            reasons.append("High humidity")

        if soil_moisture >= 65 and rainfall >= 10:
            score += 15
            reasons.append("Combined wet-soil conditions")

    score = min(score, 100)

    if score >= 60:
        level = "HIGH"
    elif score >= 30:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "score": score,
        "risk_level": level,
        "reasons": reasons
    }


def predict_zone_diseases(sensor):
    humidity = float(sensor["humidity"])
    rainfall = float(sensor["rainfall"])
    soil_moisture = float(sensor["soil_moisture"])

    diseases = [
        "Capsule Rot (Azhukal)",
        "Leaf Blight",
        "Rhizome Rot"
    ]

    predictions = []

    for disease in diseases:
        result = calculate_risk_score(
            humidity,
            rainfall,
            soil_moisture,
            disease
        )

        predictions.append({
            "disease": disease,
            **result
        })

    predictions.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return {
        "zone_id": sensor["zone_id"],
        "zone_name": sensor["zone_name"],
        "predictions": predictions
    }
