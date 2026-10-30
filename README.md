# Stock Market Trend Analysis — Full-Stack Web Application

A full-stack financial analytics and machine-learning web platform that transforms historical stock price data into interactive technical charts, automated statistical summaries, and next-observation trend predictions using supervised Logistic Regression.

This project modernizes the original Python console workflow into a responsive web application while strictly preserving all original datasets, reports, presentations, workbooks, and ML models.

---

## 1. System Architecture

```text
minisravan/
|-- backend/                                # FastAPI Backend Service
|   |-- app/
|   |   |-- main.py                         # FastAPI Application, CORS & Middleware
|   |   |-- api/
|   |   |   `-- router.py                   # REST API Endpoints (/api/...)
|   |   |-- core/
|   |   |   `-- config.py                   # Environment, CORS, Paths & Size Limits
|   |   |-- schemas/
|   |   |   `-- dataset.py                  # Pydantic v2 Request/Response Schemas
|   |   `-- services/
|   |       `-- dataset_service.py          # Adapter reusing ML logic & dataset isolation
|   |-- data/
|   |   `-- uploads/                        # Session-isolated uploaded CSV storage
|   |-- tests/
|   |   `-- test_api.py                     # Pytest suite (17 automated tests)
|   `-- requirements.txt                    # Backend Python dependencies
|
|-- frontend/                               # React + Vite + TypeScript Frontend
|   |-- src/
|   |   |-- components/
|   |   |   |-- Header.tsx                  # Active dataset badge & quick refresh
|   |   |   |-- Sidebar.tsx                 # Persistent financial terminal navigation
|   |   |   |-- StatCard.tsx                # Metric card with trend pills
|   |   |   |-- LoadingSpinner.tsx          # Accessible async loading indicators
|   |   |   `-- ErrorAlert.tsx              # Resilient error display with retry
|   |   |-- context/
|   |   |   `-- DatasetContext.tsx          # Global dataset selection & state
|   |   |-- pages/
|   |   |   |-- DashboardPage.tsx           # 7 key metrics, dataset status & preview
|   |   |   |-- StockAnalysisPage.tsx       # Historical table, pagination & statistics
|   |   |   |-- TrendPredictionPage.tsx     # ML prediction, metrics & confusion matrix
|   |   |   |-- ChartsPage.tsx              # Recharts multi-series interactive explorer
|   |   |   |-- DataUploadPage.tsx          # Drag-and-drop CSV validation & ingestion
|   |   |   `-- AboutProjectPage.tsx        # Project documentation & Viva Q&A
|   |   |-- services/
|   |   |   `-- api.ts                      # Reusable API client
|   |   |-- types/
|   |   |   `-- index.ts                    # TypeScript interface definitions
|   |   |-- App.tsx                         # Main layout & routing
|   |   |-- index.css                       # Tailwind directives & terminal theme
|   |   `-- main.tsx                        # Application mount
|   |-- package.json                        # Node dependencies & scripts
|   |-- vite.config.ts                      # Vite configuration
|   |-- tailwind.config.js                  # Financial dark theme color palette
|   `-- test-frontend.js                    # Automated frontend verification
|
|-- Stock_Market_Trend_Analysis_Ready_Project/ # Preserved Original Assets
|   `-- Stock_Market_Trend_Analysis/
|       |-- dataset/
|       |   |-- stock_data.csv              # Original 706-record dataset
|       |   `-- processed_stock_data.csv    # Original processed dataset
|       |-- src/                            # Reused Core Logic
|       |   |-- data_preprocessing.py       # OHLC validation and cleaning
|       |   |-- data_analysis.py            # MA10, MA20, Daily Return calculations
|       |   |-- prediction.py               # Logistic Regression & chronological split
|       |   `-- visualization.py            # Static Matplotlib plot generators
|       |-- tests/
|       |   `-- test_workflow.py            # Original unit tests
|       |-- main.py                         # Preserved original CLI menu
|       |-- Project_Report.docx             # Academic project report
|       |-- Project_Presentation.pptx       # Presentation slides
|       |-- Stock_Market_Analysis.xlsx      # Original Excel workbook
|       `-- Viva_Questions_Answers.txt      # Defense preparation notes
|
|-- start_backend.ps1                       # Launch FastAPI backend
|-- start_frontend.ps1                      # Launch React frontend
`-- start_all.ps1                           # Launch full-stack platform
```

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Tooling:** Vite 5
- **Styling:** Tailwind CSS (Dark financial terminal palette: Navy `#080c14`, Slate `#0f172a`, Emerald `#10b981`, Red `#ef4444`, Cyan `#38bdf8`)
- **Visualizations:** Recharts (Interactive Line, Area, Bar charts with custom tooltips)
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI with Python 3.10+ (tested on Python 3.15)
- **Server:** Uvicorn ASGI
- **Data & ML:** Pandas, NumPy, Scikit-learn
- **Validation:** Pydantic v2
- **File Uploads:** python-multipart with 10MB limit and schema normalization
- **Testing:** Pytest & FastAPI TestClient

---

## 3. Quick Start (Windows PowerShell)

### One-Click Startup
To launch both the backend and frontend simultaneously in separate terminals:

```powershell
.\start_all.ps1
```

### Manual Individual Startup

#### Terminal 1 — Backend (FastAPI)
```powershell
# Activate Python virtual environment and run backend
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python -m uvicorn app.main:app --reload --app-dir backend --port 8000
```
- Backend API: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

#### Terminal 2 — Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
- Frontend Application: `http://localhost:5173`

---

## 4. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and dataset readiness |
| `GET` | `/api/dataset/default` | Default dataset metadata (706 observations) |
| `POST` | `/api/dataset/upload` | Upload & validate custom stock CSV (10MB limit) |
| `GET` | `/api/dataset/{dataset_id}/summary` | Key summary metrics (Latest Close, Price Change, MA10, MA20) |
| `GET` | `/api/dataset/{dataset_id}/analysis` | Paginated historical indicators with statistical summaries |
| `GET` | `/api/dataset/{dataset_id}/charts` | Time-series data points formatted for Recharts |
| `POST` | `/api/dataset/{dataset_id}/predict` | Train Logistic Regression model and return latest prediction |
| `GET` | `/api/dataset/{dataset_id}/evaluation` | Out-of-sample metrics (Accuracy, Precision, Recall, F1, Confusion Matrix) |
| `GET` | `/api/dataset/{dataset_id}/download/processed` | Export cleaned dataset with indicators as CSV |
| `GET` | `/api/dataset/{dataset_id}/download/evaluation` | Export evaluation report as JSON |
| `GET` | `/api/dataset/{dataset_id}/download/prediction` | Export latest prediction as JSON |

---

## 5. Machine Learning Methodology

1. **Target Formulation:**
   - Target is binary: `1` (UP) if the next observed close is strictly higher than the current close; otherwise `0` (DOWN/FLAT).
   - Training features at row $t$ strictly use data available at or before observation $t$. The final row has an unobserved future target and serves as the latest forecast point.

2. **Feature Set (8 dimensions):**
   - `Open`, `High`, `Low`, `Close`, `Volume`
   - `MA10` (10-day rolling simple moving average)
   - `MA20` (20-day rolling simple moving average)
   - `Daily_Return` (session percentage return)

3. **Chronological Train/Test Split (80/20):**
   - The first 80% of rows are used for training; the remaining 20% are held out for testing.
   - Financial time series are **never shuffled** to prevent future information leakage.
   - `StandardScaler` is fitted strictly on the training partition only.

4. **Prediction Probabilities Policy:**
   - In accordance with the project's original design, prediction probabilities and confidence scores are intentionally omitted to prevent speculative overconfidence in an educational model.

---

## 6. Automated Testing

### Backend Test Suite
Run the 17 automated Pytest checks:

```powershell
python -m pytest backend/tests/test_api.py -v
```

Tests verify:
- Health check and metadata endpoints
- Financial summary indicators calculation
- Date range filtering and table pagination
- Machine learning Logistic Regression metrics
- CSV downloads and JSON report formatting
- Dataset isolation (uploaded files never mutate default data)
- Schema validation (missing columns, invalid extensions, invalid values)
- Edge cases (insufficient data for moving averages or ML training)

### Frontend Production Build Check
Run the production build and verification script:

```powershell
cd frontend
npm test
npm run build
```

---

## 7. Preserved Original Assets

All initial project materials remain intact inside `Stock_Market_Trend_Analysis_Ready_Project/Stock_Market_Trend_Analysis/`:
- `Project_Report.docx`: 572 KB project documentation.
- `Project_Presentation.pptx`: 41 KB slide deck.
- `Stock_Market_Analysis.xlsx`: 52 KB spreadsheet calculations.
- `Viva_Questions_Answers.txt`: Comprehensive oral defense Q&A.
- `main.py`: Interactive CLI terminal workflow.
