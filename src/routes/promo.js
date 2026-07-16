const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { verifyToken, isManager } = require('../middlewares/authMiddleware');

// POST /api/promo/rescue - Generate promo proposal based on critical ingredient stock
router.post('/rescue', verifyToken, promoController.createPromoProposal);

// GET /api/promo/drafts - Fetch all pending proposals (Requires manager role)
router.get('/drafts', verifyToken, isManager, promoController.listPendingPromos);

// PUT /api/promo/drafts/:id/approve - Approve a draft to make it active (Requires manager role)
router.put('/drafts/:id/approve', verifyToken, isManager, promoController.approvePromo);

module.exports = router;
