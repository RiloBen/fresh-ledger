# **📑 PROPOSAL IDE & COMPONENT DESIGN: GARUDA HACKS 7.0**

⚠️ DISCLAIMER PENGEMBANGAN TEKNIS:  
Informasi ini disediakan murni untuk tujuan edukasi umum dan panduan teknis pengembangan perangkat lunak (software engineering). Mengingat batas waktu pengerjaan yang super ketat (30 jam) secara offline di Universitas Multimedia Nusantara (UMN), rancangan ini mengedepankan aspek kepraktisan, minimalisasi risiko crash saat presentasi, dan kekuatan nilai guna bagi UMKM Kuliner di hadapan juri.  
🏆 TEMA: AGRICULTURE & FOOD SYSTEMS  
📌 Konsep Dasar

* Tema: Agriculture & Food Systems  
* Judul: Fresh Ledger: Digitalisasi Inventaris Anti-Fraud & Prediktor Food Waste UMKM   
* Fokus Kompetisi: Efisiensi Rantai Pasok Pangan Mikro, Pengurangan Food Waste UMKM Kuliner, dan Automasi Operasional Dapur Lokal.

❌ Permasalahan (Problem Statement)

* **Rentan Manipulasi Keuangan & Friksi Pencatatan (*High-Friction & Fraud-Prone*)** Proses rekapitulasi nota belanja dari pasar tradisional ke buku besar dapur sering kali memakan waktu lama dan rentan terhadap salah ketik. Tanpa adanya arsip bukti fisik yang terdigitalisasi secara instan, usaha kuliner sangat rawan mengalami manipulasi harga belanja atau kebocoran dana (*fraud*).   
* **Pembelian Berlebih Berbasis Insting (*Instinct-Driven Overstocking*)** Manajer UMKM pangan sering kali melakukan pengadaan bahan baku hanya mengandalkan tebakan insting, bukan data riil. Hal ini menyebabkan terjadinya *overstocking* (penumpukan stok berlebih) yang menguras arus kas usaha secara sia-sia.   
* **Kerugian Finansial Akibat *Food Waste* yang Tidak Terukur (*Unmeasured Waste Impact*)** Pemilik usaha tidak menyadari seberapa besar uang yang "dibuang ke tempat sampah" setiap bulannya. Tidak adanya visualisasi data dan laporan metrik pembuangan membuat kerugian akibat bahan busuk menjadi *blind spot* finansial.   
* **Lambatnya Respons Terhadap Stok Kritis (*Slow Critical-Stock Conversion*)** Ketika ada bahan baku yang masa simpannya hampir habis, staf dapur tidak memiliki kewenangan atau strategi cepat untuk menghabiskannya. Akibatnya, bahan yang sebenarnya masih layak konsumsi tersebut terbuang percuma sebelum sempat diolah menjadi profit. 

Solusi

* **Digitalisasi Nota & Entri Cepat Anti-Kecurangan** Menyediakan formulir *Quick Input* yang diwajibkan untuk diiringi dengan foto nota belanja fisik. Sistem ini memotong waktu entri data dan mengunci foto transaksi sebagai arsip *audit trail* lokal, memastikan validitas finansial 100% aman dari manipulasi.   
* **Rekomendasi Belanja Cerdas (*Data-Driven Procurement*)** Menggantikan insting dengan matematika. Sistem secara otomatis menghitung dan memberikan rekomendasi cerdas pengadaan inventaris berbasis data konsumsi riil dengan Machine Learning untuk membantu Manajer merencanakan belanja bahan makanan bulan berikutnya secara presisi, meminimalisasi risiko *overstocking*.   
* **Transparansi Metrik *Waste Index* & Laporan Instan** Menyajikan dasbor kesehatan finansial yang menghitung persentase kerugian melalui formula *Waste Index*. Sistem ini dilengkapi generator laporan *one-click* yang mengekstrak data mutasi ke dalam format `.xlsx` untuk kemudahan audit manajerial.   
* **Sistem Penyelamat Pangan Berbasis AI (*AI Food Rescue Recommender*)** Mencegah kerugian sesaat sebelum terjadi. Ketika staf menandai bahan pangan dalam kondisi kritis (sisa kelayakan kurang dari 2 hari), Google Gemini API akan bertindak sebagai konsultan bisnis instan. AI akan menganalisis menu yang relevan dan merumuskan draf proposal diskon promosi (10% \- 30%) agar bahan baku tersebut cepat terjual, yang kemudian dikirim ke manajer untuk disetujui. 

🛠️ Fitur Utama & Detail Penjelasan Mekanisme Kerja (MVP)

1. Manual Receipt Archiver & Quick Input (Fitur Wajib/Core Feature)  
   * Deskripsi Singkat: Modul pengarsipan digital bukti nota belanja fisik dikombinasikan dengan formulir entri data stok cepat untuk menjamin 100% validitas finansial usaha dapur.  
   * Mekanisme Kerja Detail:  
     * Staff membuka modul kamera pada aplikasi untuk memfoto bon fisik dari penyuplai pasar. Gambar ini langsung diunggah dan disimpan ke penyimpanan lokal (atau di-*convert* menjadi Base64 string pendek) dengan nama berkas unik berbasis ID transaksi log keuangan.  
     * Sesaat setelah memfoto, layar otomatis menampilkan formulir *quick input* dengan parameter minimalis: Nama Bahan, Total Harga Nota, Jumlah Kuantitas (kg/pcs), dan Dropdown Kategori.  
     * Kursor secara otomatis langsung terfokus (*autofocus*) pada input nama bahan untuk menghemat waktu staff. Data transaksi belanja ini kemudian dikunci ke dalam tabel log stok masuk untuk keperluan verifikasi (*audit trail*) oleh Manajer guna mencegah kecurangan harga belanja (*anti-fraud*).  
2. Smart Moving-Average Procurement Advisor (Fitur Unggul)  
   * Deskripsi Singkat: Sistem rekomendasi pengadaan inventaris cerdas berbasis data konsumsi riil untuk membantu Manajer merencanakan belanja bahan makanan bulan berikutnya.  
   * Mekanisme Kerja Detail:  
     * Di dalam dasbor khusus Manajer/Owner, backend menjalankan prediksi dengan Machine Learning Linear Regression dari data historis penjualan menu selama rentang 1 tahun lalu menggunakannya dengan menghasilkan proyeksi jumlah stok bahan makanan yang harus dibeli bulan depan (30 hari) sehingga tidak ada prediksi pembelian stok bahan makanan yang akan terbuang.  
3. Waste Index Ledger & Auto-Excel Export (Fitur Wajib/Core Feature)  
   * Deskripsi Singkat: Panel visualisasi metrik kesehatan finansial-operasional dapur sekaligus generator laporan instan berformat Excel (.xlsx).  
   * Mekanisme Kerja Detail:  
     * Manajer disuguhkan grafik lingkaran (*Pie Chart*) atau grafik batang (*Bar Chart*) interaktif yang membandingkan persentase total alokasi dana belanja bahan makanan dengan total nominal rupiah yang berstatus terbuang (*wasted*).  
     * Grafik ini ditenagai oleh metrik ilmiah **Waste Index (**WI**)**, di mana sistem membagi total kerugian bahan terbuang dengan total pengeluaran belanja dikali seratus persen.  
     * Di bagian atas grafik, disematkan satu tombol utama: \[ Ekspor Laporan Excel \]. Ketika tombol ini ditekan, frontend memicu pustaka parser lokal untuk mengekstrak data dari database menjadi lembar kerja tabular .xlsx yang memuat baris data tanggal transaksi, nama barang, status barang (Terpakai/Terbuang), serta lampiran penamaan ID foto nota belanja terkait. File Excel langsung terunduh secara instan ke perangkat Manajer.  
4. AI Food Rescue Promo Recommender (Fitur Unggul)   
* Deskripsi Singkat:  
  Modul rekomendasi promosi berbasis kecerdasan buatan (AI) yang mendeteksi stok bahan baku kritis hampir kedaluwarsa, lalu menyusun rekomendasi menu makanan untuk didiskon guna mempercepat konversi stok dan mencegah kerugian finansial akibat food waste.

* ### Mekanisme Kerja Detail:

1. **Pemicuan Sinyal Kritis:** Ketika sistem membaca input dari Staff/Admin baha ada stok bahan makanan yang akan kedaluwarsa.  
2. **Agregasi Data Lokal:** Backend secara otomatis melakukan *query* ke tabel STOCK\_BATCHES dan INGREDIENTS untuk menarik data: nama bahan yang kritis, sisa volume kuantitas riil, serta daftar menu restoran terkait yang menggunakan bahan tersebut.  
3. **Pemrosesan AI Multimodal:** Data tersebut dikirim oleh API Backend menuju AI Engine yang ditenagai Google Gemini API. *System prompt* menginstruksikan AI untuk menganalisis menu mana yang paling cepat menghabiskan volume bahan baku tersebut secara logis dan menyarankan persentase diskon yang rasional (misal: 10%–30%).  
4. **Penyimpanan Draf (Manager Approval):** Respons JSON dari Gemini API (menu\_rekomendasi, persentase\_diskon, alasan\_strategis) dikunci oleh Backend ke dalam tabel log baru PROMO\_DRAFTS dengan status status 'pending\_approval'.  
5. **Notifikasi & Aktivasi:** Frontend merender kartu draf promo tersebut di Dashboard khusus Manajer. Begitu Manajer menekan tombol **\[ Setujui Promo \]**, status berubah menjadi 'active' dan sistem mencatat estimasi nilai kerugian yang berhasil ditekan untuk dimasukkan ke kalkulasi grafik *Waste Index Ledger*.  
* Pesan Penting dari Mentor:   
  * Ketika jelasin fitur ini, jangan jelasin terlalu jujur kalau AI yang dipakai adalah Gemini dengan hanya memanggil API nya. Jelaskan bahwa fitur ini menggunakan sistem AI/ML.  
  * Dikasih pilihan (pertanyaan untuk kita): untuk sekadar MVP jadi, buat dengan hanya memanggil API Gemini. Untuk yang lebih diterima juri, buat sistem RAG dengan Langchain

⚠️ Keterbatasan dan Solusi untuk MVP (Hackathon Hacks)

* Masalah Data Kosong saat Demo Juri: Grafik laporan keuangan dan indeks makanan terbuang (Waste Index) akan terlihat kosong dan tidak menarik saat di demokan pertama kali oleh juri.  
  * Solusi: Lakukan database seeding (penyuntikan 15-20 data transaksi fiktif dari 2 minggu ke belakang sebelum kompetisi dimulai), sehingga saat demo pemindaian kesegaran bahan selesai diuji, grafik laporan mingguan/bulanan langsung memperbarui datanya secara real-time dengan tampilan visual yang sangat matang dan mengesankan juri.  
* Masalah Penyalahgunaan Hak Akses (Privilege Escalation): Staff dapur yang sedang panik di tengah operasional padat bisa langsung mengaktifkan diskon harga menu tanpa persetujuan finansial pemilik, memicu kerugian margin keuntungan akibat *human error*.   
  * Solusi: Terapkan pemisahan peran (*role-based separation*) pada *state* aplikasi. Tombol aksi di sisi staff dapur hanya berfungsi sebagai generator usulan (*Submit Proposal to AI*), sedangkan hak eksekusi akhir untuk memotong harga menu di database mutlak dikunci di balik akun dengan `role: 'manager'` atau `'admin'`. 

👥 Rekomendasi Tech Stack & Pembagian Kerja (3 Orang)

1. Frontend & UI Engineer (Bang Michael):  
   * Teknologi: React / Tailwind CSS (untuk Web)  
   * Fokus: Membangun modul input stok cepat, integrasi kamera untuk foto nota dan foto bahan, halaman dashboard interaktif untuk FEFO tracker, visualisasi grafik keuangan menggunakan Chart.js/FlowChart, dan penanganan ekspor data ke format .xlsx.  
2. AI/ML Engineer (Ruben):  
   * Teknologi: Python, Google Gemini API (`gemini-2.5-flash-preview-09-2025`), Machine Learning (Scikit-Learn/Random Forest).   
   * Fokus:   
     * **Perancangan Prompt & RAG (AI Food Rescue Promo):** Merancang *system prompt*, struktur data, dan *prompt engineering* untuk dikombinasikan dengan menu lokal restoran. Desain ini akan digunakan oleh Backend Node.js untuk memanggil Gemini API guna mendapatkan rekomendasi diskon promo yang rasional.  
     * **Sintesis Data & Prediksi Cerdas (Procurement Forecaster):** Menggunakan Python untuk membuat skrip *dummy data generator* (riwayat pemakaian bahan baku UMKM 3 bulan terakhir). Melatih model Machine Learning *Random Forest* skala kecil dan mendeploynya sebagai **Vercel Serverless Function** berbasis Python yang dipanggil oleh backend Node.js.

3. Backend & DB Engineer (Rilo):  
   * Teknologi: Node.js (Express), MySQL (TiDB Cloud Serverless).  
   * Fokus:   
     * **Integrasi Database & Serverless:** Mengamankan skema tabel data mutasi barang (stok masuk, keluar, terbuang) di TiDB Cloud, menyiapkan skrip database seeding data historis, serta menangani penyimpanan arsip gambar nota belanja.  
     * **Integrasi AI & Deployment:** Mendeploy backend ke Vercel. Backend Node.js langsung memanggil Gemini API (menggunakan SDK resmi `@google/genai` atau `@google/generative-ai`) dengan prompt yang dirancang Ruben, serta mengintegrasikan pemanggilan API ke *Vercel Serverless Function* berbasis Python milik Ruben untuk peramalan belanja.

