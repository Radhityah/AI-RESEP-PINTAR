// ═══════════════════════════════════════════════════════
// Upload foto masakan → MinIO
// ═══════════════════════════════════════════════════════
const express = require('express')
const multer = require('multer')
const { uploadFile } = require('../minio')

const router = express.Router()

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
})

// POST /api/upload-photo — multipart/form-data, field "photo"
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'File foto tidak ditemukan' })
    if (!ALLOWED.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Format file harus JPG, PNG, atau WebP' })
    }

    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase()
    const filename = `masakan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    const url = await uploadFile(file.buffer, filename, file.mimetype)
    res.json({ url })
  } catch (err) {
    console.error('Upload photo error:', err)
    res.status(500).json({ error: 'Gagal mengupload foto ke MinIO' })
  }
})

// error multer (file kebesaran)
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Ukuran file maksimal 5MB' })
  }
  next(err)
})

module.exports = router
