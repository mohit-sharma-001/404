from sqlalchemy import JSON, Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from app.db.database import Base


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    filename = Column(String, nullable=False)
    has_cyclone = Column(Boolean, nullable=False, default=True)
    center_lat = Column(Float, nullable=True)
    center_lon = Column(Float, nullable=True)
    intensity_category = Column(String, nullable=False)
    secondary_category = Column(String, nullable=True)
    estimated_wind_speed_kmh = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    secondary_confidence = Column(Float, nullable=True)

    trend = Column(String, nullable=False)
    trend_confidence = Column(Float, nullable=False)
    sources_used = Column(JSON, nullable=False)
    is_valid_input = Column(Boolean, nullable=False, default=True)
    warning_message = Column(String, nullable=True)
