def calculate_risk_score(person_count, max_capacity, growth_trend='stable', movement_speed_kmh=3.5):
    """
    Calculates congestion risk score from 0 to 100 based on:
    - Crowd Density vs Max Safe Capacity (50%)
    - Growth Rate / Trend (30%)
    - Slow Movement / Bottleneck Speed (20%)
    """
    # 1. Density Score (0 - 100)
    density_ratio = person_count / max(1, max_capacity)
    if density_ratio >= 1.0:
        density_score = 100.0
    elif density_ratio >= 0.8:
        density_score = 75.0 + (density_ratio - 0.8) / 0.2 * 25.0
    elif density_ratio >= 0.5:
        density_score = 40.0 + (density_ratio - 0.5) / 0.3 * 35.0
    else:
        density_score = (density_ratio / 0.5) * 40.0

    # 2. Growth Trend Score (0 - 100)
    if growth_trend == 'increasing':
        growth_score = 85.0
    elif growth_trend == 'decreasing':
        growth_score = 15.0
    else:
        growth_score = 45.0

    # 3. Slow Movement Score (0 - 100) — slower speed indicates blockage/bottleneck
    if movement_speed_kmh <= 1.0:
        slow_movement_score = 100.0
    elif movement_speed_kmh <= 2.5:
        slow_movement_score = 70.0
    elif movement_speed_kmh <= 3.8:
        slow_movement_score = 35.0
    else:
        slow_movement_score = 10.0

    # Combined weighted score
    raw_score = (density_score * 0.50) + (growth_score * 0.30) + (slow_movement_score * 0.20)
    risk_score = max(0, min(100, round(raw_score)))

    # Determine status category
    if risk_score >= 81:
        status_level = 'critical'
    elif risk_score >= 61:
        status_level = 'high'
    elif risk_score >= 31:
        status_level = 'medium'
    else:
        status_level = 'low'

    return risk_score, status_level
