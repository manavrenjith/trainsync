"""
Unit & Integration Tests for Phase 2 OR-Tools CP-SAT Stabling & Departure Solver
"""

import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.api.main import app
from app.data.seed import seed_database
from app.schemas import InductionDecisionSchema, DecisionEnum, StablingBaySchema
from app.engine.cpsat_stabling_solver import solve_stabling_and_departure_schedule

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_seed_db():
    seed_database(target_date=date(2026, 8, 27))

def test_cpsat_solver_direct_invocation():
    eval_date = date(2026, 8, 27)
    decisions = [
        InductionDecisionSchema(
            eval_date=eval_date, train_id="KMRL-001", decision=DecisionEnum.INDUCT,
            score=85.0, is_eligible=True, hard_violations=[]
        ),
        InductionDecisionSchema(
            eval_date=eval_date, train_id="KMRL-002", decision=DecisionEnum.INDUCT,
            score=78.5, is_eligible=True, hard_violations=[]
        ),
        InductionDecisionSchema(
            eval_date=eval_date, train_id="KMRL-003", decision=DecisionEnum.STANDBY,
            score=0.0, is_eligible=True, hard_violations=[]
        ),
        InductionDecisionSchema(
            eval_date=eval_date, train_id="KMRL-004", decision=DecisionEnum.IBL,
            score=0.0, is_eligible=False, hard_violations=["Expired Certificate"]
        )
    ]
    bays = [
        StablingBaySchema(bay_id="BAY-1", track_name="TRK-01", position_order=1),
        StablingBaySchema(bay_id="BAY-2", track_name="TRK-01", position_order=2),
        StablingBaySchema(bay_id="BAY-3", track_name="TRK-02", position_order=1),
        StablingBaySchema(bay_id="BAY-4", track_name="IBL-01", position_order=1)
    ]

    res = solve_stabling_and_departure_schedule(decisions, bays, eval_date)
    assert res.total_trains_scheduled == 4
    assert res.solver_status in ["OPTIMAL", "FEASIBLE", "HEURISTIC_FALLBACK"]
    assert len(res.assignments) == 4

def test_cpsat_stabling_api_endpoint():
    response = client.get("/api/plan/2026-08-27/cpsat-stabling")
    assert response.status_code == 200
    data = response.json()
    assert data["total_trains_scheduled"] == 25
    assert "solver_status" in data
    assert "assignments" in data
    assert len(data["assignments"]) == 25
