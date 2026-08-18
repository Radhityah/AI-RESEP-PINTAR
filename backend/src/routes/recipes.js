// ═══════════════════════════════════════════════════════
// CRUD Resep — MongoDB
// ═══════════════════════════════════════════════════════
const express = require('express')
const { ObjectId } = require('mongodb')
const { getDb } = require('../db')

const router = express.Router()

// GET /api/recipes — list semua resep (terbaru dulu)
router.get('/', async (_req, res) => {
  try {
    const db = await getDb()
    const recipes = await db
      .collection('recipes')
      .find({})
      .sort({ created_at: -1 })
      .limit(50)
      .toArray()
    res.json({ recipes })
  } catch (err) {
    console.error('Get recipes error:', err)
    res.status(500).json({ error: 'Gagal mengambil data resep' })
  }
})

// POST /api/recipes — simpan resep baru
router.post('/', async (req, res) => {
  try {
    const { recipe, bahan_input, foto_url } = req.body
    if (!recipe || !bahan_input) {
      return res.status(400).json({ error: 'Data recipe tidak lengkap' })
    }
    const db = await getDb()
    const result = await db.collection('recipes').insertOne({
      ...recipe,
      bahan_input,
      foto_url: foto_url || null,
      created_at: new Date(),
    })
    res.json({ success: true, id: result.insertedId.toString() })
  } catch (err) {
    console.error('Save recipe error:', err)
    res.status(500).json({ error: 'Gagal menyimpan resep ke MongoDB' })
  }
})

// GET /api/recipes/:id — detail satu resep
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb()
    const recipe = await db.collection('recipes').findOne({ _id: new ObjectId(req.params.id) })
    if (!recipe) return res.status(404).json({ error: 'Resep tidak ditemukan' })
    res.json({ recipe })
  } catch {
    res.status(500).json({ error: 'Gagal mengambil resep' })
  }
})

// DELETE /api/recipes/:id — hapus resep
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb()
    await db.collection('recipes').deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Gagal menghapus resep' })
  }
})

module.exports = router
