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

    // Convert uploaded image to Base64 Data URL and store directly in TiDB.
    // This avoids filesystem writes entirely — works on Vercel and locally.
    let receiptImagePath = null;
    if (file && file.buffer) {
      const base64 = file.buffer.toString('base64');
      receiptImagePath = `data:${file.mimetype};base64,${base64}`;
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
    const [batches] = await db.query(
      'SELECT remaining_quantity, quantity, ingredient_id, unit_price, receipt_image_path, expiry_date, created_at FROM stock_batches WHERE id = ?',
      [parseInt(id, 10)]
    );
    if (batches.length === 0) {
      return res.status(404).json({ error: 'Stock batch not found' });
    }

    const batch = batches[0];
    const currentRemaining = parseFloat(batch.remaining_quantity);
    const originalQty = parseFloat(batch.quantity);
    const unitPrice = parseFloat(batch.unit_price);

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

      // Update original batch
      await db.query(
        `UPDATE stock_batches 
         SET status = ?, remaining_quantity = ?
         WHERE id = ?`,
        [targetStatus, newRemaining, parseInt(id, 10)]
      );
    }
    else if (status === 'wasted') {
      const deduct = quantity_to_deduct !== undefined ? parseFloat(quantity_to_deduct) : currentRemaining;
      if (isNaN(deduct) || deduct <= 0) {
        return res.status(400).json({ error: 'quantity_to_deduct must be a positive number' });
      }

      if (deduct < currentRemaining) {
        newRemaining = currentRemaining - deduct;
        const newOriginalQty = originalQty - deduct;
        const newTotalPrice = newOriginalQty * unitPrice;

        // 1. Update original batch: reduce quantity and remaining
        await db.query(
          `UPDATE stock_batches 
           SET quantity = ?, remaining_quantity = ?, total_price = ?, status = 'active'
           WHERE id = ?`,
          [newOriginalQty, newRemaining, newTotalPrice, parseInt(id, 10)]
        );

        // 2. Insert new wasted batch row representing the wasted portion
        const wastedTotalPrice = deduct * unitPrice;
        await db.query(
          `INSERT INTO stock_batches 
           (ingredient_id, quantity, remaining_quantity, unit_price, total_price, receipt_image_path, status, expiry_date, created_at) 
           VALUES (?, ?, 0.00, ?, ?, ?, 'wasted', ?, ?)`,
          [
            batch.ingredient_id,
            deduct,
            unitPrice,
            wastedTotalPrice,
            batch.receipt_image_path,
            batch.expiry_date,
            batch.created_at
          ]
        );

        targetStatus = 'active'; // Original batch remains active
      } else {
        // Entire batch is wasted
        newRemaining = 0.00;
        targetStatus = 'wasted';

        await db.query(
          `UPDATE stock_batches 
           SET status = ?, remaining_quantity = ?
           WHERE id = ?`,
          [targetStatus, newRemaining, parseInt(id, 10)]
        );
      }
    }
    else if (status === 'active') {
      newRemaining = parseFloat(batch.quantity);
      targetStatus = 'active';

      await db.query(
        `UPDATE stock_batches 
         SET status = ?, remaining_quantity = ?
         WHERE id = ?`,
        [targetStatus, newRemaining, parseInt(id, 10)]
      );
    }

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

// GET /api/stock/expired - List all expired/wasted batches for a specific month
exports.getExpiredStock = async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'month parameter (YYYY-MM) is required' });
  }

  try {
    // Two categories:
    // 1. Wasted batches: filter by created_at (the month the waste action was performed)
    // 2. Active batches that have naturally expired: filter by expiry_date
    const [rows] = await db.query(
      `SELECT sb.*, i.name as ingredient_name, i.category, i.unit 
       FROM stock_batches sb
       JOIN ingredients i ON sb.ingredient_id = i.id
       WHERE (
         (sb.status = 'wasted' AND DATE_FORMAT(sb.created_at, '%Y-%m') = ?)
         OR
         (sb.status = 'active' AND sb.expiry_date < CURRENT_DATE() AND DATE_FORMAT(sb.expiry_date, '%Y-%m') = ?)
       )
       ORDER BY sb.created_at DESC`,
      [month, month]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('[StockCtrl] Error getting expired stock batches:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
