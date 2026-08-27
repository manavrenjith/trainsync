# Project Plan: AI-Driven Train Induction Planning & Scheduling for KMRL
**SIH Internal Problem Statement #80 (SIH25081) — Government of Kerala / Software / Smart Automation**

This document is a full build plan intended to be handed to a coding agent. It defines scope, architecture, data model, module breakdown, milestones, and acceptance criteria so the agent can execute with minimal clarification.

---

## 1. Problem Summary

Every night, KMRL must decide, for each trainset in its fleet (~25 trains), one of three states for the next day:
- **Induct into service** (revenue run)
- **Hold in standby**
- **Send to IBL (Inspection Bay Line) for maintenance**

This decision must simultaneously satisfy six categories of constraints:
1. **Fitness certificates** — validity windows issued by Rolling-Stock, Signalling, and Telecom departments; an expired certificate makes a train ineligible for induction.
2. **Job-card status** — open maintenance work orders (e.g. from IBM Maximo); trains with critical open jobs cannot be inducted.
3. **Branding priorities** — advertiser contracts requiring a minimum number of exposure hours/km per trainset per period; missing targets has contractual/financial penalties.
4. **Mileage balancing** — cumulative km must be balanced across the fleet to equalize wear on bogies, brake pads, HVAC.
5. **Cleaning & detailing slots** — limited bay/crew capacity per night for interior deep-cleaning and exterior wash.
6. **Stabling geometry** — physical depot track/bay layout constrains which trains can be pulled out without shunting others, affecting turn-out time.

Today this is done manually (spreadsheets, WhatsApp, experience-based judgment) by a small team under time pressure (decision window is short, late at night after service ends). It's error-prone, not explainable, doesn't scale, and doesn't learn from outcomes.

**Goal**: Build a decision-support system that ingests these six data streams, produces a ranked, constraint-satisfying induction plan for the next day with explanations, allows human override, simulates "what-if" scenarios, and improves over time using historical outcome data.

---

## 2. Objectives & Success Criteria

| Objective | Success criteria |
|---|---|
| Automate nightly induction ranking | System proposes a full induction/standby/IBL list for all trains in <10 seconds |
| Respect hard constraints | Zero constraint violations (expired fitness cert, critical open job-card) in any proposed plan |
| Optimize soft objectives | Mileage variance across fleet reduced vs. baseline; branding exposure targets met within tolerance |
| Explainability | Every decision has a human-readable reason trace (which rule/score drove it) |
| Human-in-the-loop | Supervisor can override any decision with a logged reason; overrides feed back into training data |
| What-if simulation | User can simulate effect of e.g. "certificate X expires early" or "bay 3 unavailable" before committing |
| Demonstrable in a hackathon setting | End-to-end working prototype with realistic mock data, dashboard, and a clear narrative for judges |

---

## 3. Scope

### In scope (prototype/MVP)
- Mock/synthetic data generators for all six data categories (since live KMRL systems like Maximo/IoT feeds are not accessible to a hackathon team)
- Rule-based constraint engine (hard constraints) + optimization/ranking engine (soft constraints)
- Optional ML layer that learns from historical decisions/outcomes to refine scoring
- REST API backend
- Web dashboard: daily induction list, explanations, override UI, what-if simulator, fleet mileage/branding analytics
- Audit log of decisions and overrides

### Out of scope (mention as future work)
- Live integration with KMRL's actual Maximo/IoT/UNS systems (design for it, don't build it)
- Real-time re-planning during service hours (mid-day disruptions) — note as a stretch goal
- Mobile app
- Multi-depot scaling beyond Muttom depot's geometry (design should be depot-agnostic though)

---

## 4. Users & Roles
- **Depot Supervisor / Operations Controller** — reviews and approves/overrides the nightly plan
- **Maintenance Manager** — inputs/updates job-card status, sees maintenance load
- **Admin** — manages fitness certificate data, branding contracts, mileage records
- **(Judges/demo viewer)** — needs a clear, visual, explainable dashboard

---

## 5. System Architecture

```
                     ┌─────────────────────────┐
                     │   Data Sources (mocked)  │
                     │  - Fitness Certificates   │
                     │  - Job Cards (Maximo-like)│
                     │  - Branding Contracts     │
                     │  - Mileage Logs           │
                     │  - Cleaning Slot Capacity │
                     │  - Stabling Geometry      │
                     └────────────┬─────────────┘
                                  │ ingestion / ETL
                                  ▼
                     ┌─────────────────────────┐
                     │   Data Layer (DB)         │
                     │  Postgres / SQLite         │
                     └────────────┬─────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │  Constraint & Scoring     │
                     │  Engine (backend service) │
                     │  - Hard constraint filter │
                     │  - Soft-constraint scorer │
                     │  - Optimizer (ILP/greedy) │
                     │  - ML ranking model        │
                     │  - Explanation generator   │
                     └────────────┬─────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │   REST API (FastAPI)      │
                     └────────────┬─────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │   Frontend Dashboard      │
                     │  React + Tailwind + charts│
                     └───────────────────────────┘
```

---

## 6. Tech Stack (recommended)

- **Backend**: Python 3.11, FastAPI, Pydantic
- **Optimization**: `pulp` or `ortools` for ILP-based induction assignment; fallback to a greedy/weighted-scoring heuristic if ILP is overkill for the demo
- **ML (optional layer)**: scikit-learn (gradient boosting / logistic regression) trained on historical decisions + outcomes (e.g. did the train fail unexpectedly, was branding SLA met) to produce a "risk/priority score" that feeds the optimizer
- **Database**: SQLite for prototype simplicity (Postgres if agent wants production realism)
- **Frontend**: React + Vite + TailwindCSS + Recharts for charts
- **Mock data**: Python `faker`-based generators, seeded for reproducibility
- **Auth**: simple role-based login (JWT) — not the focus, keep minimal
- **Testing**: pytest for backend logic, especially constraint engine
- **Deployment (demo)**: Docker Compose (backend + frontend + db) for one-command run

---

## 7. Data Model (core entities)

**Trainset**
- `train_id`, `name`, `induction_count`, `total_mileage_km`, `current_status` (in_service/standby/ibl)

**FitnessCertificate**
- `train_id`, `department` (rolling_stock/signalling/telecom), `valid_from`, `valid_until`, `status`

**JobCard**
- `train_id`, `job_id`, `description`, `severity` (critical/major/minor), `status` (open/closed), `opened_at`, `estimated_close_at`

**BrandingContract**
- `contract_id`, `advertiser`, `train_id` (assigned wrap), `required_exposure_hours_per_week`, `actual_exposure_hours_this_week`, `penalty_per_shortfall_hour`

**MileageRecord**
- `train_id`, `date`, `km_run`, `component_wear_flags` (bogie/brake/hvac thresholds)

**CleaningSlot**
- `date`, `bay_id`, `capacity`, `assigned_train_ids`

**StablingBay**
- `bay_id`, `position_order`, `occupying_train_id`, `blocks_bays` (which bays it must be moved before to exit)

**InductionDecision** (output + audit)
- `date`, `train_id`, `decision` (induct/standby/ibl), `score`, `reason_trace` (structured list), `decided_by` (system/user), `override_of` (nullable), `override_reason` (nullable)

---

## 8. Core Logic Design

### 8.1 Hard constraint filter (must pass to be eligible for induction)
A train is **ineligible for induction** if any of:
- Any required fitness certificate is expired or missing
- Any open job-card with severity = critical
- Assigned stabling bay cannot physically exit without violating shunting limits for the night

Ineligible trains are automatically routed to `standby` or `ibl` (ibl if job-card open, standby otherwise).

### 8.2 Soft-constraint scoring (for trains that pass hard filter)
Compute a weighted score per eligible train combining (all normalized 0–1):
- **Mileage balancing score**: higher score for trains with below-average cumulative mileage (they need more service to catch up) — or lower score if you want to send high-mileage trains for maintenance instead; define clearly and document the choice
- **Branding urgency score**: higher score if the train's branding contract is behind on required exposure hours for the period
- **Job-card minor-risk score**: slight penalty for trains with open minor job-cards (still eligible but lower priority)
- **Cleaning readiness score**: bonus if train's cleaning slot was completed and is not due again
- **ML risk score** (if using the ML layer): learned score reflecting predicted likelihood of in-service failure based on history

Weighted sum → final priority score. Rank trains descending; induct top-N trains where N = fleet target for next day (e.g. required for peak service), fill remaining slots with standby, cleaning-due trains get slotted where cleaning capacity allows.

### 8.3 Optimizer
Formulate as an assignment/ILP problem if going beyond greedy ranking:
- Decision variables: `x[train][state] ∈ {0,1}` for state ∈ {induct, standby, ibl}
- Constraints: exactly one state per train; hard-ineligible trains forced to standby/ibl; number inducted = service requirement; cleaning slot capacity per night not exceeded; stabling geometry shunting feasibility
- Objective: maximize sum of soft scores for inducted trains − penalty for branding shortfalls − penalty for mileage imbalance variance

Use `pulp`/`ortools` CBC solver. For a hackathon demo, a well-documented greedy/weighted heuristic is acceptable if solver integration risks time; keep the ILP as a "advanced mode" toggle to show technical depth.

### 8.4 Explanation generator
For every decision, produce a structured trace, e.g.:
```
Train KMRL-014 → INDUCT
- Fitness certs: valid (Rolling-Stock till 2026-09-10, Signalling till 2026-09-05, Telecom till 2026-10-01)
- Job cards: 1 open minor (non-blocking)
- Mileage: 8% below fleet average → priority boost
- Branding: contract #B12 behind by 4hrs this week → priority boost
- Final score: 0.82 (rank 3 of 25)
```
This is rendered in the dashboard per-train.

### 8.5 What-if simulator
Allow user to apply a hypothetical change (e.g. "mark train X's telecom cert as expired", "reduce cleaning bay capacity to 2") and re-run the engine without committing, showing a diff against the current plan.

### 8.6 Learning loop (stretch)
Log actual outcomes (did an inducted train have an unplanned failure? was branding SLA met that week?) and periodically retrain the ML risk score model. For hackathon scope, this can be simulated with a mock outcome generator plus a scheduled retrain script — enough to demonstrate the concept.

---

## 9. Module Breakdown (for the agent to build, in order)

1. **`data/` — Mock data generators**
   - Seeded generators for all 6 entities, ~25 trains, several weeks of history
   - Export to SQLite via seed script
2. **`db/` — Schema & ORM**
   - SQLAlchemy models matching Section 7
   - Migration/seed scripts
3. **`engine/` — Core decision logic**
   - `constraints.py` (hard filter), `scoring.py` (soft scores), `optimizer.py` (ILP/greedy), `explain.py`
   - Unit tests for each with edge cases (expired cert, no data, tie-breaking)
4. **`ml/` — Optional learning layer**
   - Feature extraction from historical decisions/outcomes
   - Model training script + saved model artifact
   - Inference hook consumed by `scoring.py`
5. **`api/` — FastAPI service**
   - Endpoints (see Section 10)
   - Auth (basic JWT/role check)
6. **`frontend/` — Dashboard**
   - Pages: Daily Plan, Train Detail/Explanation, Override, What-If Simulator, Fleet Analytics (mileage/branding charts), Audit Log
7. **`infra/` — Docker Compose, seed/run scripts, README**
8. **`docs/` — Architecture doc, data dictionary, demo script for judges**

---

## 10. API Endpoints (draft)

| Method | Path | Purpose |
|---|---|---|
| GET | `/trains` | List all trains with current status |
| GET | `/trains/{id}` | Train detail incl. certs, job-cards, mileage |
| GET | `/plan/{date}` | Get induction plan for a date (generates if absent) |
| POST | `/plan/{date}/generate` | Force regenerate plan |
| POST | `/plan/{date}/override` | Override a train's decision, with reason |
| POST | `/simulate` | Run what-if scenario, return proposed diff without committing |
| GET | `/analytics/mileage` | Fleet mileage balance over time |
| GET | `/analytics/branding` | Branding SLA compliance per contract |
| GET | `/audit` | Decision & override history |

---

## 11. Milestones & Timeline (suggested for a hackathon sprint)

| Phase | Deliverable | Effort |
|---|---|---|
| 1. Setup | Repo scaffold, schema, mock data generators, seed DB | 0.5 day |
| 2. Core engine | Hard constraint filter + soft scoring + explanation trace, unit-tested | 1 day |
| 3. Optimizer | Greedy ranking working end-to-end; ILP mode added if time allows | 0.5–1 day |
| 4. API | All endpoints wired to engine + DB | 0.5 day |
| 5. Frontend | Daily plan view + explanation + override flow | 1 day |
| 6. Frontend extras | What-if simulator + analytics charts + audit log | 0.5–1 day |
| 7. ML layer (stretch) | Historical outcome mock + trained risk model wired into scoring | 0.5 day |
| 8. Polish | Docker Compose one-command run, seeded demo scenario, README, pitch deck talking points | 0.5 day |

Total: roughly 4–6 focused days, compressible for a 24–36hr hackathon by cutting the ML layer and ILP mode to stretch goals and leaning on the greedy heuristic + strong explanation UI (which is what tends to impress judges most, since it visibly solves the "why" problem the manual process has).

---

## 12. Acceptance Criteria / Definition of Done
- [ ] Running `docker compose up` (or documented run script) starts backend + frontend + seeded DB with one command
- [ ] Dashboard shows a full 25-train induction plan for a selectable date
- [ ] Every train's card shows a plain-language explanation of its decision
- [ ] No plan ever inducts a train with an expired certificate or critical open job-card (verified by unit tests + a demo scenario that intentionally has such a train and shows it correctly excluded)
- [ ] Supervisor can override a decision; override is logged and visible in audit log
- [ ] What-if simulator produces a different plan when a constraint is hypothetically changed, without mutating the committed plan
- [ ] Analytics view shows mileage balance and branding SLA compliance trending over the mock historical period
- [ ] README documents architecture, how to run, and how it would integrate with KMRL's real systems (Maximo, IoT sensors, UNS) as future work

---

## 13. Notes for the Building Agent
- Prioritize a **working vertical slice early**: one train, one date, hard constraints only, rendered on a bare page — then widen.
- Keep the constraint engine **pure functions with no DB/network calls** so it's easily unit-tested and easy to explain live to judges.
- Every design choice around weights/scoring should be a **named constant with a comment**, since judges will ask "why this weight?" — make it configurable, not hardcoded magic numbers.
- Mock data should be **deliberately seeded with a few tricky edge cases** (one train with expired cert, one behind on branding, one with a full job-card queue) so the demo has a clear story to tell rather than a bland uniform fleet.
- Favor clarity and explainability over algorithmic sophistication — for a hackathon, a well-explained greedy heuristic beats an opaque ILP.