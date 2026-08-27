"""
KMRL DB Seed Script

Initializes the database schema and seeds mock fleet data, fitness certs,
job cards, branding contracts, mileage logs, stabling geometry, and initial induction decisions.
"""

from datetime import date
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import (
    TrainsetDB,
    FitnessCertificateDB,
    JobCardDB,
    BrandingContractDB,
    MileageRecordDB,
    CleaningSlotDB,
    StablingBayDB,
    InductionDecisionDB
)
from app.schemas import TrainInputData, TrainsetSchema, FitnessCertificateSchema, JobCardSchema, BrandingContractSchema, MileageRecordSchema, CleaningSlotSchema, StablingBaySchema
from app.data.generator import generate_mock_fleet_data
from app.engine.optimizer import optimize_induction_plan

def seed_database(target_date: date = date(2026, 8, 27)):
    print("Re-creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    data = generate_mock_fleet_data(target_date=target_date)

    print("Seeding Trainsets...")
    for t in data["trainsets"]:
        db.add(TrainsetDB(**t))

    print("Seeding Fitness Certificates...")
    for fc in data["fitness_certificates"]:
        db.add(FitnessCertificateDB(**fc))

    print("Seeding Job Cards...")
    for jc in data["job_cards"]:
        db.add(JobCardDB(**jc))

    print("Seeding Branding Contracts...")
    for bc in data["branding_contracts"]:
        db.add(BrandingContractDB(**bc))

    print("Seeding Mileage Records...")
    for mr in data["mileage_records"]:
        db.add(MileageRecordDB(**mr))

    print("Seeding Cleaning Slots...")
    for cs in data["cleaning_slots"]:
        db.add(CleaningSlotDB(**cs))

    print("Seeding Stabling Bays...")
    for sb in data["stabling_bays"]:
        db.add(StablingBayDB(**sb))

    db.commit()

    # Generate initial induction plan for target_date
    print(f"Generating initial induction plan for {target_date}...")
    train_inputs = []

    for t in data["trainsets"]:
        t_id = t["train_id"]
        
        certs = [
            FitnessCertificateSchema(**fc)
            for fc in data["fitness_certificates"] if fc["train_id"] == t_id
        ]
        jobs = [
            JobCardSchema(**jc)
            for jc in data["job_cards"] if jc["train_id"] == t_id
        ]
        bc = next(
            (BrandingContractSchema(**b) for b in data["branding_contracts"] if b["train_id"] == t_id),
            None
        )
        mr = next(
            (MileageRecordSchema(**m) for m in data["mileage_records"] if m["train_id"] == t_id and m["record_date"] == target_date),
            None
        )
        cs = next(
            (CleaningSlotSchema(**c) for c in data["cleaning_slots"] if c["slot_date"] == target_date),
            None
        )
        sb = next(
            (StablingBaySchema(**s) for s in data["stabling_bays"] if s["occupying_train_id"] == t_id),
            None
        )

        train_inputs.append(TrainInputData(
            train=TrainsetSchema(**t),
            fitness_certificates=certs,
            job_cards=jobs,
            branding_contract=bc,
            recent_mileage=mr,
            cleaning_slot=cs,
            stabling_bay=sb
        ))

    decisions = optimize_induction_plan(train_inputs, target_date)

    for dec in decisions:
        db.add(InductionDecisionDB(
            eval_date=dec.eval_date,
            train_id=dec.train_id,
            decision=dec.decision.value,
            score=dec.score,
            is_eligible=dec.is_eligible,
            hard_violations=dec.hard_violations,
            soft_breakdown=dec.soft_breakdown.model_dump() if dec.soft_breakdown else {},
            reason_trace=dec.reason_trace,
            decided_by=dec.decided_by,
            override_of=dec.override_of.value if dec.override_of else None,
            override_reason=dec.override_reason
        ))

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
