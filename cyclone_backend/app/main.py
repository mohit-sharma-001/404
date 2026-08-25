from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.db.database import Base, engine

# Automatically create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tropical Cyclone Identification, Classification & Prediction API",
    description="Multi-source tropical cyclone identification, classification, and prediction system backend.",
    version="0.1.0",
)

# Enable CORS for hackathon frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire API routes under /api/v1 prefix
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok"}
