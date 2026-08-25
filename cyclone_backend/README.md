# Cyclone Analysis & Forecasting System

Multi-Source Tropical Cyclone Identification, Intensity Nowcasting, and 24–48 Hour Track Prediction System built using FastAPI, PyTorch, and Scikit-Learn.

---

## 📌 Features

* **Multi-Source Satellite Nowcasting (CNN)**: Analyzes Infrared (IR), Water Vapor (WV), Visible (VIS), and Passive Microwave (PMW) satellite imagery to classify cyclone intensity into official IMD categories and estimate wind speed in km/h.
* **24-Hour & 48-Hour Track Forecasting**: Predicts future Latitude and Longitude coordinates ($\text{Lat}_{24\text{h}}, \text{Lon}_{24\text{h}}$ and $\text{Lat}_{48\text{h}}, \text{Lon}_{48\text{h}}$), movement heading direction (e.g. NW, NE), and distance traveled in kilometers.
* **REST API & Database History**: Provides asynchronous endpoints (`/predict`, `/predict-track`, `/history`) backed by SQLite database persistence.
* **Interactive CLI Testers**: Dedicated terminal testing tools for manual track testing and full system verification.

---

## 🛠️ Technology Stack

* **Backend**: FastAPI, Uvicorn (Python 3.10+)
* **Deep Learning**: PyTorch (`CycloneCNN` 4-Channel Architecture)
* **Machine Learning**: Scikit-Learn (`HistGradientBoostingRegressor`, `MultiOutputRegressor`)
* **Data Processing**: Pandas, NumPy, HDF5 (`h5py`), Pillow (`PIL`)
* **Database & ORM**: SQLite, SQLAlchemy, Pydantic

---

## 📊 Model Accuracy & Performance Metrics

### Track Prediction Model (NOAA IBTrACS North Indian Ocean Dataset)

| Metric | 24-Hour Forecast | 48-Hour Forecast |
| :--- | :--- | :--- |
| **Median Distance Error** | **98.89 km** | **244.29 km** |
| **Mean Distance Error** | 115.72 km | 274.62 km |
| **Accuracy (within 100 km)** | **50.6%** | — |
| **Accuracy (within 150 km)** | **74.0%** | — |
| **Accuracy (within 250 km)** | — | **52.3%** |

#### Sample Test Storm Distance Errors:
* **Cyclone Tauktae (2021)**: $72.98\text{ km}$ (24h) | $197.08\text{ km}$ (48h)
* **Cyclone Dana (2024)**: $75.48\text{ km}$ (24h) | $207.30\text{ km}$ (48h)
* **Cyclone Remal (2024)**: $76.47\text{ km}$ (24h) | $142.66\text{ km}$ (48h)
* **Cyclone Biparjoy (2023)**: $87.81\text{ km}$ (24h) | $222.53\text{ km}$ (48h)
* **Cyclone Mocha (2023)**: $86.23\text{ km}$ (24h) | $165.70\text{ km}$ (48h)

---

## 📁 Directory Structure

```text
404/
├── app/
│   ├── main.py                  # FastAPI app entry point
│   ├── api/
│   │   └── routes.py            # API endpoints (/predict, /predict-track, /history)
│   ├── core/
│   │   ├── config.py            # System configuration & file paths
│   │   └── preprocessing.py     # Satellite image normalization & 4-channel fusion
│   ├── models/
│   │   ├── inference.py         # CycloneCNN model architecture & intensity engine
│   │   ├── track_inference.py   # Track forecast model engine
│   │   └── schema.py            # Pydantic schemas for API request/response
│   ├── db/
│   │   ├── database.py          # SQLite database connection
│   │   └── models_db.py         # Database models (PredictionHistory)
│   └── training/
│       ├── dataset_loader.py    # TCIR HDF5 dataset loader
│       ├── train.py             # CNN model training script
│       ├── track_dataset.py     # IBTrACS dataset preprocessor & lag feature engineer
│       └── train_track.py       # Track model training & evaluation script
├── data/
│   ├── track_model.pkl          # Saved track prediction model artifact
│   ├── model_checkpoint.pth     # Saved CNN intensity model weights
│   ├── test_samples/            # Sample PNG satellite images
│   └── raw/                     # Raw HDF5 satellite datasets
├── ibtracs.NI.list.v04r01.csv   # Official NOAA IBTrACS dataset
├── info.txt                     # Quick reference info summary
├── test_full_system.py          # Terminal test script for satellite + track predictions
├── test_track_cli.py            # Interactive CLI track prediction tester
├── requirements.txt             # Dependencies
└── README.md                    # Project documentation
```

---

## 🚀 Setup & Execution

### 1. Installation
```bash
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Running FastAPI Server
```bash
uvicorn app.main:app --reload
```
* Swagger UI Docs: `http://127.0.0.1:8000/docs`

### 3. Terminal Testing Tools
```bash
# Run full system test (Satellite Intensity + Track Forecast)
python test_full_system.py

# Run interactive manual track tester
python test_track_cli.py

# Re-train track prediction model & view storm accuracy
python app/training/train_track.py
```
