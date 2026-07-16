const db = require('../config/database');
const geminiService = require('../services/geminiService');

// POST /api/promo/rescue - Generate a promo proposal for critical stock
exports.createPromoProposal = async (req, res) => {
  const { stock_batch_id } = req.body;

  if (!stock_batch_id) {
    return res.status(400).json({ error: 'stock_batch_id is required' });
  }

  try {
    // 1. Fetch critical stock batch details
    const [batches] = await db.query(
      `SELECT sb.*, i.name as ingredient_name 
       FROM stock_batches sb
       JOIN ingredients i ON sb.ingredient_id = i.id
       WHERE sb.id = ?`,
      [stock_batch_id]
    );

    if (batches.length === 0) {
      return res.status(404).json({ error: 'Stock batch not found' });
    }

    const batch = batches[0];

    // 2. Fetch all menus using this ingredient
    const [menus] = await db.query(
      `SELECT mi.* 
       FROM menu_items mi
       JOIN menu_ingredients ming ON mi.id = ming.menu_item_id
       WHERE ming.ingredient_id = ?`,
      [batch.ingredient_id]
    );

    if (menus.length === 0) {
      return res.status(400).json({ error: 'No menu items configured that use this ingredient' });
    }

    // 3. Call Gemini to recommend a menu item & discount
    const recommendation = await geminiService.getPromoRecommendation(
      batch.ingredient_name,
      batch.remaining_quantity,
      menus
    );

    // 4. Save proposal as a draft
    const [result] = await db.query(
      `INSERT INTO promo_drafts (menu_item_id, discount_percentage, reason, status) 
       VALUES (?, ?, ?, 'pending_approval')`,
      [recommendation.menu_item_id, recommendation.discount_percentage, recommendation.reason]
    );

    res.status(201).json({
      message: 'Promotion proposal draft generated successfully',
      draft: {
        id: result.insertId,
        menu_item_id: recommendation.menu_item_id,
        discount_percentage: recommendation.discount_percentage,
        reason: recommendation.reason,
        status: 'pending_approval'
      }
    });
  } catch (error) {
    console.error('[PromoCtrl] Error creating promo proposal:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// GET /api/promo/drafts - List all proposals pending manager approval
exports.listPendingPromos = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pd.*, mi.name as menu_name, mi.price as normal_price 
       FROM promo_drafts pd
       JOIN menu_items mi ON pd.menu_item_id = mi.id
       WHERE pd.status = 'pending_approval'
       ORDER BY pd.created_at DESC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('[PromoCtrl] Error listing pending promos:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// PUT /api/promo/drafts/:id/approve - Manager approves and activates a promotion
exports.approvePromo = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || status !== 'active') {
    return res.status(400).json({ error: 'Status must be set to "active" to approve the draft' });
  }

  try {
    const [result] = await db.query(
      `UPDATE promo_drafts SET status = ? WHERE id = ?`,
      [status, parseInt(id, 10)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Promotion draft not found' });
    }

    res.status(200).json({ message: 'Promotion draft approved and activated successfully' });
  } catch (error) {
    console.error('[PromoCtrl] Error approving promo:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
