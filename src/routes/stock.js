const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { verifyToken } = require('../middlewares/authMiddleware');
const multer = require('multer');

// Use memoryStorage so the file is kept as a Buffer in memory.
// This works both locally and on Vercel (no filesystem writes needed).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan'), false);
    }
  }
});

// POST /api/stock - Upload receipt and log incoming stock (requires auth)
router.post('/', verifyToken, upload.single('receipt'), stockController.createStock);

// GET /api/stock - List active inventory (requires auth)
router.get('/', verifyToken, stockController.listStock);

// GET /api/stock/expired - List expired inventory (requires auth)
router.get('/expired', verifyToken, stockController.getExpiredStock);

// PUT /api/stock/:id/status - Update batch status to used/wasted (requires auth)
router.put('/:id/status', verifyToken, stockController.updateStockStatus);

module.exports = router;
