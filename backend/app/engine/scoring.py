"""
KMRL Engine - Soft Constraint Scorer

Pure functions to compute multi-objective soft scores for eligible trainsets.
All sub-scores are normalized between 0.0 and 1.0.
Weighted combination uses constants from app.config.
"""

from app.schemas import TrainInputData, SoftScoreBreakdown, SeverityEnum
from app.config import (
    WEIGHT_MILEAGE_BALANCE,
    WEIGHT_BRANDING_URGENCY,
    WEIGHT_JOB_CARD_PENALTY,
    WEIGHT_CLEANING_READINESS,
    WEIGHT_STABLING_EASE,
    FLEET_AVERAGE_KM_BASELINE,
    BRANDING_WEEKLY_TARGET_HOURS,
    MAX_ALLOWED_OPEN_MINOR_JOBS
)

def calculate_soft_score(train_data: TrainInputData, fleet_avg_km: float = FLEET_AVERAGE_KM_BASELINE) -> SoftScoreBreakdown:
    """
    Calculates soft multi-objective scores for an eligible train.
    Higher scores indicate higher priority for induction into revenue service.
    """
    # 1. Mileage Balance Score (0.0 to 1.0)
    # Lower cumulative mileage relative to fleet average -> Higher priority boost to equalize wear.
    current_km = train_data.train.total_mileage_km
    if fleet_avg_km > 0:
        # Ratio around 1.0; capped between 0 and 2
        km_ratio = min(max(current_km / fleet_avg_km, 0.0), 2.0)
        # Invert so lower ratio gets score close to 1.0
        mileage_score = max(0.0, 1.0 - (km_ratio - 0.5) / 1.5)
    else:
        mileage_score = 0.5

    # 2. Branding Urgency Score (0.0 to 1.0)
    # Trains behind on required contract hours get higher priority boost.
    if train_data.branding_contract:
        req = train_data.branding_contract.required_exposure_hours_per_week
        act = train_data.branding_contract.actual_exposure_hours_this_week
        if req > 0:
            shortfall = max(0.0, req - act)
            branding_score = min(1.0, shortfall / req)
        else:
            branding_score = 0.5
    else:
        branding_score = 0.3  # Neutral score for unbranded trainsets

    # 3. Job Card Penalty Score (0.0 to 1.0)
    # Penalizes open minor or major non-critical job cards.
    open_minor_jobs = sum(
        1 for j in train_data.job_cards
        if j.status.lower() == "open" and j.severity in [SeverityEnum.MINOR, SeverityEnum.MAJOR]
    )
    job_penalty_score = max(0.0, 1.0 - (open_minor_jobs / MAX_ALLOWED_OPEN_MINOR_JOBS))

    # 4. Cleaning Readiness Score (0.0 to 1.0)
    # Bonus if cleaning was completed today
    if train_data.cleaning_slot and train_data.train.train_id in train_data.cleaning_slot.assigned_train_ids:
        cleaning_score = 1.0
    else:
        cleaning_score = 0.6

    # 5. Stabling Ease Score (0.0 to 1.0)
    # Higher score if fewer blocking trains in bay
    if train_data.stabling_bay:
        blockers_count = len(train_data.stabling_bay.blocked_by_train_ids)
        stabling_score = max(0.0, 1.0 - (blockers_count * 0.33))
    else:
        stabling_score = 0.8

    # Weighted Sum
    total_score = (
        (mileage_score * WEIGHT_MILEAGE_BALANCE) +
        (branding_score * WEIGHT_BRANDING_URGENCY) +
        (job_penalty_score * WEIGHT_JOB_CARD_PENALTY) +
        (cleaning_score * WEIGHT_CLEANING_READINESS) +
        (stabling_score * WEIGHT_STABLING_EASE)
    )

    return SoftScoreBreakdown(
        mileage_balance_score=round(mileage_score, 3),
        branding_urgency_score=round(branding_score, 3),
        job_card_penalty_score=round(job_penalty_score, 3),
        cleaning_readiness_score=round(cleaning_score, 3),
        stabling_ease_score=round(stabling_score, 3),
        total_weighted_score=round(total_score, 3)
    )
