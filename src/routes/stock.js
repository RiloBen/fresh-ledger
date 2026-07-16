const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { verifyToken } = require('../middlewares/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Set up destination directory for uploads
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST /api/stock - Upload receipt and log incoming stock (requires auth)
router.post('/', verifyToken, upload.single('receipt'), stockController.createStock);

// GET /api/stock - List active inventory (requires auth)
router.get('/', verifyToken, stockController.listStock);

// PUT /api/stock/:id/status - Update batch status to used/wasted (requires auth)
router.put('/:id/status', verifyToken, stockController.updateStockStatus);

module.exports = router;
