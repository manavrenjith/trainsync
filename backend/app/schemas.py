from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum

class DecisionEnum(str, Enum):
    INDUCT = "INDUCT"
    STANDBY = "STANDBY"
    IBL = "IBL"

class SeverityEnum(str, Enum):
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"

class DepartmentEnum(str, Enum):
    ROLLING_STOCK = "rolling_stock"
    SIGNALLING = "signalling"
    TELECOM = "telecom"

class FitnessCertificateSchema(BaseModel):
    id: Optional[int] = None
    train_id: str
    department: DepartmentEnum
    valid_from: date
    valid_until: date
    status: str = "valid"  # valid, expired

class JobCardSchema(BaseModel):
    id: Optional[int] = None
    train_id: str
    job_id: str
    description: str
    severity: SeverityEnum
    status: str = "open"  # open, closed
    opened_at: datetime
    estimated_close_at: Optional[datetime] = None

class BrandingContractSchema(BaseModel):
    id: Optional[int] = None
    contract_id: str
    advertiser: str
    train_id: str
    required_exposure_hours_per_week: float
    actual_exposure_hours_this_week: float
    penalty_per_shortfall_hour: float

class MileageRecordSchema(BaseModel):
    id: Optional[int] = None
    train_id: str
    record_date: date
    km_run: float
    component_wear_flags: Dict[str, Any] = Field(default_factory=dict)

class CleaningSlotSchema(BaseModel):
    id: Optional[int] = None
    slot_date: date
    bay_id: str
    capacity: int
    assigned_train_ids: List[str] = Field(default_factory=list)

class StablingBaySchema(BaseModel):
    id: Optional[int] = None
    bay_id: str
    track_name: str
    position_order: int
    occupying_train_id: Optional[str] = None
    blocked_by_train_ids: List[str] = Field(default_factory=list)

class TrainsetSchema(BaseModel):
    train_id: str
    name: str
    induction_count: int = 0
    total_mileage_km: float = 0.0
    current_status: DecisionEnum = DecisionEnum.STANDBY

class TrainInputData(BaseModel):
    train: TrainsetSchema
    fitness_certificates: List[FitnessCertificateSchema]
    job_cards: List[JobCardSchema]
    branding_contract: Optional[BrandingContractSchema] = None
    recent_mileage: Optional[MileageRecordSchema] = None
    cleaning_slot: Optional[CleaningSlotSchema] = None
    stabling_bay: Optional[StablingBaySchema] = None

class SoftScoreBreakdown(BaseModel):
    mileage_balance_score: float
    branding_urgency_score: float
    job_card_penalty_score: float
    cleaning_readiness_score: float
    stabling_ease_score: float
    total_weighted_score: float

class InductionDecisionSchema(BaseModel):
    id: Optional[int] = None
    eval_date: date
    train_id: str
    decision: DecisionEnum
    score: float
    is_eligible: bool
    hard_violations: List[str] = Field(default_factory=list)
    soft_breakdown: Optional[SoftScoreBreakdown] = None
    reason_trace: List[str] = Field(default_factory=list)
    decided_by: str = "system"  # "system" or "supervisor"
    override_of: Optional[DecisionEnum] = None
    override_reason: Optional[str] = None

class OverrideRequest(BaseModel):
    eval_date: date
    train_id: str
    new_decision: DecisionEnum
    override_reason: str
    decided_by: str = "Supervisor"

class WhatIfRequest(BaseModel):
    eval_date: date
    expired_cert_train_ids: List[str] = Field(default_factory=list)
    critical_job_train_ids: List[str] = Field(default_factory=list)
    cleaning_bay_capacity_override: Optional[int] = None
    target_induction_count: Optional[int] = None

class WhatIfResponse(BaseModel):
    original_plan: List[InductionDecisionSchema]
    simulated_plan: List[InductionDecisionSchema]
    changes_count: int
    diff_summary: List[str]
