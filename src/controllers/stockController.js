const db = require('../config/database');
const path = require('path');

// POST /api/stock - Log new incoming stock batch
exports.createStock = async (req, res) => {
  const { ingredient_id, quantity, unit_price, expiry_date } = req.body;
  const file = req.file;

  if (!ingredient_id || !quantity || !unit_price || !expiry_date) {
    return res.status(400).json({ error: 'ingredient_id, quantity, unit_price, and expiry_date are required' });
  }

  try {
    const qty = parseFloat(quantity);
    const price = parseFloat(unit_price);
    const totalPrice = qty * price;
    
    // Save image path if uploaded
    let receiptImagePath = null;
    if (file) {
      // Normalize path for web compatibility
      receiptImagePath = `/public/uploads/${file.filename}`;
    }

    const [result] = await db.query(
      `INSERT INTO stock_batches 
      (ingredient_id, quantity, remaining_quantity, unit_price, total_price, receipt_image_path, status, expiry_date) 
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [parseInt(ingredient_id, 10), qty, qty, price, totalPrice, receiptImagePath, expiry_date]
    );

    res.status(201).json({
      message: 'Stock batch logged successfully',
      data: {
        id: result.insertId,
        ingredient_id,
        quantity: qty,
        unit_price: price,
        total_price: totalPrice,
        receipt_image_path: receiptImagePath,
        expiry_date
      }
    });
  } catch (error) {
    console.error('[StockCtrl] Error creating stock batch:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// GET /api/stock - List all active inventory batches
exports.listStock = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT sb.*, i.name as ingredient_name, i.category, i.unit 
      FROM stock_batches sb
      JOIN ingredients i ON sb.ingredient_id = i.id
      WHERE sb.status = 'active'
      ORDER BY sb.expiry_date ASC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error('[StockCtrl] Error listing stock batches:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// PUT /api/stock/:id/status - Update status of a batch (used / wasted)
exports.updateStockStatus = async (req, res) => {
  const { id } = req.params;
  const { status, quantity_to_deduct } = req.body;

  if (!status || !['active', 'used', 'wasted'].includes(status)) {
    return res.status(400).json({ error: 'Valid status ("active", "used", "wasted") is required' });
  }

  try {
    // Check current stock batch details
    const [batches] = await db.query('SELECT remaining_quantity, quantity FROM stock_batches WHERE id = ?', [parseInt(id, 10)]);
    if (batches.length === 0) {
      return res.status(404).json({ error: 'Stock batch not found' });
    }

    const currentRemaining = parseFloat(batches[0].remaining_quantity);
    let newRemaining = currentRemaining;
    let targetStatus = status;

    if (status === 'used') {
      const deduct = quantity_to_deduct !== undefined ? parseFloat(quantity_to_deduct) : currentRemaining;
      if (isNaN(deduct) || deduct <= 0) {
        return res.status(400).json({ error: 'quantity_to_deduct must be a positive number' });
      }
      newRemaining = currentRemaining - deduct;
      if (newRemaining <= 0) {
        newRemaining = 0.00;
        targetStatus = 'used';
      } else {
        targetStatus = 'active'; // remains active since there's leftover quantity
      }
    } else if (status === 'wasted') {
      newRemaining = 0.00;
      targetStatus = 'wasted';
    } else if (status === 'active') {
      newRemaining = parseFloat(batches[0].quantity);
      targetStatus = 'active';
    }

    await db.query(
      `UPDATE stock_batches 
       SET status = ?, remaining_quantity = ?
       WHERE id = ?`,
      [targetStatus, newRemaining, parseInt(id, 10)]
    );

    res.status(200).json({ 
      message: `Stock batch updated successfully`, 
      status: targetStatus,
      remaining_quantity: newRemaining 
    });
  } catch (error) {
    console.error('[StockCtrl] Error updating stock status:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
