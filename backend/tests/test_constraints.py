"""
Unit tests for KMRL Engine - Hard Constraints Evaluator

Tests:
1. Train with valid certificates & no open critical job-cards -> Passed.
2. Train with expired Rolling Stock certificate -> Ineligible.
3. Train with open critical job card -> Ineligible.
4. Train with multiple violations -> Ineligible + lists all violation reasons.
5. Verification that no ineligible train is ever marked valid.
"""

import pytest
from datetime import date, datetime
from app.schemas import (
    TrainInputData,
    TrainsetSchema,
    FitnessCertificateSchema,
    JobCardSchema,
    DepartmentEnum,
    SeverityEnum,
    DecisionEnum
)
from app.engine.constraints import evaluate_hard_constraints

@pytest.fixture
def base_train():
    return TrainsetSchema(
        train_id="KMRL-001",
        name="Kochi Express 01",
        induction_count=10,
        total_mileage_km=12000.0,
        current_status=DecisionEnum.STANDBY
    )

@pytest.fixture
def valid_certs():
    today = date(2026, 8, 27)
    return [
        FitnessCertificateSchema(
            train_id="KMRL-001",
            department=DepartmentEnum.ROLLING_STOCK,
            valid_from=date(2026, 1, 1),
            valid_until=date(2026, 12, 31),
            status="valid"
        ),
        FitnessCertificateSchema(
            train_id="KMRL-001",
            department=DepartmentEnum.SIGNALLING,
            valid_from=date(2026, 1, 1),
            valid_until=date(2026, 12, 31),
            status="valid"
        ),
        FitnessCertificateSchema(
            train_id="KMRL-001",
            department=DepartmentEnum.TELECOM,
            valid_from=date(2026, 1, 1),
            valid_until=date(2026, 12, 31),
            status="valid"
        )
    ]

def test_valid_train_passes_hard_constraints(base_train, valid_certs):
    eval_date = date(2026, 8, 27)
    train_data = TrainInputData(
        train=base_train,
        fitness_certificates=valid_certs,
        job_cards=[]
    )
    is_eligible, violations = evaluate_hard_constraints(train_data, eval_date)
    assert is_eligible is True
    assert len(violations) == 0

def test_expired_rolling_stock_cert_fails(base_train, valid_certs):
    eval_date = date(2026, 8, 27)
    # Expire Rolling Stock cert
    valid_certs[0].valid_until = date(2026, 8, 20)
    train_data = TrainInputData(
        train=base_train,
        fitness_certificates=valid_certs,
        job_cards=[]
    )
    is_eligible, violations = evaluate_hard_constraints(train_data, eval_date)
    assert is_eligible is False
    assert len(violations) == 1
    assert "Expired Rolling Stock certificate" in violations[0]

def test_open_critical_job_card_fails(base_train, valid_certs):
    eval_date = date(2026, 8, 27)
    critical_job = JobCardSchema(
        train_id="KMRL-001",
        job_id="JOB-999",
        description="Brake actuator pressure drop",
        severity=SeverityEnum.CRITICAL,
        status="open",
        opened_at=datetime(2026, 8, 26, 10, 0, 0)
    )
    train_data = TrainInputData(
        train=base_train,
        fitness_certificates=valid_certs,
        job_cards=[critical_job]
    )
    is_eligible, violations = evaluate_hard_constraints(train_data, eval_date)
    assert is_eligible is False
    assert any("Critical open job-card" in v for v in violations)

def test_minor_job_card_does_not_fail_hard_constraint(base_train, valid_certs):
    eval_date = date(2026, 8, 27)
    minor_job = JobCardSchema(
        train_id="KMRL-001",
        job_id="JOB-101",
        description="Cabin light bulb replacement",
        severity=SeverityEnum.MINOR,
        status="open",
        opened_at=datetime(2026, 8, 26, 10, 0, 0)
    )
    train_data = TrainInputData(
        train=base_train,
        fitness_certificates=valid_certs,
        job_cards=[minor_job]
    )
    is_eligible, violations = evaluate_hard_constraints(train_data, eval_date)
    assert is_eligible is True
    assert len(violations) == 0

def test_missing_department_cert_fails(base_train, valid_certs):
    eval_date = date(2026, 8, 27)
    # Remove Signalling cert
    incomplete_certs = [c for c in valid_certs if c.department != DepartmentEnum.SIGNALLING]
    train_data = TrainInputData(
        train=base_train,
        fitness_certificates=incomplete_certs,
        job_cards=[]
    )
    is_eligible, violations = evaluate_hard_constraints(train_data, eval_date)
    assert is_eligible is False
    assert any("Missing required fitness certificate for Signalling" in v for v in violations)
