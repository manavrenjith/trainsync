"""
KMRL Engine - Explanation Generator

Transforms decision logic, hard constraint checks, and soft score breakdowns
into structured, human-readable bullet points for the dashboard.
"""

from typing import List
from app.schemas import TrainInputData, SoftScoreBreakdown, DecisionEnum

def generate_decision_explanation(
    train_data: TrainInputData,
    is_eligible: bool,
    hard_violations: List[str],
    soft_breakdown: SoftScoreBreakdown,
    final_decision: DecisionEnum,
    rank: int,
    total_trains: int
) -> List[str]:
    """
    Produces plain-language bullet points explaining why a train received its assignment.
    """
    traces: List[str] = []
    
    if not is_eligible:
        traces.append(f"INELIGIBLE FOR INDUCTION: Failed {len(hard_violations)} hard constraint(s).")
        for v in hard_violations:
            traces.append(f"• CRITICAL FAIL: {v}")
        if any("Critical open job-card" in v for v in hard_violations):
            traces.append("• Action: Routed to IBL Bay for mandatory maintenance work.")
        else:
            traces.append("• Action: Held in Standby / Inspection Bay until compliance renewed.")
        return traces

    # Eligible Train Trace
    traces.append(f"HARD CONSTRAINTS PASSED: All fitness certificates valid (Rolling Stock, Signalling, Telecom).")
    
    # Mileage explanation
    m_score = soft_breakdown.mileage_balance_score
    km = train_data.train.total_mileage_km
    if m_score > 0.6:
        traces.append(f"• Mileage Priority (+{m_score}): Cumulative mileage ({km:.1f} km) is below fleet average → Priority boost to equalize wear.")
    elif m_score < 0.4:
        traces.append(f"• Mileage Caution ({m_score}): Cumulative mileage ({km:.1f} km) is above fleet average.")
    else:
        traces.append(f"• Mileage Balanced ({m_score}): Cumulative mileage ({km:.1f} km) near fleet average.")

    # Branding explanation
    if train_data.branding_contract:
        b_score = soft_breakdown.branding_urgency_score
        adv = train_data.branding_contract.advertiser
        req = train_data.branding_contract.required_exposure_hours_per_week
        act = train_data.branding_contract.actual_exposure_hours_this_week
        if act < req:
            shortfall = req - act
            traces.append(f"• Branding Urgency (+{b_score}): Contract '{adv}' behind target by {shortfall:.1f} hrs this week → Priority boost.")
        else:
            traces.append(f"• Branding Target Met ({b_score}): Contract '{adv}' has satisfied weekly quota ({act:.1f}/{req:.1f} hrs).")

    # Job Card explanation
    open_jobs = [j for j in train_data.job_cards if j.status.lower() == "open"]
    if open_jobs:
        traces.append(f"• Open Work Orders ({soft_breakdown.job_card_penalty_score}): {len(open_jobs)} non-critical minor job-card(s) logged.")
    else:
        traces.append("• Maintenance Clear (1.0): Zero open job-cards.")

    # Final Decision & Rank
    traces.append(f"• Final Multi-Objective Score: {soft_breakdown.total_weighted_score:.3f} (Rank #{rank} of {total_trains} eligible trains).")
    if final_decision == DecisionEnum.INDUCT:
        traces.append(f"• DECISION: INDUCT into active revenue service for tomorrow.")
    elif final_decision == DecisionEnum.STANDBY:
        traces.append(f"• DECISION: STANDBY reserve trainset at depot.")
    else:
        traces.append(f"• DECISION: IBL maintenance line.")

    return traces
