# AnnData Backend

FastAPI backend service powering AnnData, integrating:
- **CropClock:** Harvest listings, buyer offer submission, net earnings calculator, and acceptance workflows.
- **FairQueue:** Agricultural machinery rental, conflict-free booking scheduler, and status lifecycle management.
- **WaterWindow:** Rule-based irrigation advisor adapting to crop type, growth stage, soil texture, moisture, and rainfall alerts.
- **FarmConnect Camps:** Digital literacy and scheme awareness camp directory with chronological upcoming filters and next-camp discovery.
- **SchemeSaathi:** Privacy-first government scheme catalogue (PM-KISAN, PMFBY, SMAM, KCC) and potential eligibility matching based on registered farm locations and aggregated landholding.

---

## 1. Quickstart & Local Developer Setup

### Prerequisites
- Python 3.10+ (tested with Python 3.12)
- Neon PostgreSQL database instance (or local PostgreSQL)
- Git

### Installation Steps

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\activate
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install project dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Copy the provided `.env.example` template to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Neon PostgreSQL connection credentials:
   ```ini
   PORT=8000
   ENVIRONMENT=development
   NEON_BRANCH=production
   DATABASE_URL=postgresql+psycopg://username:password@ep-sample-pooler.region.neon.tech/neondb?sslmode=require
   DATABASE_URL_UNPOOLED=postgresql+psycopg://username:password@ep-sample.region.neon.tech/neondb?sslmode=require
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
   ```

5. **Run database migrations:**
   Apply existing schema migrations to your PostgreSQL database:
   ```bash
   alembic upgrade head
   ```

6. **Seed verified government schemes (Idempotent):**
   ```bash
   python scripts/seed_schemes.py --confirm
   ```
   *(Running without `--confirm` safely defaults to a dry-run preview).*

7. **Start the development server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

8. **Access API Documentation:**
   - Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc UI: [http://localhost:8000/redoc](http://localhost:8000/redoc)
   - Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 2. Running Automated Tests

All tests execute against an isolated in-memory SQLite database (`StaticPool`) using FastAPI dependency overrides (`dependency_overrides[get_db]`), guaranteeing **zero modification to the live database**.

Run the full regression test suite:
```bash
python -m unittest discover tests -v
```

Run focused module tests:
```bash
python -m unittest tests/test_cropclock.py -v
python -m unittest tests/test_fairqueue.py -v
python -m unittest tests/test_waterwindow.py -v
python -m unittest tests/test_camps.py -v
python -m unittest tests/test_schemesaathi.py -v
python -m unittest tests/test_seed_schemes.py -v
```

---

## 3. Important Security & Authentication Notice

> [!WARNING]
> **Prototype Role Validation Notice:**
> Production-grade authentication (e.g., JWT bearer tokens, OAuth2, session cookies, password hashing) is **not yet implemented**.
>
> In the current hackathon prototype, role enforcement is performed by accepting explicit entity IDs (`farmer_id`, `provider_id`, `coordinator_id`, `buyer_id`) in request bodies and verifying that the referenced user exists and holds the appropriate `role` column in the `users` table (`admin`, `farmer`, `buyer`, `machinery_provider`).
>
> **Do not treat explicit-ID role checks as secure authentication.** A dedicated authentication and token-issuance layer will be added in a subsequent security phase.

---

## 4. Frontend Integration Guide (React)

### CORS Configuration
CORS middleware is pre-configured in `app/main.py`. The backend permits requests from frontend ports defined in `CORS_ORIGINS`:
- `http://localhost:3000` (Create React App default)
- `http://localhost:5173` (Vite default)
- `http://127.0.0.1:3000` / `http://127.0.0.1:5173`

To add staging or production URLs, update `CORS_ORIGINS` in your `.env` file as a comma-separated list.

### Pagination Pattern
All paginated list endpoints return this consistent envelope:
```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

### Date and Time Format
All timestamp fields (`scheduled_start`, `scheduled_end`, `start_time`, `end_time`) **must be timezone-aware ISO 8601 strings** (e.g., `"2026-10-25T10:00:00+05:30"` or `"2026-10-25T04:30:00Z"`). Naive datetimes without timezone offsets will return HTTP 422.

### Standard Error Format
FastAPI validation errors return HTTP 422 (`{"detail": [{"loc": [...], "msg": "..."}]}`).
Business rule errors return HTTP 400, 404, or 409 (`{"detail": "Descriptive error message"}`).

---

## 5. API Contract Reference

### A. CropClock Module
- **`POST /api/harvests`** (Status: 201)
  - *Payload:* `farmer_id`, `farm_id`, `crop_name`, `quantity_kg`, `expected_harvest_date`, `min_acceptable_price_per_kg`, `status` ("open").
  - *Checks:* Farmer owns specified farm and holds `farmer` role.
- **`GET /api/harvests`** (Status: 200)
  - *Query Params:* `status`, `crop_name`, `state`, `district`, `page`, `page_size`.
- **`GET /api/harvests/{harvest_id}`** (Status: 200)
- **`POST /api/harvests/{harvest_id}/offers`** (Status: 201)
  - *Payload:* `buyer_id`, `offered_price_per_kg`, `transportation_covered`, `estimated_pickup_date`.
  - *Checks:* User has `buyer` role. Prevents duplicate pending offers.
- **`GET /api/harvests/{harvest_id}/compare-offers`** (Status: 200)
  - *Calculates:* Net earnings per offer deducting commission and transport costs.
- **`PUT /api/harvests/{harvest_id}/offers/{offer_id}/accept`** (Status: 200)
  - *Checks:* Farmer owns harvest; marks offer `accepted`, harvest `reserved`, rejects other pending offers.

### B. FairQueue Module
- **`POST /api/machinery`** (Status: 201)
  - *Payload:* `provider_id`, `equipment_type`, `name`, `hourly_rate`, `daily_rate`, `state`, `district`.
  - *Checks:* User has `machinery_provider` role. At least one positive rate required.
- **`GET /api/machinery`** (Status: 200)
  - *Query Params:* `equipment_type`, `state`, `district`, `is_available`, `page`, `page_size`. Hides private phone/email.
- **`GET /api/machinery/{machinery_id}`** (Status: 200)
- **`POST /api/machinery/{machinery_id}/bookings`** (Status: 201)
  - *Payload:* `farmer_id`, `start_time` (tz-aware), `end_time` (tz-aware).
  - *Checks:* Time interval overlap conflict detection against existing pending/confirmed bookings (HTTP 409).
- **`PUT /api/bookings/{booking_id}/status`** (Status: 200)
  - *Payload:* `user_id`, `status` ("confirmed", "cancelled", "completed").
  - *Checks:* Role authorization for transitions (farmer or provider).

### C. WaterWindow Module
- **`POST /api/irrigation/plan`** (Status: 201)
  - *Payload:* `farmer_id`, `farm_id`, `crop`, `growth_stage` ("vegetative", "flowering", "yield_formation", "ripening"), optional `soil_type`, `soil_moisture_level` ("low", "medium", "adequate", "saturated"), `rain_forecast_next_24h` (bool).
  - *Returns:* Rule-based water volume (`liters_per_acre`), urgency level, interval, next irrigation time, and agronomic rationale.
- **`GET /api/irrigation/plans`** (Status: 200)
  - *Query Params:* `farm_id`, `crop`, `page`, `page_size`.
- **`GET /api/irrigation/plans/{plan_id}`** (Status: 200)

### D. FarmConnect Camps Module
- **`POST /api/camps`** (Status: 201)
  - *Payload:* `coordinator_id`, `title`, `description`, `scheduled_start` (tz-aware), `scheduled_end` (tz-aware), `venue`, `village`, `district`, `state`, `topics`, `contact_person`, `contact_phone`.
  - *Checks:* `coordinator_id` has `admin` role; `scheduled_end > scheduled_start`.
- **`GET /api/camps`** (Status: 200)
  - *Query Params:* `state`, `district`, `include_past` (default `false`), `page`, `page_size`.
  - *Behavior:* Excludes cancelled camps. Defaults to upcoming camps (`scheduled_end >= now UTC`) ordered chronologically.
- **`GET /api/camps/next`** (Status: 200)
  - *Returns:* Earliest upcoming non-cancelled camp. Returns 404 if none exist.
- **`GET /api/camps/{camp_id}`** (Status: 200)

### E. SchemeSaathi Module
- **`GET /api/schemes`** (Status: 200)
  - *Query Params:* `state`, `category`, `q` (search across name and description), `page`, `page_size`.
  - *Returns:* Active verified schemes (`pm-kisan`, `pmfby`, `smam`, `kisan-credit-card`) with official portal URLs.
- **`GET /api/schemes/{scheme_id}`** (Status: 200)
- **`PUT /api/farmer/{farmer_id}/profile`** (Status: 200)
  - *Payload:* `primary_crop_type`, `has_irrigation` (bool), `has_kcc` (bool), `social_category` ("general", "obc", "sc", "st"), `gender` ("male", "female", "other").
  - *Privacy:* All fields optional. Rejects Aadhaar, PAN, or financial numbers.
- **`GET /api/schemes/farmer/{farmer_id}/matches`** (Status: 200)
  - *Returns:* Preliminary potential scheme matches (`match_status: "potential_match"`) calculated from farmer's registered farm locations and total aggregated landholding ($ \sum \text{area\_acres} $). Missing profile attributes are reported under `missing_information` rather than disqualifying the farmer.
