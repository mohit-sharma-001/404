import os
from pydantic import BaseModel


class Settings(BaseModel):
    APP_NAME: str = "Tropical Cyclone System"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./cyclone.db"
    MODEL_CHECKPOINT_PATH: str = "data/model_checkpoint.pth"
    TCIR_DATA_PATH: str = os.environ.get("TCIR_DATA_PATH", "data/raw/TCIR-CPAC_IO_SH.h5")
    GLOBAL_TCIR_DATA_PATH: str = os.environ.get(
        "GLOBAL_TCIR_DATA_PATH", "data/raw/TCIR-ATLN_EPAC_WPAC.h5"
    )


settings = Settings()
