# Requirements Specification - Fresh Ledger

## 1. Project Overview
**Fresh Ledger** is a web-based digital inventory and food waste predictor system tailored for culinary Micro, Small, and Medium Enterprises (UMKMs). The system aims to:
- Mitigate financial fraud (anti-fraud) by requiring receipt uploads for all stock entry logs.
- Predict raw material procurement needs based on usage trends.
- Calculate and visualize the waste metrics of ingredients.
- Automatically generate promotional menu recommendations when stocks reach critical expiry conditions.

## 2. Target Audience & Personas
- **Staff (Dapur/Kitchen Staff):** Responsible for recording incoming raw materials (with receipt photos), updating stock usage (used/wasted), and submitting critical-stock warnings.
- **Manager/Owner:** Responsible for reviewing financial metrics, reviewing and approving/activating AI-generated promotion suggestions, and exporting report sheets.

---

## 3. Functional Requirements

### FR-1: User Management & Authentication (RBAC)
- The system must support two roles: `staff` and `manager`.
- Users must login with a username and password.
- State access control:
  - `staff` can access stock input, update stock status, and propose promotions.
  - `manager` can access the analytics dashboard, approve promotion drafts, and export Excel reports.

### FR-2: Manual Receipt Archiver & Quick Input (Staff side)
- Staff can upload a photo of a receipt (stored as local file / URL reference in database) during stock entry.
- Quick Input Form parameters:
  - Ingredient Name (`string`, required)
  - Kuantitas (`float`, required)
  - Unit/Satuan (`string`, e.g., 'kg', 'pcs', required)
  - Total Harga Nota (`decimal`, required)
  - Kategori (`string`, dropdown list, required)
  - Expiry Date (`date`, required)
- UX Optimizations:
  - Kursor must automatically focus (`autofocus`) on the Ingredient Name field upon loading the form.
  - The form is submitted manually by the staff (no AI visual parse).

### FR-3: Stock Management
- Staf can log/update status of stock batches:
  - `used`: Raw material consumed for cooking.
  - `wasted`: Raw material spoiled and thrown away.
  - `critical`: Raw material with remaining shelf life < 2 days.

### FR-4: Monthly Waste Index Ledger & Excel Export (Manager side)
- **Monthly Filter Menu:** The Manager dashboard must feature a monthly selection menu (e.g., using a month input element) allowing the manager to filter analytics and reports by a specific month.
- **Dynamic Analytics Dashboard:**
  - Interactive metrics (Spent Budget, Wasted Budget, and Waste Index Ledger) and comparison charts must adjust dynamically to only display data from the selected month.
  - Calculated **Waste Index (WI)** formula (filtered by selected month):
    $$\text{Waste Index} = \left(\frac{\text{Total Nominal Wasted}}{\text{Total Nominal Spent}}\right) \times 100\%$$
- **Monthly Excel Export:** The export button must download an Excel `.xlsx` file containing stock transaction logs restricted *only* to the selected month, while preserving the exact layout format:
  - Transaction Date, Ingredient Name, Status (Used/Wasted), Quantity, Unit Price, Total Price, and Receipt Image Link/ID.

### FR-5: Smart Procurement Advisor (ML Forecaster)
- Machine Learning system to forecast raw material demand for the next 30 days.
- The forecaster runs in a Python script (Random Forest model) trained on historical usage data.
- The Node.js backend calls this Python service (running as a Vercel Serverless Function) and presents the recommendation to the Manager.

### FR-6: AI Food Rescue Promo Recommender (Gemini API)
- Triggered when stock items are marked as `critical` (expiry date < 2 days).
- Node.js backend calls Google Gemini API with:
  - System prompt designed for business promotion logic.
  - Input payload: critical ingredient details (name, quantity) + list of available restaurant menu items.
- Gemini returns JSON output containing:
  - Suggested menu to discount.
  - Discount percentage (10% - 30%).
  - Strategic reasoning.
- The recommendation is stored as a draft (`promo_drafts`) with status `pending_approval`.
- Managers can review and approve it (updating status to `active` and calculating saved loss).

---

## 4. Non-Functional Requirements
- **Performance:** Chart queries and predictions should resolve within 2.5 seconds.
- **Database Seeding:** A seeding script must generate 15-20 logical historical transactions spanning 2 weeks to 3 months to prevent empty dashboard states during judging.
- **Deployment:** The Node.js API and the Python ML service must be deployed on Vercel.
- **Database:** Must run on TiDB Cloud Serverless (MySQL).

---

## 5. User Stories
- **Manager's Monthly Audit:** As a **Manager**, I want to **select a specific month** on the dashboard so that I can **view the spent budget, wasted budget, and waste index ledger for that month** and **export the corresponding monthly Excel report** to evaluate financial performance and food waste trends.
