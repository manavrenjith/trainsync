"""
KMRL Engine - Fleet Optimizer

Combines hard constraint evaluation, soft scoring, ranking, and optimization solver
to assign final decisions (INDUCT, STANDBY, IBL) to the entire fleet for a given target date.
"""

from typing import List
from datetime import date
from app.schemas import (
    TrainInputData,
    InductionDecisionSchema,
    DecisionEnum,
    SoftScoreBreakdown
)
from app.engine.constraints import evaluate_hard_constraints
from app.engine.scoring import calculate_soft_score
from app.engine.explain import generate_decision_explanation
from app.config import TARGET_INDUCTION_COUNT, FLEET_AVERAGE_KM_BASELINE

def optimize_induction_plan(
    train_inputs: List[TrainInputData],
    eval_date: date,
    target_induction: int = TARGET_INDUCTION_COUNT
) -> List[InductionDecisionSchema]:
    """
    Evaluates all input trainsets for eval_date and produces ranked induction decisions.
    Hard-ineligible trains are assigned IBL (if critical job open) or STANDBY (otherwise).
    Hard-eligible trains are scored and ranked descending; top target_induction are assigned INDUCT.
    """
    total_trains = len(train_inputs)
    
    # Calculate fleet average mileage dynamically if inputs provided
    if total_trains > 0:
        actual_avg_km = sum(t.train.total_mileage_km for t in train_inputs) / total_trains
    else:
        actual_avg_km = FLEET_AVERAGE_KM_BASELINE

    evaluated_trains = []

    # Step 1: Evaluate Hard & Soft logic per train
    for t_data in train_inputs:
        is_eligible, violations = evaluate_hard_constraints(t_data, eval_date)
        soft_breakdown = calculate_soft_score(t_data, actual_avg_km)
        evaluated_trains.append({
            "data": t_data,
            "is_eligible": is_eligible,
            "violations": violations,
            "score": soft_breakdown.total_weighted_score,
            "breakdown": soft_breakdown
        })

    # Step 2: Separate eligible vs ineligible
    eligible = [t for t in evaluated_trains if t["is_eligible"]]
    ineligible = [t for t in evaluated_trains if not t["is_eligible"]]

    # Sort eligible trains by score descending
    eligible.sort(key=lambda x: x["score"], reverse=True)

    decisions: List[InductionDecisionSchema] = []

    # Step 3: Assign INDUCT to top N eligible trains
    rank = 1
    for t in eligible:
        t_data = t["data"]
        if rank <= target_induction:
            decision_type = DecisionEnum.INDUCT
        else:
            decision_type = DecisionEnum.STANDBY

        explanation = generate_decision_explanation(
            t_data,
            is_eligible=True,
            hard_violations=[],
            soft_breakdown=t["breakdown"],
            final_decision=decision_type,
            rank=rank,
            total_trains=len(eligible)
        )

        decisions.append(InductionDecisionSchema(
            eval_date=eval_date,
            train_id=t_data.train.train_id,
            decision=decision_type,
            score=t["score"],
            is_eligible=True,
            hard_violations=[],
            soft_breakdown=t["breakdown"],
            reason_trace=explanation,
            decided_by="system"
        ))
        rank += 1

    # Step 4: Process ineligible trains (IBL if critical job card open, otherwise STANDBY)
    for t in ineligible:
        t_data = t["data"]
        has_critical_job = any(
            j.status.lower() == "open" and j.severity.value == "critical"
            for j in t_data.job_cards
        )
        decision_type = DecisionEnum.IBL if has_critical_job else DecisionEnum.STANDBY

        explanation = generate_decision_explanation(
            t_data,
            is_eligible=False,
            hard_violations=t["violations"],
            soft_breakdown=t["breakdown"],
            final_decision=decision_type,
            rank=999,
            total_trains=total_trains
        )

        decisions.append(InductionDecisionSchema(
            eval_date=eval_date,
            train_id=t_data.train.train_id,
            decision=decision_type,
            score=0.0,
            is_eligible=False,
            hard_violations=t["violations"],
            soft_breakdown=t["breakdown"],
            reason_trace=explanation,
            decided_by="system"
        ))

    return decisions
