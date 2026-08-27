"""
KMRL Synthetic Data Generator & Seeder

Generates realistic mock data for 25 KMRL trainsets across 30 days of historical records.
Incorporates specific tricky edge cases for demo storytelling:
- KMRL-004: Expired Rolling-Stock fitness cert
- KMRL-009: Critical open job-card (Brake System Failure)
- KMRL-012: Behind on Branding SLA (LuLu Mall Kochi contract)
- KMRL-018: High cumulative mileage wear
- KMRL-022: Stabling line physically blocked
"""

from datetime import date, datetime, timedelta
import random
from typing import List, Dict, Any

from app.schemas import DepartmentEnum, SeverityEnum

DEPOT_NAME = "Muttom Depot"
TRAIN_NAMES = [
    "Aluva Express", "Petta Flyer", "Vytila Shuttle", "Palarivattom Commuter",
    "Edapally Cruiser", "Kalamassery Metro", "MG Road Rapid", "Jawaharlal Nehru Special",
    "Maharajas Line", "Ernakulam South Direct", "Elamkulam Metro", "Kadavanthra Commuter",
    "Thaikoodam Flyer", "SN Junction Express", "Tripunithura Shuttle", "Muttom Local",
    "Cusat Metro", "Pathadipalam Rapid", "Changampuzha Express", "Kaloor Commuter",
    "Lissy Junction Line", "Kochi Central", "Marine Drive Metro", "Infopark Shuttle", "Suburban Line"
]

BRANDING_SPONSORS = [
    ("LuLu Mall Kochi", "B-101"),
    ("Federal Bank", "B-102"),
    ("Muthoot Finance", "B-103"),
    ("Aster Medcity", "B-104"),
    ("Wonderla", "B-105"),
    ("Kalyan Silks", "B-106")
]

def generate_mock_fleet_data(target_date: date = date(2026, 8, 27)) -> Dict[str, Any]:
    random.seed(42)  # For deterministic reproducibility
    
    trainsets = []
    fitness_certificates = []
    job_cards = []
    branding_contracts = []
    mileage_records = []
    cleaning_slots = []
    stabling_bays = []

    # Historical dates (30 days prior)
    start_history_date = target_date - timedelta(days=30)

    for i in range(1, 26):
        t_id = f"KMRL-{i:03d}"
        t_name = TRAIN_NAMES[i-1]
        
        # Default Mileage
        if t_id == "KMRL-018":
            total_km = 19800.0  # High wear edge case
        elif t_id == "KMRL-012":
            total_km = 8200.0   # Low mileage
        else:
            total_km = round(random.uniform(10500.0, 14500.0), 1)

        trainsets.append({
            "train_id": t_id,
            "name": t_name,
            "induction_count": random.randint(15, 25),
            "total_mileage_km": total_km,
            "current_status": "STANDBY"
        })

        # 1. Fitness Certificates
        for dept in [DepartmentEnum.ROLLING_STOCK, DepartmentEnum.SIGNALLING, DepartmentEnum.TELECOM]:
            if t_id == "KMRL-004" and dept == DepartmentEnum.ROLLING_STOCK:
                # EDGE CASE: Expired Rolling Stock cert
                valid_until = target_date - timedelta(days=5)
                status = "expired"
            else:
                valid_until = target_date + timedelta(days=random.randint(10, 90))
                status = "valid"

            fitness_certificates.append({
                "train_id": t_id,
                "department": dept.value,
                "valid_from": target_date - timedelta(days=120),
                "valid_until": valid_until,
                "status": status
            })

        # 2. Job Cards
        if t_id == "KMRL-009":
            # EDGE CASE: Critical Open Job Card
            job_cards.append({
                "train_id": t_id,
                "job_id": "JC-CRIT-901",
                "description": "Brake Caliper Jammed & Hydraulic Pressure Drop",
                "severity": SeverityEnum.CRITICAL.value,
                "status": "open",
                "opened_at": datetime.combine(target_date - timedelta(days=1), datetime.min.time()),
                "estimated_close_at": datetime.combine(target_date + timedelta(days=2), datetime.min.time())
            })
        elif t_id == "KMRL-015":
            # Multiple minor open jobs
            job_cards.append({
                "train_id": t_id,
                "job_id": "JC-MIN-102",
                "description": "Cabin AC Filter Cleaning Due",
                "severity": SeverityEnum.MINOR.value,
                "status": "open",
                "opened_at": datetime.combine(target_date - timedelta(days=2), datetime.min.time()),
                "estimated_close_at": None
            })
            job_cards.append({
                "train_id": t_id,
                "job_id": "JC-MIN-103",
                "description": "Passenger Indicator LED Flicker",
                "severity": SeverityEnum.MINOR.value,
                "status": "open",
                "opened_at": datetime.combine(target_date - timedelta(days=1), datetime.min.time()),
                "estimated_close_at": None
            })

        # 3. Branding Contracts (assigned to 6 trains)
        if i in [2, 6, 12, 16, 20, 24]:
            brand_idx = (i // 4) % len(BRANDING_SPONSORS)
            brand_name = BRANDING_SPONSORS[brand_idx][0]
            contract_code = f"B-10{brand_idx+1}-{t_id}"
            req_hrs = 40.0
            if t_id == "KMRL-012":
                # EDGE CASE: Behind on branding exposure
                act_hrs = 10.0
            else:
                act_hrs = round(random.uniform(32.0, 44.0), 1)

            branding_contracts.append({
                "contract_id": contract_code,
                "advertiser": brand_name,
                "train_id": t_id,
                "required_exposure_hours_per_week": req_hrs,
                "actual_exposure_hours_this_week": act_hrs,
                "penalty_per_shortfall_hour": 750.0
            })

        # 4. Mileage Records (30 days of history)
        curr_d = start_history_date
        accumulated = total_km - (30 * 220.0)
        while curr_d <= target_date:
            daily_km = round(random.uniform(180.0, 260.0), 1)
            accumulated += daily_km
            mileage_records.append({
                "train_id": t_id,
                "record_date": curr_d,
                "km_run": daily_km,
                "component_wear_flags": {
                    "bogie_wear_pct": round(min(100.0, accumulated / 300.0), 1),
                    "brake_pad_mm": round(max(2.0, 20.0 - accumulated / 1500.0), 1)
                }
            })
            curr_d += timedelta(days=1)

        # 5. Stabling Bays
        track_num = (i - 1) // 3 + 1
        pos_num = ((i - 1) % 3) + 1
        blocked_by = []
        if t_id == "KMRL-022":
            # EDGE CASE: Blocked by 3 trains
            blocked_by = ["KMRL-023", "KMRL-024", "KMRL-025"]

        stabling_bays.append({
            "bay_id": f"BAY-T{track_num:02d}-P{pos_num}",
            "track_name": f"Track-{track_num:02d}",
            "position_order": pos_num,
            "occupying_train_id": t_id,
            "blocked_by_train_ids": blocked_by
        })

    # Cleaning Slots
    cleaning_slots.append({
        "slot_date": target_date,
        "bay_id": "CLEAN-BAY-01",
        "capacity": 4,
        "assigned_train_ids": ["KMRL-001", "KMRL-005", "KMRL-010", "KMRL-014"]
    })

    return {
        "trainsets": trainsets,
        "fitness_certificates": fitness_certificates,
        "job_cards": job_cards,
        "branding_contracts": branding_contracts,
        "mileage_records": mileage_records,
        "cleaning_slots": cleaning_slots,
        "stabling_bays": stabling_bays
    }
