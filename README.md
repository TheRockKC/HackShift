# AnnData

AnnData is an intelligent agricultural platform empowering farmers with integrated digital tools:
- **CropClock:** Harvest listings, buyer offer comparison, and net-earnings maximization.
- **FairQueue:** Transparent machinery rental and conflict-free booking scheduling.
- **WaterWindow:** Precision irrigation advisories tailored to crop stage, soil texture, and weather.
- **FarmConnect Camps:** Rural digital literacy and awareness camp scheduling and discovery.
- **SchemeSaathi:** Government scheme discovery and privacy-first eligibility matching.

For backend setup, architecture, and API documentation, see [backend/README.md](backend/README.md).
For frontend setup, architecture, and usage guide, see [frontend/README.md](frontend/README.md).

## Quickstart

### 1. Start Backend:
```bash
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### 2. Start Frontend:
```bash
cd frontend
npm run dev
```
Open **http://localhost:5173** to view the app.
