"""
Unit tests for KMRL Engine - Soft Constraint Scorer & Optimizer

Tests:
1. Low mileage train receives higher mileage score than high mileage train.
2. Train behind on branding exposure hours receives higher branding score.
3. Optimizer enforces hard constraints: no ineligible train is ever assigned INDUCT.
4. Optimizer ranks top eligible trains for INDUCT state.
"""

import pytest
from datetime import date
from app.schemas import (
    TrainInputData,
    TrainsetSchema,
    FitnessCertificateSchema,
    BrandingContractSchema,
    DepartmentEnum,
    DecisionEnum
)
from app.engine.scoring import calculate_soft_score
from app.engine.optimizer import optimize_induction_plan

def make_valid_certs(train_id: str):
    return [
        FitnessCertificateSchema(
            train_id=train_id,
            department=DepartmentEnum.ROLLING_STOCK,
            valid_from=date(2026, 1, 1),
            valid_until=date(2026, 12, 31),
            status="valid"
        ),
        FitnessCertificateSchema(
            train_id=train_id,
            department=DepartmentEnum.SIGNALLING,
            valid_from=date(2026, 1, 1),
            valid_until=date(2026, 12, 31),
            status="valid"
        ),
        FitnessCertificateSchema(
            train_id=train_id,
            department=DepartmentEnum.TELECOM,
            valid_from=date(2026, 1, 1),
            valid_until=date(2026, 12, 31),
            status="valid"
        )
    ]

def test_mileage_scoring_priority():
    low_km_train = TrainInputData(
        train=TrainsetSchema(train_id="T1", name="Train 1", total_mileage_km=5000.0),
        fitness_certificates=make_valid_certs("T1"),
        job_cards=[]
    )
    high_km_train = TrainInputData(
        train=TrainsetSchema(train_id="T2", name="Train 2", total_mileage_km=20000.0),
        fitness_certificates=make_valid_certs("T2"),
        job_cards=[]
    )
    
    score_low = calculate_soft_score(low_km_train, fleet_avg_km=12500.0)
    score_high = calculate_soft_score(high_km_train, fleet_avg_km=12500.0)

    assert score_low.mileage_balance_score > score_high.mileage_balance_score

def test_branding_urgency_priority():
    behind_branding_train = TrainInputData(
        train=TrainsetSchema(train_id="T1", name="Train 1"),
        fitness_certificates=make_valid_certs("T1"),
        job_cards=[],
        branding_contract=BrandingContractSchema(
            contract_id="C1", advertiser="BrandA", train_id="T1",
            required_exposure_hours_per_week=40.0,
            actual_exposure_hours_this_week=10.0,
            penalty_per_shortfall_hour=500.0
        )
    )
    met_branding_train = TrainInputData(
        train=TrainsetSchema(train_id="T2", name="Train 2"),
        fitness_certificates=make_valid_certs("T2"),
        job_cards=[],
        branding_contract=BrandingContractSchema(
            contract_id="C2", advertiser="BrandB", train_id="T2",
            required_exposure_hours_per_week=40.0,
            actual_exposure_hours_this_week=42.0,
            penalty_per_shortfall_hour=500.0
        )
    )

    score_behind = calculate_soft_score(behind_branding_train)
    score_met = calculate_soft_score(met_branding_train)

    assert score_behind.branding_urgency_score > score_met.branding_urgency_score

def test_optimizer_never_inducts_ineligible_train():
    eval_date = date(2026, 8, 27)
    
    # Train 1: Valid
    t1 = TrainInputData(
        train=TrainsetSchema(train_id="KMRL-001", name="Train 1"),
        fitness_certificates=make_valid_certs("KMRL-001"),
        job_cards=[]
    )
    # Train 2: Expired cert
    expired_certs = make_valid_certs("KMRL-002")
    expired_certs[0].valid_until = date(2026, 8, 1)  # Expired
    t2 = TrainInputData(
        train=TrainsetSchema(train_id="KMRL-002", name="Train 2"),
        fitness_certificates=expired_certs,
        job_cards=[]
    )

    decisions = optimize_induction_plan([t1, t2], eval_date, target_induction=2)

    dec_map = {d.train_id: d for d in decisions}
    
    assert dec_map["KMRL-001"].decision == DecisionEnum.INDUCT
    assert dec_map["KMRL-001"].is_eligible is True

    # Ineligible train MUST NOT be INDUCT
    assert dec_map["KMRL-002"].decision != DecisionEnum.INDUCT
    assert dec_map["KMRL-002"].is_eligible is False
    assert len(dec_map["KMRL-002"].hard_violations) > 0
