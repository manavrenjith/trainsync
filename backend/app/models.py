"""
KMRL Database ORM Models
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class TrainsetDB(Base):
    __tablename__ = "trainsets"

    train_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    induction_count = Column(Integer, default=0)
    total_mileage_km = Column(Float, default=0.0)
    current_status = Column(String, default="STANDBY")

class FitnessCertificateDB(Base):
    __tablename__ = "fitness_certificates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String, ForeignKey("trainsets.train_id"), nullable=False)
    department = Column(String, nullable=False)  # rolling_stock, signalling, telecom
    valid_from = Column(Date, nullable=False)
    valid_until = Column(Date, nullable=False)
    status = Column(String, default="valid")

class JobCardDB(Base):
    __tablename__ = "job_cards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String, ForeignKey("trainsets.train_id"), nullable=False)
    job_id = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # critical, major, minor
    status = Column(String, default="open")     # open, closed
    opened_at = Column(DateTime, default=datetime.utcnow)
    estimated_close_at = Column(DateTime, nullable=True)

class BrandingContractDB(Base):
    __tablename__ = "branding_contracts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    contract_id = Column(String, nullable=False, unique=True)
    advertiser = Column(String, nullable=False)
    train_id = Column(String, ForeignKey("trainsets.train_id"), nullable=False)
    required_exposure_hours_per_week = Column(Float, default=40.0)
    actual_exposure_hours_this_week = Column(Float, default=0.0)
    penalty_per_shortfall_hour = Column(Float, default=500.0)

class MileageRecordDB(Base):
    __tablename__ = "mileage_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String, ForeignKey("trainsets.train_id"), nullable=False)
    record_date = Column(Date, nullable=False)
    km_run = Column(Float, default=0.0)
    component_wear_flags = Column(JSON, default=dict)

class CleaningSlotDB(Base):
    __tablename__ = "cleaning_slots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slot_date = Column(Date, nullable=False)
    bay_id = Column(String, nullable=False)
    capacity = Column(Integer, default=4)
    assigned_train_ids = Column(JSON, default=list)

class StablingBayDB(Base):
    __tablename__ = "stabling_bays"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bay_id = Column(String, nullable=False, unique=True)
    track_name = Column(String, nullable=False)
    position_order = Column(Integer, nullable=False)
    occupying_train_id = Column(String, nullable=True)
    blocked_by_train_ids = Column(JSON, default=list)

class InductionDecisionDB(Base):
    __tablename__ = "induction_decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    eval_date = Column(Date, nullable=False)
    train_id = Column(String, nullable=False)
    decision = Column(String, nullable=False)  # INDUCT, STANDBY, IBL
    score = Column(Float, default=0.0)
    is_eligible = Column(Boolean, default=True)
    hard_violations = Column(JSON, default=list)
    soft_breakdown = Column(JSON, default=dict)
    reason_trace = Column(JSON, default=list)
    decided_by = Column(String, default="system")
    override_of = Column(String, nullable=True)
    override_reason = Column(String, nullable=True)

class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String, nullable=False)
    eval_date = Column(Date, nullable=False)
    train_id = Column(String, nullable=False)
    previous_decision = Column(String, nullable=True)
    new_decision = Column(String, nullable=False)
    user_name = Column(String, default="Supervisor")
    reason = Column(String, nullable=False)
