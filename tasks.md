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

- `[x]` **Milestone 9: Vanilla HTML/CSS/JS Frontend Development**
  - `[x]` **Phase 9.1: Directory Structure & Serving**
    - `[x]` Configure Express backend (`api/index.js`) to serve `/public` static folder.
    - `[x]` Create `public/index.html` (HTML5 skeleton), `public/style.css` (raw styling), and `public/app.js` (vanilla client logic).
  - `[x]` **Phase 9.2: Auth Session & DOM Toggling**
    - `[x]` Persist `jwt_token` and `user_details` in browser `localStorage`.
    - `[x]` Implement a login form submission listener in `app.js` hitting `/api/auth/login`.
    - `[x]` Toggle layout states using CSS classes (e.g. `.hidden` toggles `.hidden { display: none !important; }` in `style.css`) based on the authenticated user role (`staff` vs `manager`).
  - `[x]` **Phase 9.3: Staff View (Stock Management)**
    - `[x]` **Log Belanja Form:** Input elements for ingredient, quantity, unit price, and expiry date. Includes a file input for receipt photo uploads.
    - `[x]` **Receipt File Upload:** Submit handler to parse inputs and upload receipt image as `FormData` to `POST /api/stock`.
    - `[x]` **Inventory Table:** List active stock batches fetched from `GET /api/stock`.
    - `[x]` **Status Modifiers:** Buttons to mark stock as "Used" or "Wasted" (calling `PUT /api/stock/:id/status`).
    - `[x]` **AI Rescue Trigger:** A button for expiring items (< 2 days) to call `POST /api/promo/rescue`.
  - `[x]` **Phase 9.4: Manager View (Analytics & AI Approval)**
    - `[x]` **Waste Index Indicators:** Read statistics from `GET /api/analytics/waste-index` and display Spent, Wasted, and Waste Index Percentage.
    - `[x]` **Budget Visualizer:** Use raw CSS divs / HTML5 progress bars to visually compare Spent Budget vs Wasted Budget.
    - `[x]` **Excel Exporter:** Excel report download button executing `window.open` using `?token=...` parameter.
    - `[x]` **AI Rescue drafts Console:** Render cards from `GET /api/promo/drafts` showing suggested discount percentages. Wire a click handler to execute `PUT /api/promo/drafts/:id/approve`.
    - `[x]` **Procurement Forecaster:** Dynamic selector to fetch forecasting data from `/api/analytics/procurement-forecast/:id`.
- `[x]` **Milestone 10: Monthly Filtering for Dashboard and Excel Report**
  - `[x]` Add monthly selector (`#filter-month`) in `public/index.html` Manager workspace.
  - `[x]` Update `public/app.js` to initialize the month filter to the current month, bind change event listeners, and pass the parameter to the API calls.
  - `[x]` Update `getWasteIndex` in `src/controllers/analyticsController.js` to filter calculations by month if provided.
  - `[x]` Update `exportExcel` in `src/controllers/analyticsController.js` to filter records by month and append the month to the file name.
  - `[x]` Verify dashboard metrics updates and Excel downloaded reports filter by month.

- `[x]` **Milestone 11: Revisions (Separated Inventory Views, Quantity Deductions, Login Customizations, and Dashboards)**
  - `[x]` **Staff View Revisions:**
    - `[x]` Group and aggregate active stock to display a "Big Scale Overview" of total quantities for each ingredient.
    - `[x]` Implement a separate "Expiry-Grouped Batches" list displaying individual batches ordered by closest expiration dates.
    - `[x]` Add a modal/prompt or inline input field for "Quantity to Use" next to the "Used" action button.
    - `[x]` Modify `PUT /api/stock/:id/status` controller in `src/controllers/stockController.js` to process `quantity_to_deduct`:
      - Deduct quantity from `remaining_quantity`.
      - If `remaining_quantity` drops to 0, mark status as `used`. Otherwise, keep status `active`.
  - `[x]` **Login Page Revisions:**
    - `[x]` Split the login form UI into two distinct paths/tabs: "Staff Login" and "Manager/Owner Login" (visual division).
  - `[x]` **Gear/Wheel Settings Menu:**
    - `[x]` Replace logout button in the header with a gear/wheel dropdown settings menu containing account settings (username, role) and the logout option.
  - `[x]` **Manager View Revisions:**
    - `[x]` Separate dashboard report panels into two sections: "Laporan Bulanan" (filtered by selected month) and "Total Keseluruhan Inventori" (unfiltered, total assets value and total active item stocks).
    - `[x]` Apply conditional CSS color styling (Green, Yellow, Red) and alert notifications for the efficiency card based on the Waste Index value:
      - Green (Efficient): Waste Index < 15% (class `.index-green`, no warning).
      - Yellow (Warning): Waste Index 15% - 25% (class `.index-yellow`). Shows: *"Waste Index mencapai [persentase]%. Kerugian akibat bahan kedaluwarsa mulai memengaruhi efisiensi operasional. Tinjau kembali frekuensi restock dan pola konsumsi bahan."*
      - Red (Critical): Waste Index > 25% (class `.index-red`). Shows: *"Waste Index berada pada level kritis [persentase]%. Sebanyak [kuantitas terbuang] [satuan] bahan makanan telah terbuang karena melewati masa kedaluwarsa. Disarankan mengurangi jumlah pembelian pada periode berikutnya."*
    - `[x]` Update `getWasteIndex` in `src/controllers/analyticsController.js` to calculate and return `total_wasted_quantity` and `wasted_items` list.
- `[x]` **Milestone 12: Change Password Feature**
  - `[x]` **Backend Updates:**
    - `[x]` Add `changePassword` endpoint controller inside `src/controllers/authController.js`.
    - `[x]` Define route `POST /api/auth/change-password` in `src/routes/auth.js` protected by `verifyToken` middleware.
  - `[x]` **Frontend UI Revisions:**
    - `[x]` Replace "Pengaturan Akun" dropdown link in `public/index.html` with "Ganti Password".
    - `[x]` Design and embed a hidden HTML modal dialog for Change Password in `public/index.html`.
    - `[x]` Style the modal dialog in `public/style.css` (overlay, input fields, visual consistency).
    - `[x]` Add script event handlers in `public/app.js` to open the modal, validate input fields, fetch the API, and close the modal.

- `[x]` **Milestone 13: Staff View Revisions (Deduct Waste & Expired Dashboard)**
  - `[x]` **Backend Updates:**
    - `[x]` Refactor `updateStockStatus` controller in `src/controllers/stockController.js` to handle `wasted` partial deduction (subtract quantity and insert a separate `'wasted'` row in `stock_batches`).
    - `[x]` Implement `getExpiredStock` in `src/controllers/stockController.js` and register GET `/api/stock/expired` route.
  - `[x]` **Frontend UI Revisions:**
    - `[x]` Add expired dashboard controls (`#expired-filter-month`) and table (`#expired-stock-list-body`) in the Staff workspace in `public/index.html`.
    - `[x]` Refactor "Waste" button in the batches table to read and send the quantity to update status in `public/app.js`.
    - `[x]` Bind listener to `#expired-filter-month` to fetch and load expired ingredients for the selected month in `public/app.js`.

- `[x]` **Milestone 14: UI Polish Revisions (Mandatory Receipt, Expiry Validation, Preview, Logo, Demo Removal)**
  - `[x]` **Mandatory Receipt Upload:** Add `required` attribute to `#receipt-file` in `public/index.html`. Update label to mark as mandatory.
  - `[x]` **Receipt Image Preview:** Add `#receipt-preview-container` + `#receipt-preview` img in `public/index.html`. Wire FileReader `change` listener in `public/app.js` to display live preview. Clear preview after successful submit.
  - `[x]` **Expiry Date Minimum Validation:** Set `min` attribute on `#expiry_date` to tomorrow's date in `DOMContentLoaded` in `public/app.js`.
  - `[x]` **Remove Demo Login Buttons:** Remove quick-staff and quick-manager button group from `public/index.html`. Remove their event listeners from `public/app.js`.
  - `[x]` **Header Logo Placeholder:** Add inline SVG ledger/checkmark logo in the `<header>` in `public/index.html`.
  - `[x]` **Remove Forecast Method Display:** Remove `#forecast-method` paragraph from forecast result in `public/index.html`. Guard its JS reference with null check in `public/app.js`.
  - `[x]` Update `requirements.md`, `design.md`, and `tasks.md` to reflect all revisions.
