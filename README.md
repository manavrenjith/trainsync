# TrainSync: AI-Driven Fleet Induction & Scheduling System
**SIH Internal Problem Statement #80 (SIH25081) — Government of Kerala / Software / Smart Automation**

TrainSync is an operational decision-support platform designed for Kochi Metro Rail Limited (KMRL) Muttom Depot. It ingests data streams across 6 domain categories to automate nightly trainset selection into active revenue service, hot standby, or inspection bay line (IBL) maintenance.

---

## Key Features

1. **Strict Hard Constraint Safeguards**: Guaranteed zero constraint violations. Automatically blocks any train with expired departmental fitness certificates (Rolling Stock, Signalling, Telecom) or critical open work orders.
2. **Multi-Objective Soft Optimization**: Balances fleet cumulative mileage (equalizing wear on bogies and brake pads), prioritizes commercial advertiser branding SLAs, accounts for cleaning readiness, and minimizes stabling track shunting friction.
3. **Transparent Natural-Language Explanations**: Produces a step-by-step reason trace for every train decision, explaining why it was assigned INDUCT, STANDBY, or IBL.
4. **Audited Supervisor Overrides**: Allows depot controllers to manually alter decisions while maintaining an immutable audit log.
5. **Interactive What-If Simulator**: Enables operators to simulate hypothetical scenarios (e.g. sudden cert expiration or reduced fleet service targets) and inspect side-by-side plan diffs without mutating the production database.
6. **Fleet Telemetry & Stabling Diagram**: Real-time stabling track layout line diagram depicting turnout geometry and shunting blockages, alongside 30-day mileage trends and commercial wrap SLA compliance.

---

## Tech Stack

- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0 (SQLite database)
- **Core Engine**: Pure Python functional architecture (`constraints.py`, `scoring.py`, `optimizer.py`, `explain.py`)
- **Frontend**: React 18, Vite, TailwindCSS v4, Recharts, Industrial Dispatch Theme
- **Testing**: `pytest` suite for 100% hard constraint validation
- **Deployment**: Docker Compose for unified backend + frontend launch

---

## Getting Started

### Option 1: Docker Compose (One Command)
```bash
docker compose up --build
```
- Dashboard UI: `http://localhost:3000`
- FastAPI Docs: `http://localhost:8000/docs`

### Option 2: Local Windows Development Script
```cmd
run.bat
```

### Option 3: Manual Startup

**Backend:**
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Seed Database
$env:PYTHONPATH="backend"
python backend/app/data/seed.py

# Run FastAPI Server
uvicorn app.api.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev -- --port 3000
```

---

## Running Unit & Integration Tests

```bash
$env:PYTHONPATH="backend"
python -m pytest backend/tests/
```

---

## Future Integrations (Production Roadmap)

1. **IBM Maximo EAM**: Direct REST/SOAP integration to sync work orders and job cards in real time.
2. **IoT Sensor Feeds (UNS / MQTT)**: Ingestion of live bogie temperature, brake lining wear sensors, and wheel profile measurements from depot wayside detectors.
3. **Unified Name Space (UNS)**: Integration with KMRL central telemetry broker for automated depot stabling track position tracking.
