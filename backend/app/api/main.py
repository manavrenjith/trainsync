"""
KMRL FastAPI Main Application Entrypoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.database import engine, Base

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KMRL AI-Driven Train Induction API",
    description="Backend decision-support API for Kochi Metro Rail Limited fleet induction (SIH PS #80)",
    version="1.0.0"
)

# Enable CORS for local React dashboard development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "system": "KMRL Train Induction Planning System",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.api.main:app", host="0.0.0.0", port=8000, reload=True)
