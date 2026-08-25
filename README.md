# 🌀 Multi-Spectral Tropical Cyclone Intensity & Trajectory Forecasting System

An end-to-end artificial intelligence application for real-time tropical cyclone satellite pattern classification, meteorological intensity nowcasting, high-wind destruction alert warning, and +24h/+48h spatial trajectory forecasting over the North Indian Ocean basin.

---

## 🌟 Key Capabilities & Features

### 🛰️ 1. Adaptive Multi-Spectral Satellite Data Ingestion
- Supports multi-channel satellite data ingestion across four distinct instrument spectra:
  - **Infrared (IR - TIR-1 10.8µm)**: Deep thermal cloud-top brightness temperature scanning.
  - **Visible (VIS - 0.65µm)**: High-resolution cloud morphology and convective storm structure.
  - **Water Vapor (WV - 6.8µm)**: Upper-tropospheric moisture transport and atmospheric flow.
  - **Passive Microwave (PMW - 89GHz)**: Deep eyewall radar structure and precipitation cores.

### 🤖 2. Deep Learning Classification & IMD Intensity Nowcasting
- **Early-Fusion Neural Pipeline**: Fuses multi-spectral satellite tensor channels to classify storm organization and estimate maximum sustained wind speeds (in km/h & knots).
- **IMD Meteorological Categorization**: Enforces strict alignment with India Meteorological Department (IMD) cyclone intensity thresholds:
  - **Depression**: 31–49 km/h
  - **Deep Depression**: 50–61 km/h
  - **Cyclonic Storm**: 62–88 km/h
  - **Severe Cyclonic Storm**: 89–117 km/h
  - **Very Severe Cyclonic Storm**: 118–165 km/h
  - **Extremely Severe Cyclonic Storm**: 166–220 km/h
  - **Super Cyclonic Storm**: $\ge 221$ km/h

### 🚨 3. High-Wind Destruction Hazard Alert System ($\ge 100\text{ km/h}$)
- **Automated Emergency Pop-Up Alert**: Automatically triggers a prominent hazard alert notification whenever estimated sustained wind speeds reach or exceed **100 km/h**.
- **Structured Risk Breakdown**: Details potential structural collapse, tree & power grid outages, coastal storm surges, and airborne projectile hazards alongside recommended emergency response protocols.

### 🗺️ 4. Interactive Trajectory & Track Prediction Spatial Map
- **Automated Displacement Forecasting**: Multi-Output HistGradientBoosting Regressors trained on historical IBTrACS cyclone track observations to forecast:
  - **+24-Hour Position**: Forecasted latitude/longitude, movement direction (e.g. NNE, NW), and displacement distance.
  - **+48-Hour Position**: Extended trajectory position and total displacement distance.
- **Interactive Map Canvas**: Visualizes current cyclone position, forecasted positions, vector heading directions, and spatial grid bounds (5°N–25°N, 60°E–100°E) on an interactive SVG coordinate plane.

### 🛡️ 5. Satellite Spectrum Mismatch Validation
- **Spectral Protection**: Built-in channel detection (`detectImageSpectrum`) validates uploaded satellite imagery against active instrument modes to prevent prediction on mismatched satellite spectra (e.g., strictly blocking IR image execution under Visible mode).

---

## 🏗️ Architecture & Technology Stack

### Frontend Application
- **Core Framework**: React 18, TypeScript, Vite
- **Styling & Aesthetics**: Vanilla CSS Design Tokens, Dynamic Glassmorphism, Micro-Animations
- **UI Components & Icons**: Lucide React Icons, Custom Canvas Particle Engine
- **State & Routing**: React Hooks, Axios API Service Layer

### Backend API & ML Infrastructure
- **Server Framework**: Python 3.10+, FastAPI, Uvicorn
- **Machine Learning & DL**: PyTorch, Scikit-Learn (MultiOutput Regressor), NumPy, Pandas
- **Image Processing**: Pillow (PIL), H5Py, SciPy
- **Database & Persistence**: SQLAlchemy, SQLite (`predictions.db`)

---

## 📁 Repository Structure

```text
404/
├── src/                          # React Frontend Source Code
│   ├── components/               # UI Cards, Destruction Modal, Track Map, Header
│   │   ├── AdaptiveUploadCard.tsx
│   │   ├── PredictionCard.tsx
│   │   ├── DestructionAlertModal.tsx
│   │   ├── TrackPredictionSection.tsx
│   │   └── PresetSelector.tsx
│   ├── data/                     # IMD cyclone categories & mock telemetry
│   ├── services/                 # Axios API integration service layer
│   ├── theme/                    # Multi-channel color palette design system
│   ├── types/                    # TypeScript interfaces
│   ├── pages/                    # Main Dashboard page
│   └── main.tsx                  # Application entry point
├── cyclone_backend/              # Python FastAPI Backend
│   ├── app/
│   │   ├── api/                  # API endpoints (/predict, /predict-track, /history)
│   │   ├── core/                 # Preprocessing & spectral validation
│   │   ├── db/                   # SQLAlchemy SQLite models & database connection
│   │   ├── models/               # PyTorch classification & Track ML inference
│   │   └── training/             # IBTrACS dataset preparation & model training scripts
│   ├── data/                     # Model checkpoints (model_checkpoint.pth, track_model.pkl)
│   ├── requirements.txt          # Python dependencies
│   ├── Procfile                  # Cloud deployment configuration
│   └── test_validation.py        # Automated test suite
└── README.md                     # Project documentation
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **Python**: v3.10 or higher
- **Git**

---

### 2. Backend Setup & Local Server

1. Navigate into the backend directory:
   ```bash
   cd cyclone_backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .\.venv\Scripts\activate

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server using Uvicorn:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   The backend API will run locally at `http://127.0.0.1:8000`.  
   Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup & Local Development

1. Open a new terminal tab and navigate to the project root directory:
   ```bash
   cd 404
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser and visit `http://localhost:5173`.

---

## 🌐 Production Deployment

### Backend Deployment (Render / Railway)
1. Push project to **GitHub**.
2. Create a new **Web Service** on [Render.com](https://render.com/).
3. Set **Root Directory** to `cyclone_backend`.
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Copy the generated live backend URL (e.g. `https://cyclone-backend.onrender.com`).

### Frontend Deployment (Vercel / Netlify)
1. Create a new project on [Vercel](https://vercel.com/) connected to your GitHub repository.
2. Set Framework Preset to **Vite**.
3. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://cyclone-backend.onrender.com`
4. Click **Deploy**.

---

## 📡 API Reference Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Health check endpoint returning server status. |
| `/api/v1/predict` | `POST` | Accepts multi-spectral satellite imagery (IR, WV, VIS, PMW), returns cyclone classification, wind speed, confidence, and validation status. |
| `/api/v1/predict-track` | `POST` | Accepts current location coordinates and storm speed/direction, returns +24h and +48h trajectory forecasts. |
| `/api/v1/history` | `GET` | Retrieves recent historical cyclone prediction records from SQLite database. |

---

## 📄 License & Advisory Note
This software is developed for scientific research, educational demonstrations, and meteorological analysis. For real-world operational disaster response and evacuation warnings, always consult official advisories issued by national meteorological agencies (such as IMD / NDMA / JTWC).
