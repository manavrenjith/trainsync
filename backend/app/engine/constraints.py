"""
KMRL Engine - Hard Constraints Evaluator

Pure functions for testing and explainability without side effects.
Checks:
1. Fitness certificates (Rolling Stock, Signalling, Telecom) valid on evaluation date.
2. Job card status (No OPEN CRITICAL job cards).
3. Stabling geometry (No severe blockage by non-movable trains).
"""

from typing import Tuple, List
from datetime import date
from app.schemas import TrainInputData, DepartmentEnum, SeverityEnum

REQUIRED_DEPARTMENTS = [
    DepartmentEnum.ROLLING_STOCK,
    DepartmentEnum.SIGNALLING,
    DepartmentEnum.TELECOM
]

def evaluate_hard_constraints(train_data: TrainInputData, eval_date: date) -> Tuple[bool, List[str]]:
    """
    Evaluates whether a train passes all hard constraints for induction.
    Returns (is_eligible, list_of_violation_reasons).
    """
    violations: List[str] = []
    
    # 1. Fitness Certificates Check
    dept_certs = {cert.department: cert for cert in train_data.fitness_certificates}
    
    for dept in REQUIRED_DEPARTMENTS:
        cert = dept_certs.get(dept)
        if not cert:
            violations.append(f"Missing required fitness certificate for {dept.value.replace('_', ' ').title()}")
        else:
            if cert.status.lower() == "expired" or cert.valid_until < eval_date:
                violations.append(f"Expired {dept.value.replace('_', ' ').title()} certificate (valid until {cert.valid_until})")
            elif cert.valid_from > eval_date:
                violations.append(f"Future {dept.value.replace('_', ' ').title()} certificate not yet active (valid from {cert.valid_from})")

    # 2. Critical Job-Cards Check
    open_critical_jobs = [
        job for job in train_data.job_cards
        if job.status.lower() == "open" and job.severity == SeverityEnum.CRITICAL
    ]
    for job in open_critical_jobs:
        violations.append(f"Critical open job-card [{job.job_id}]: {job.description}")

    # 3. Stabling Geometry Check
    # If the stabling bay is blocked by 2 or more trains that are currently in maintenance, shunting is blocked.
    if train_data.stabling_bay and len(train_data.stabling_bay.blocked_by_train_ids) > 2:
        blockers = ", ".join(train_data.stabling_bay.blocked_by_train_ids)
        violations.append(f"Stabling line exit physically blocked by trains: {blockers}")

    is_eligible = len(violations) == 0
    return is_eligible, violations
