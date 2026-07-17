# 📑 Fresh Ledger (Backend & ML)

**Fresh Ledger** adalah sistem manajemen inventaris digital anti-kecurangan (*anti-fraud*) dan prediktor *food waste* berbasis AI yang dirancang khusus untuk membantu dapur UMKM kuliner menekan kerugian finansial akibat bahan baku busuk serta mencegah manipulasi pengadaan barang. Proyek ini dikembangkan untuk kompetisi **Garuda Hacks 7.0**.

---

## 🛠️ Tech Stack & Arsitektur
- **Backend Utama:** Node.js (Express)
- **Database:** MySQL (Hosted on TiDB Cloud Serverless)
- **Machine Learning (Predictor):** Python (Flask + Scikit-Learn / Random Forest Regressor)
- **AI Engine:** Google Gemini API (`gemini-2.5-flash`)
- **Deployment Platform:** Vercel (Multi-runtime Serverless Functions)

---

## 📂 Struktur Direktori Utama
```text
fresh-ledger/
├── api/
│   ├── index.js             # Entry point Express API (Node.js)
│   └── predict.py           # Endpoint Machine Learning (Python Flask)
├── src/
│   ├── config/
│   │   └── database.js      # Koneksi pool MySQL (TiDB Cloud SSL)
│   ├── controllers/         # Logika bisnis (Auth, Stok, Promo AI, Analytics)
│   ├── middlewares/         # JWT Verification & Role-based Access Control
│   ├── routes/              # Routing endpoint API
│   ├── services/
│   │   ├── geminiService.js # Integrasi Google Gemini API
│   │   └── seedService.js   # Script migrasi DB & seeding data otomatis
├── public/uploads/          # Folder lokal penyimpanan berkas nota belanja
├── vercel.json              # Konfigurasi deployment & routing Vercel
├── package.json             # Dependensi Node.js
└── requirements.txt         # Dependensi Python
```

---

## 🚀 Panduan Instalasi & Pengoperasian Lokal

### 1. Klon Repositori & Pasang Dependensi Node.js
Jalankan perintah berikut di direktori proyek:
```bash
npm install
```

### 2. Konfigurasi Environment Variables (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan lengkapi nilai-nilai berikut:
- **`PORT`**: Port local server (misal: `5005`).
- **Kredensial Database**: Isi dengan detail dari TiDB Cloud Anda.
- **`GEMINI_API_KEY`**: Masukkan API Key dari Google Gemini (jika kosong, sistem akan beralih ke *mock data* secara otomatis).

### 🔑 Langkah Mengaktifkan Fitur AI (Google Gemini API)
Untuk menggunakan kecerdasan buatan dalam merumuskan diskon penyelamatan bahan baku (*Food Rescue Promo*), lakukan langkah berikut:
1. **Dapatkan API Key:** Kunjungi [Google AI Studio](https://aistudio.google.com/) dan buat API Key baru secara gratis.
2. **Konfigurasi `.env`:** Rekatkan API Key Anda ke variabel `GEMINI_API_KEY` di file `.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
3. **Pengoperasian:** Saat berada di Dashboard Staf Dapur, klik tombol **AI Rescue** pada bahan baku dengan waktu kedaluwarsa `< 2 hari`. Sistem akan memanggil model `gemini-2.5-flash` menggunakan library `@google/genai` resmi untuk menghasilkan draf diskon secara cerdas beserta analisis rasionalnya, yang kemudian dapat disetujui oleh Manager.


### 3. Migrasi & Seeding Database (TiDB Cloud)
Untuk membuat struktur tabel dan mengisi data transaksi fiktif 3 bulan terakhir (sangat penting untuk keindahan visual grafik juri dan melatih model ML):
```bash
npm run seed
```

### 4. Menjalankan Server Backend Node.js
Jalankan server dalam mode development (menggunakan nodemon):
```bash
npm run dev
```
Uji apakah backend aktif dengan membuka `http://localhost:5005/api/health` di browser Anda.

### 5. Menjalankan Server ML Python (Lokal)
Jika Ruben ingin menjalankan modul peramalan belanja secara lokal:
1. Buat dan aktifkan virtual environment:
   ```bash
   python -m venv venv
   # Di Windows CMD/PowerShell:
   .\venv\Scripts\activate
   ```
2. Pasang dependensi:
   ```bash
   pip install -r requirements.txt
   ```
3. Jalankan Flask:
   ```bash
   python api/predict.py
   ```
   *Server ML akan berjalan di port `5001`.*

---

## 🔑 Akun Demo Default (Login Credentials)

Setelah menjalankan `npm run seed`, Anda dapat melakukan login menggunakan akun demo berikut:

*   **Akun Manager / Owner:**
    *   **Username:** `manager`
    *   **Password:** `manager123`

*   **Akun Kitchen Staff:**
    *   **Username:** `staff`
    *   **Password:** `staff123`

---

## ☁️ Deployment ke Vercel

Proyek ini telah dikonfigurasi menggunakan `vercel.json` agar dapat langsung dideploy ke **Vercel** sebagai Serverless Functions (mendukung Node.js dan Python secara bersamaan).

Langkah-langkah deploy:
1. Instal Vercel CLI (jika belum): `npm install -g vercel`
2. Jalankan perintah:
   ```bash
   vercel
   ```
3. Masukkan konfigurasi `.env` Anda ke dalam Vercel Dashboard bagian *Environment Variables*.
