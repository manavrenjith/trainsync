"""
KMRL Train Induction System - Configuration & Scoring Parameters

All weights and threshold parameters are defined here as named constants with explicit rationale,
enabling easy tuning and clear explanation during live demonstrations to judges.
"""

from typing import Dict

# Fleet operational parameters
TARGET_INDUCTION_COUNT = 18  # Fleet requirement: 18 trains needed for peak daily service
TARGET_STANDBY_COUNT = 4     # 4 trains kept ready on standby
TARGET_IBL_COUNT = 3         # 3 trains in Inspection Bay Line for maintenance/cleaning

# Soft Constraint Weights (Sum to 1.0 for normalized scoring)
# Mileage balance weight: Prioritizes trains with lower cumulative mileage to balance wear
WEIGHT_MILEAGE_BALANCE: float = 0.30

# Branding SLA urgency weight: Prioritizes trains behind on advertiser exposure hours
WEIGHT_BRANDING_URGENCY: float = 0.35

# Minor job card risk penalty weight: Slightly penalizes trains with open non-critical maintenance tasks
WEIGHT_JOB_CARD_PENALTY: float = 0.15

# Cleaning readiness bonus weight: Boosts trains that have fresh detailing completed
WEIGHT_CLEANING_READINESS: float = 0.10

# Stabling shunting ease weight: Prefers trains that require fewer track shunting moves to extract
WEIGHT_STABLING_EASE: float = 0.10

# Fleet Mileage target baseline (average km per trainset across 30 days)
FLEET_AVERAGE_KM_BASELINE: float = 12500.0

# Branding exposure target per contract per week (in hours)
BRANDING_WEEKLY_TARGET_HOURS: float = 40.0

# Risk Thresholds
MAX_ALLOWED_OPEN_MINOR_JOBS: int = 3
