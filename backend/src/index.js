// ═══════════════════════════════════════════════════════════════
// ResepPintar RESTful API — Express JS + Swagger
//   Dokumentasi : http://localhost:4000/docs
//   Spec JSON   : http://localhost:4000/docs.json
// ═══════════════════════════════════════════════════════════════
const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')

const swaggerSpec = require('./swagger')
const recipesRouter = require('./routes/recipes')
const aiRouter = require('./routes/ai')
const uploadRouter = require('./routes/upload')
const { getDb } = require('./db')
const { BASES } = require('./ollama')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '2mb' }))

/* ── Swagger UI ── */
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ResepPintar API Docs',
}))
app.get('/docs.json', (_req, res) => res.json(swaggerSpec))

/* ── Health check ── */
app.get('/api/health', async (_req, res) => {
  let mongodb = 'disconnected'
  try {
    const db = await getDb()
    await db.command({ ping: 1 })
    mongodb = 'connected'
  } catch { /* biarkan disconnected */ }
  res.json({ status: 'ok', mongodb, ollama: BASES.join(' → ') })
})

/* ── Routes ── */
app.use('/api/recipes', recipesRouter)
app.use('/api/upload-photo', uploadRouter)
app.use('/api', aiRouter) // /api/generate-recipe, /api/suggest-dishes, /api/clarify-dish, /api/chat

/* ── Root redirect ke docs ── */
app.get('/', (_req, res) => res.redirect('/docs'))

app.listen(PORT, () => {
  console.log(`\n🍳 ResepPintar API berjalan di http://localhost:${PORT}`)
  console.log(`📖 Swagger docs        : http://localhost:${PORT}/docs`)
  console.log(`🤖 Ollama server chain : ${BASES.join(' → ')}\n`)
})
