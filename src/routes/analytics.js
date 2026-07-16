const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, isManager } = require('../middlewares/authMiddleware');

// GET /api/analytics/waste-index - Fetch financial and waste percentages (Manager only)
router.get('/waste-index', verifyToken, isManager, analyticsController.getWasteIndex);

// GET /api/analytics/procurement-forecast/:ingredient_id - Run demand forecast (Manager only)
router.get('/procurement-forecast/:ingredient_id', verifyToken, isManager, analyticsController.getProcurementForecast);

// GET /api/analytics/export-excel - Download mutasi logs Excel sheet (Manager only)
router.get('/export-excel', verifyToken, isManager, analyticsController.exportExcel);

module.exports = router;
