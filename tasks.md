# Task Checklist - Fresh Ledger

- `[/]` **Milestone 1: Project Initialization & Config**
  - `[x]` Initialize Node.js project (`npm init`) and create `package.json`.
  - `[x]` Install Node dependencies: `express`, `dotenv`, `cors`, `mysql2`, `jsonwebtoken`, `bcryptjs`, `multer`, `xlsx`, `@google/genai`.
  - `[x]` Create Python dependencies file `requirements.txt` (`scikit-learn`, `numpy`, `pandas`).
  - `[x]` Configure `vercel.json` for routing multiple runtimes (`api/index.js` Node, `api/predict.py` Python).
  - `[x]` Setup `.env.example` with placeholders for DB connections and Gemini API keys.


- `[/]` **Milestone 2: DB Schema & Seeding (TiDB Cloud)**
  - `[x]` Create `src/config/database.js` connection pool setup using `mysql2`.
  - `[x]` Write a script to create tables according to the schema designed in `design.md` (integrated in seeder).
  - `[x]` Create `src/services/seedService.js` to seed:
    - 2 Users: `manager` and `staff` (with hashed passwords).
    - Basic ingredients (e.g., Daging Sapi, Ayam, Telur, Beras, Bawang).
    - Menu items and their recipe ingredient breakdown.
    - Historical sales/usage data (3 months daily usage) to supply Ruben's forecaster.
    - 15-20 transaction logs from the last 2 weeks (marked used and wasted) to populate the dashboard.


- `[/]` **Milestone 3: Core API & Auth (Node.js)**
  - `[x]` Build Express boilerplate server (`api/index.js`).
  - `[x]` Implement Authentication Router:
    - Login API (`/api/auth/login`) generating JWT token.
    - Middleware to verify JWT (`verifyToken`).
    - Middleware to restrict access to Manager only (`isManager`).


- `[/]` **Milestone 4: Stock Logging & Receipts**
  - `[x]` Set up file storage folder for receipt uploads or support local mockup storing.
  - `[x]` Implement `POST /api/stock` (Form-data supporting file uploads via `multer` + manual fields).
  - `[x]` Implement `GET /api/stock` to fetch active inventory.
  - `[x]` Implement `PUT /api/stock/:id/status` to mark stock batches as `used` or `wasted`.


- `[/]` **Milestone 5: AI Food Rescue Recommender**
  - `[x]` Integrate `@google/genai` Gemini SDK in `src/services/geminiService.js`.
  - `[x]` Implement RAG prompt logic: pulling expiring ingredients and menu items, calling Gemini API to output structured JSON recommendations.
  - `[x]` Create `POST /api/promo/rescue` to trigger Gemini, save recommendations to `promo_drafts` with status `pending_approval`.
  - `[x]` Create `GET /api/promo/drafts` for Manager to see pending approvals.
  - `[x]` Create `PUT /api/promo/drafts/:id/approve` to change promo status to `active`.


- `[x]` **Milestone 6: Python Procurement Forecaster**
  - `[x]` Develop Python serverless script `api/predict.py` using `scikit-learn` (Random Forest model).
  - `[x]` Implement predict endpoint: receives JSON input of historical weekly quantities, runs prediction, and returns forecast value.
  - `[x]` Implement Node.js middleware/service to query DB, format history, fetch Vercel python endpoint, and display procurement advice.

- `[x]` **Milestone 7: Analytics & Reporting**
  - `[x]` Implement `/api/analytics/waste-index` to calculate total spent vs total wasted and the Waste Index percentage.
  - `[x]` Implement `/api/analytics/export-excel` using `exceljs` to parse DB transaction logs and return binary Excel sheet download.

- `[ ]` **Milestone 8: Verification & Deployment**
  - `[ ]` Test all API endpoints locally.
  - `[ ]` Deploy project to Vercel and verify connection with TiDB Cloud.
