"""
API Unit & Integration Tests
"""

import pytest
from fastapi.testclient import TestClient
from app.api.main import app
from app.data.seed import seed_database
from datetime import date

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_seed_db():
    seed_database(target_date=date(2026, 8, 27))

def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_list_trains_endpoint():
    response = client.get("/api/trains")
    assert response.status_code == 200
    trains = response.json()
    assert len(trains) == 25
    assert trains[0]["train_id"] == "KMRL-001"

def test_get_plan_endpoint():
    response = client.get("/api/plan/2026-08-27")
    assert response.status_code == 200
    plan = response.json()
    assert len(plan) == 25
    
    # Check that hard constraint violated trains are not INDUCT
    for item in plan:
        if item["train_id"] in ["KMRL-004", "KMRL-009"]:
            assert item["decision"] != "INDUCT"
            assert item["is_eligible"] is False

def test_override_endpoint():
    # Test overriding decision for KMRL-001
    payload = {
        "eval_date": "2026-08-27",
        "train_id": "KMRL-001",
        "new_decision": "STANDBY",
        "override_reason": "Manual maintenance request by depot chief",
        "decided_by": "Supervisor Operations"
    }
    response = client.post("/api/plan/override", json=payload)
    assert response.status_code == 200
    
    # Verify in plan
    plan_resp = client.get("/api/plan/2026-08-27")
    plan = plan_resp.json()
    kmrl001 = next(item for item in plan if item["train_id"] == "KMRL-001")
    assert kmrl001["decision"] == "STANDBY"
    assert kmrl001["override_of"] == "INDUCT"

def test_what_if_simulation_endpoint():
    payload = {
        "eval_date": "2026-08-27",
        "expired_cert_train_ids": ["KMRL-001"],
        "critical_job_train_ids": ["KMRL-002"]
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["changes_count"] > 0
    assert len(res["diff_summary"]) > 0
