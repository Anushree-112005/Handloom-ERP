# yarn_calculator.py
import math

CALIBRATION = {
    "2539": {
        "Warp Beam1": {"m": 1.285,  "c": 2.0},
        "Warp Beam2": {"m": 1.285,  "c": 3.0},
        "Weft":       {"m": 1.20,   "c": 1.0},
    },
    "2670": {
        "Warp Beam1": {"m": 1.7169, "c": 3.21},
        "Weft":       {"m": 1.5841, "c": 0.0},
    },
    "2729": {
        "Warp Beam1": {"m": 7.4386, "c": 0.0},
        "Weft":       {"m": 3.4239, "c": 0.0},
    },
}

KG_PER_LB = 0.45359237
YARDS_PER_HANK = 840

class YarnCalculator:
    @staticmethod
    def calibrated_weight(total_ends: int, eq_count: float, m: float, c: float) -> float:
        val = (total_ends / eq_count) * m + c
        return float(round(val))

    @staticmethod
    def warp_weight_kg(total_ends: int, length_yards: float, eq_count: float, wastage: float = 1.08) -> float:
        weight_lbs = (total_ends * length_yards) / (eq_count * YARDS_PER_HANK)
        return weight_lbs * wastage * KG_PER_LB

    @staticmethod
    def weft_weight_kg(ppi: int, width_inches: float, length_yards: float, eq_count: float, wastage: float = 1.08) -> float:
        total_picks = ppi * width_inches * length_yards
        weight_lbs = total_picks / (eq_count * YARDS_PER_HANK)
        return weight_lbs * wastage * KG_PER_LB

    @staticmethod
    def weft_weight_by_color_kg(total_ends_color: int, width_inches: float, eq_count: float, wastage: float = 1.08) -> float:
        yarn_yards = total_ends_color * (width_inches / 36.0)
        weight_lbs = yarn_yards / (eq_count * YARDS_PER_HANK)
        return weight_lbs * wastage * KG_PER_LB
