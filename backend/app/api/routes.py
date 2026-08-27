"""
KMRL REST API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models import (
    TrainsetDB,
    FitnessCertificateDB,
    JobCardDB,
    BrandingContractDB,
    MileageRecordDB,
    CleaningSlotDB,
    StablingBayDB,
    InductionDecisionDB,
    AuditLogDB
)
from app.schemas import (
    TrainsetSchema,
    FitnessCertificateSchema,
    JobCardSchema,
    BrandingContractSchema,
    MileageRecordSchema,
    CleaningSlotSchema,
    StablingBaySchema,
    InductionDecisionSchema,
    TrainInputData,
    OverrideRequest,
    WhatIfRequest,
    WhatIfResponse,
    DecisionEnum,
    DepartmentEnum,
    SeverityEnum
)
from app.engine.optimizer import optimize_induction_plan
from app.config import TARGET_INDUCTION_COUNT, TARGET_STANDBY_COUNT

router = APIRouter(prefix="/api")

def fetch_train_inputs(db: Session, eval_date: date) -> List[TrainInputData]:
    """Helper to assemble TrainInputData list from DB for engine processing."""
    trains = db.query(TrainsetDB).all()
    train_inputs = []

    for t in trains:
        t_id = t.train_id
        
        certs = [
            FitnessCertificateSchema(
                id=c.id, train_id=c.train_id, department=c.department,
                valid_from=c.valid_from, valid_until=c.valid_until, status=c.status
            )
            for c in db.query(FitnessCertificateDB).filter(FitnessCertificateDB.train_id == t_id).all()
        ]
        
        jobs = [
            JobCardSchema(
                id=j.id, train_id=j.train_id, job_id=j.job_id, description=j.description,
                severity=j.severity, status=j.status, opened_at=j.opened_at, estimated_close_at=j.estimated_close_at
            )
            for j in db.query(JobCardDB).filter(JobCardDB.train_id == t_id).all()
        ]
        
        bc_db = db.query(BrandingContractDB).filter(BrandingContractDB.train_id == t_id).first()
        bc = BrandingContractSchema(
            id=bc_db.id, contract_id=bc_db.contract_id, advertiser=bc_db.advertiser,
            train_id=bc_db.train_id, required_exposure_hours_per_week=bc_db.required_exposure_hours_per_week,
            actual_exposure_hours_this_week=bc_db.actual_exposure_hours_this_week,
            penalty_per_shortfall_hour=bc_db.penalty_per_shortfall_hour
        ) if bc_db else None

        mr_db = db.query(MileageRecordDB).filter(
            MileageRecordDB.train_id == t_id, MileageRecordDB.record_date == eval_date
        ).first()
        mr = MileageRecordSchema(
            id=mr_db.id, train_id=mr_db.train_id, record_date=mr_db.record_date,
            km_run=mr_db.km_run, component_wear_flags=mr_db.component_wear_flags or {}
        ) if mr_db else None

        cs_db = db.query(CleaningSlotDB).filter(CleaningSlotDB.slot_date == eval_date).first()
        cs = CleaningSlotSchema(
            id=cs_db.id, slot_date=cs_db.slot_date, bay_id=cs_db.bay_id,
            capacity=cs_db.capacity, assigned_train_ids=cs_db.assigned_train_ids or []
        ) if cs_db else None

        sb_db = db.query(StablingBayDB).filter(StablingBayDB.occupying_train_id == t_id).first()
        sb = StablingBaySchema(
            id=sb_db.id, bay_id=sb_db.bay_id, track_name=sb_db.track_name,
            position_order=sb_db.position_order, occupying_train_id=sb_db.occupying_train_id,
            blocked_by_train_ids=sb_db.blocked_by_train_ids or []
        ) if sb_db else None

        train_inputs.append(TrainInputData(
            train=TrainsetSchema(
                train_id=t.train_id, name=t.name, induction_count=t.induction_count,
                total_mileage_km=t.total_mileage_km, current_status=DecisionEnum(t.current_status)
            ),
            fitness_certificates=certs,
            job_cards=jobs,
            branding_contract=bc,
            recent_mileage=mr,
            cleaning_slot=cs,
            stabling_bay=sb
        ))

    return train_inputs


@router.get("/trains")
def list_trains(db: Session = Depends(get_db)):
    trains = db.query(TrainsetDB).all()
    res = []
    for t in trains:
        certs = db.query(FitnessCertificateDB).filter(FitnessCertificateDB.train_id == t.train_id).all()
        jobs = db.query(JobCardDB).filter(JobCardDB.train_id == t.train_id, JobCardDB.status == "open").all()
        bc = db.query(BrandingContractDB).filter(BrandingContractDB.train_id == t.train_id).first()
        
        has_expired_cert = any(c.status == "expired" for c in certs)
        has_critical_job = any(j.severity == "critical" for j in jobs)
        
        res.append({
            "train_id": t.train_id,
            "name": t.name,
            "total_mileage_km": t.total_mileage_km,
            "induction_count": t.induction_count,
            "current_status": t.current_status,
            "open_job_cards_count": len(jobs),
            "has_expired_cert": has_expired_cert,
            "has_critical_job": has_critical_job,
            "branding_advertiser": bc.advertiser if bc else None
        })
    return res


@router.get("/trains/{train_id}")
def get_train_detail(train_id: str, db: Session = Depends(get_db)):
    train = db.query(TrainsetDB).filter(TrainsetDB.train_id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
        
    certs = db.query(FitnessCertificateDB).filter(FitnessCertificateDB.train_id == train_id).all()
    jobs = db.query(JobCardDB).filter(JobCardDB.train_id == train_id).all()
    bc = db.query(BrandingContractDB).filter(BrandingContractDB.train_id == train_id).first()
    mileage_logs = db.query(MileageRecordDB).filter(MileageRecordDB.train_id == train_id).order_by(MileageRecordDB.record_date.desc()).limit(14).all()
    stabling = db.query(StablingBayDB).filter(StablingBayDB.occupying_train_id == train_id).first()

    return {
        "train": train,
        "fitness_certificates": certs,
        "job_cards": jobs,
        "branding_contract": bc,
        "recent_mileage": mileage_logs,
        "stabling_bay": stabling
    }


@router.get("/plan/{eval_date}", response_model=List[InductionDecisionSchema])
def get_induction_plan(eval_date: date, db: Session = Depends(get_db)):
    decisions_db = db.query(InductionDecisionDB).filter(InductionDecisionDB.eval_date == eval_date).all()
    
    if not decisions_db:
        # Generate plan on demand
        train_inputs = fetch_train_inputs(db, eval_date)
        decisions = optimize_induction_plan(train_inputs, eval_date)
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
        decisions_db = db.query(InductionDecisionDB).filter(InductionDecisionDB.eval_date == eval_date).all()

    return [
        InductionDecisionSchema(
            id=d.id,
            eval_date=d.eval_date,
            train_id=d.train_id,
            decision=DecisionEnum(d.decision),
            score=d.score,
            is_eligible=d.is_eligible,
            hard_violations=d.hard_violations or [],
            soft_breakdown=d.soft_breakdown,
            reason_trace=d.reason_trace or [],
            decided_by=d.decided_by,
            override_of=DecisionEnum(d.override_of) if d.override_of else None,
            override_reason=d.override_reason
        )
        for d in decisions_db
    ]


@router.post("/plan/{eval_date}/generate", response_model=List[InductionDecisionSchema])
def regenerate_induction_plan(eval_date: date, db: Session = Depends(get_db)):
    db.query(InductionDecisionDB).filter(InductionDecisionDB.eval_date == eval_date).delete()
    db.commit()
    
    train_inputs = fetch_train_inputs(db, eval_date)
    decisions = optimize_induction_plan(train_inputs, eval_date)

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
            override_of=None,
            override_reason=None
        ))
    db.commit()

    return decisions


@router.post("/plan/override")
def override_decision(req: OverrideRequest, db: Session = Depends(get_db)):
    decision_db = db.query(InductionDecisionDB).filter(
        InductionDecisionDB.eval_date == req.eval_date,
        InductionDecisionDB.train_id == req.train_id
    ).first()

    if not decision_db:
        raise HTTPException(status_code=404, detail="Decision record not found for date and train")

    prev_decision = decision_db.decision
    decision_db.override_of = prev_decision
    decision_db.decision = req.new_decision.value
    decision_db.decided_by = req.decided_by
    decision_db.override_reason = req.override_reason
    decision_db.reason_trace.insert(0, f"⚠️ OVERRIDDEN BY SUPERVISOR: Changed from {prev_decision} to {req.new_decision.value}. Reason: {req.override_reason}")

    # Log to Audit Table
    audit = AuditLogDB(
        timestamp=datetime.utcnow(),
        action="DECISION_OVERRIDE",
        eval_date=req.eval_date,
        train_id=req.train_id,
        previous_decision=prev_decision,
        new_decision=req.new_decision.value,
        user_name=req.decided_by,
        reason=req.override_reason
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": f"Successfully updated {req.train_id} decision to {req.new_decision.value}"}


@router.post("/simulate", response_model=WhatIfResponse)
def run_what_if_simulation(req: WhatIfRequest, db: Session = Depends(get_db)):
    train_inputs = fetch_train_inputs(db, req.eval_date)
    
    # Calculate baseline original plan
    original_plan = optimize_induction_plan(train_inputs, req.eval_date)

    # Mutate in-memory inputs for hypothetical simulation
    simulated_inputs = []
    for ti in train_inputs:
        t_id = ti.train.train_id
        
        # Clone certs & mutate if requested
        sim_certs = [c.model_copy() for c in ti.fitness_certificates]
        if t_id in req.expired_cert_train_ids:
            for sc in sim_certs:
                if sc.department == DepartmentEnum.ROLLING_STOCK:
                    sc.status = "expired"
                    sc.valid_until = req.eval_date - timedelta(days=1)

        # Clone job cards & mutate if requested
        sim_jobs = [j.model_copy() for j in ti.job_cards]
        if t_id in req.critical_job_train_ids:
            sim_jobs.append(JobCardSchema(
                train_id=t_id,
                job_id="SIM-CRIT-999",
                description="Simulated Critical Pressure Leak",
                severity=SeverityEnum.CRITICAL,
                status="open",
                opened_at=datetime.utcnow()
            ))

        simulated_inputs.append(TrainInputData(
            train=ti.train.model_copy(),
            fitness_certificates=sim_certs,
            job_cards=sim_jobs,
            branding_contract=ti.branding_contract.model_copy() if ti.branding_contract else None,
            recent_mileage=ti.recent_mileage.model_copy() if ti.recent_mileage else None,
            cleaning_slot=ti.cleaning_slot.model_copy() if ti.cleaning_slot else None,
            stabling_bay=ti.stabling_bay.model_copy() if ti.stabling_bay else None
        ))

    target_count = req.target_induction_count or TARGET_INDUCTION_COUNT
    simulated_plan = optimize_induction_plan(simulated_inputs, req.eval_date, target_induction=target_count)

    diff_summary = []
    orig_map = {d.train_id: d for d in original_plan}
    changes_count = 0

    for sim_d in simulated_plan:
        t_id = sim_d.train_id
        orig_d = orig_map.get(t_id)
        if orig_d and orig_d.decision != sim_d.decision:
            changes_count += 1
            diff_summary.append(f"{t_id}: Changed from {orig_d.decision.value} to {sim_d.decision.value}")

    return WhatIfResponse(
        original_plan=original_plan,
        simulated_plan=simulated_plan,
        changes_count=changes_count,
        diff_summary=diff_summary
    )


@router.get("/analytics/mileage")
def get_mileage_analytics(db: Session = Depends(get_db)):
    trains = db.query(TrainsetDB).all()
    history = db.query(MileageRecordDB).order_by(MileageRecordDB.record_date.asc()).all()
    
    date_map = {}
    for h in history:
        d_str = str(h.record_date)
        if d_str not in date_map:
            date_map[d_str] = []
        date_map[d_str].append(h.km_run)

    trend = [
        {
            "date": d_str,
            "avg_km_run": round(sum(kms) / len(kms), 1) if kms else 0.0,
            "max_km_run": round(max(kms), 1) if kms else 0.0,
            "min_km_run": round(min(kms), 1) if kms else 0.0
        }
        for d_str, kms in date_map.items()
    ]

    fleet_mileage = [
        {"train_id": t.train_id, "name": t.name, "total_mileage_km": t.total_mileage_km}
        for t in sorted(trains, key=lambda x: x.total_mileage_km, reverse=True)
    ]

    return {
        "fleet_mileage": fleet_mileage,
        "daily_trend": trend
    }


@router.get("/analytics/branding")
def get_branding_analytics(db: Session = Depends(get_db)):
    contracts = db.query(BrandingContractDB).all()
    res = []
    for c in contracts:
        shortfall = max(0.0, c.required_exposure_hours_per_week - c.actual_exposure_hours_this_week)
        penalty = shortfall * c.penalty_per_shortfall_hour
        res.append({
            "contract_id": c.contract_id,
            "advertiser": c.advertiser,
            "train_id": c.train_id,
            "required_exposure_hours_per_week": c.required_exposure_hours_per_week,
            "actual_exposure_hours_this_week": c.actual_exposure_hours_this_week,
            "shortfall_hours": round(shortfall, 1),
            "penalty_incurred": round(penalty, 2),
            "sla_compliance_pct": round(min(100.0, (c.actual_exposure_hours_this_week / c.required_exposure_hours_per_week) * 100), 1)
        })
    return res


@router.get("/audit")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLogDB).order_by(AuditLogDB.timestamp.desc()).all()
    return logs
