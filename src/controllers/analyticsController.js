const db = require('../config/database');
const ExcelJS = require('exceljs');

// GET /api/analytics/waste-index - Calculate Waste Index metric
exports.getWasteIndex = async (req, res) => {
  try {
    const [spentRow] = await db.query('SELECT SUM(total_price) as spent FROM stock_batches');
    const [wastedRow] = await db.query("SELECT SUM(total_price) as wasted FROM stock_batches WHERE status = 'wasted'");

    const totalSpent = parseFloat(spentRow[0].spent || 0);
    const totalWasted = parseFloat(wastedRow[0].wasted || 0);
    
    // Compute Waste Index
    const wasteIndex = totalSpent > 0 ? ((totalWasted / totalSpent) * 100).toFixed(2) : '0.00';

    res.status(200).json({
      waste_index: parseFloat(wasteIndex),
      total_spent: totalSpent,
      total_wasted: totalWasted
    });
  } catch (error) {
    console.error('[AnalyticsCtrl] Error getting waste index:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// GET /api/analytics/procurement-forecast/:ingredient_id - Get monthly forecast demand
exports.getProcurementForecast = async (req, res) => {
  const { ingredient_id } = req.params;

  try {
    // 1. Fetch sales usage history for the last 90 days
    const [rows] = await db.query(
      `SELECT quantity_used, sale_date 
       FROM sales_history 
       WHERE ingredient_id = ? 
       ORDER BY sale_date ASC`,
      [parseInt(ingredient_id, 10)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No historical sales data found for this ingredient' });
    }

    // 2. Aggregate daily logs into weekly usage data points
    const weeklyHistory = [];
    let currentWeekSum = 0;
    
    rows.forEach((row, index) => {
      currentWeekSum += parseFloat(row.quantity_used);
      if ((index + 1) % 7 === 0) {
        weeklyHistory.push(parseFloat(currentWeekSum.toFixed(2)));
        currentWeekSum = 0;
      }
    });

    // 3. Make request to Python Vercel Serverless Function
    let predictedDemand = 0;
    let methodUsed = 'moving_average_fallback';
    let pythonResponseError = null;

    try {
      const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:5001`;
      
      const response = await fetch(`${host}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: weeklyHistory })
      });

      if (response.ok) {
        const result = await response.json();
        predictedDemand = result.predicted_demand;
        methodUsed = result.method;
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed python serverless call');
      }
    } catch (err) {
      pythonResponseError = err.message;
      console.warn('[AnalyticsCtrl] Python ML service unavailable. Falling back to moving average:', err.message);
      
      // Fallback: Simple Moving Average (SMA) of the last 3 weeks multiplied by 4 (to project monthly demand)
      if (weeklyHistory.length > 0) {
        const recentWeeks = weeklyHistory.slice(-3);
        const avgWeekly = recentWeeks.reduce((sum, val) => sum + val, 0) / recentWeeks.length;
        predictedDemand = parseFloat((avgWeekly * 4).toFixed(2));
      }
    }

    res.status(200).json({
      ingredient_id: parseInt(ingredient_id, 10),
      weekly_history: weeklyHistory,
      predicted_monthly_demand: predictedDemand,
      method: methodUsed,
      python_error: pythonResponseError
    });

  } catch (error) {
    console.error('[AnalyticsCtrl] Error calculating procurement forecast:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// GET /api/analytics/export-excel - Generate Excel report sheet
exports.exportExcel = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT sb.id, i.name as ingredient_name, i.category, sb.quantity, sb.unit_price, sb.total_price, sb.status, sb.expiry_date, sb.created_at
       FROM stock_batches sb
       JOIN ingredients i ON sb.ingredient_id = i.id
       ORDER BY sb.created_at DESC`
    );

    const formattedData = rows.map(r => ({
      'ID Transaksi': r.id,
      'Nama Bahan': r.ingredient_name,
      'Kategori': r.category,
      'Kuantitas': parseFloat(r.quantity),
      'Harga Satuan (Rp)': parseFloat(r.unit_price),
      'Total Pengeluaran (Rp)': parseFloat(r.total_price),
      'Status': r.status,
      'Tanggal Kedaluwarsa': r.expiry_date.toISOString().split('T')[0],
      'Tanggal Ditambahkan': r.created_at.toISOString().split('T')[0]
    }));

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Mutasi Inventaris');

    // Define columns
    worksheet.columns = [
      { header: 'ID Transaksi', key: 'id', width: 15 },
      { header: 'Nama Bahan', key: 'ingredient_name', width: 20 },
      { header: 'Kategori', key: 'category', width: 15 },
      { header: 'Kuantitas', key: 'quantity', width: 12 },
      { header: 'Harga Satuan (Rp)', key: 'unit_price', width: 18 },
      { header: 'Total Pengeluaran (Rp)', key: 'total_price', width: 22 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Kedaluwarsa', key: 'expiry_date', width: 20 },
      { header: 'Tanggal Ditambahkan', key: 'created_at', width: 20 }
    ];

    // Add rows
    rows.forEach(r => {
      worksheet.addRow({
        id: r.id,
        ingredient_name: r.ingredient_name,
        category: r.category,
        quantity: parseFloat(r.quantity),
        unit_price: parseFloat(r.unit_price),
        total_price: parseFloat(r.total_price),
        status: r.status,
        expiry_date: r.expiry_date.toISOString().split('T')[0],
        created_at: r.created_at.toISOString().split('T')[0]
      });
    });

    // Generate buffer asynchronously
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Mutasi_Pangan_FreshLedger.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('[AnalyticsCtrl] Error exporting excel:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
