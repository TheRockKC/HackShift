# AnnData Frontend

Modern, simple, and responsive React frontend for the **AnnData** Intelligent Agriculture Platform.

---

## 1. Quickstart

### Prerequisites
- Node.js (v18+)
- Backend running on `http://localhost:8000` (see `../backend/README.md`)

### Setup and Running
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (already installed)
npm install

# Start Vite development server
npm run dev
```

The application will start on **`http://localhost:5173`** with hot module replacement (HMR) and automatic API proxying to `http://localhost:8000`.

To build for production:
```bash
npm run build
```

---

## 2. Integrated Modules

1. **Overview & Dashboard**:
   - System telemetry card with live database status and Neon branch information.
   - Quick navigation to each agricultural module.
   - Quick-switch persona selector for interactive role-based testing.

2. **CropClock (`/api/harvests`, `/api/harvests/{id}/offers`, `/api/harvests/{id}/compare-offers`)**:
   - Browse crop listings with filters by crop variety, location, and status (`available`, `reserved`, `sold`).
   - Create new harvest listings with acreage, expected harvest date, and quality grade.
   - Submit buyer bids with custom transport and logistics cost allocations.
   - Net earnings ranking comparison drawer evaluating estimated net proceeds.
   - Direct offer acceptance and atomic harvest reservation.

3. **FairQueue (`/api/machinery`, `/api/machinery/{id}/bookings`)**:
   - Browse agricultural implements (tractors, combine harvesters, seed drills, rotavators) with hourly and daily pricing.
   - Provider machinery registration form.
   - Time-slot reservation scheduler with automatic conflict detection (HTTP 409).
   - Booking lifecycle management (Confirm, Cancel, Complete).

4. **WaterWindow (`/api/irrigation/plan`, `/api/irrigation/plans`)**:
   - Rule-based scientific irrigation recommendations adapting to crop growth stage (flowering, seedling, maturity), soil type, and observed soil moisture.
   - Precipitation radar integration with alerts to postpone or withhold irrigation before rain.
   - Saved irrigation plan history.

5. **FarmConnect Camps (`/api/camps`, `/api/camps/next`)**:
   - "Earliest Upcoming Camp" spotlight card with venue and coordinator contact.
   - Filterable chronological directory of digital literacy and scheme registration camps.
   - Admin camp scheduler for block coordinators.

6. **SchemeSaathi (`/api/schemes`, `/api/schemes/farmer/{id}/matches`)**:
   - Directory of verified central and state welfare schemes (PM-KISAN, PMFBY, SMAM, KCC) with direct links to official portals.
   - Zero-PII eligibility matcher based on registered farm parcels and aggregated landholding size.
   - Privacy-first voluntary profile updater (crop type, irrigation access, social category, gender).

---

## 3. Persona / Role Switching

The top navigation bar contains an interactive persona switcher:
- **🌾 Farmer** (Default: ID `#65` • Farm `#17` - *Sardar Balvinder Singh*)
- **💼 Produce Buyer** (Default: ID `#66` - *Karan Traders*)
- **🚜 Machinery Provider** (Default: ID `#67` - *Samrala Custom Hiring*)
- **🏛️ Coordinator / Admin** (Default: ID `#68` - *Dr. Hardeep Sandhu*)

You can also enter any custom user ID in the top bar to test existing users in your database.
