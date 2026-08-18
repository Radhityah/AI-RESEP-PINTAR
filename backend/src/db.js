// ═══════════════════════════════════════════════════════
// Koneksi MongoDB (singleton)
// ═══════════════════════════════════════════════════════
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resep-pintar'

let client = null
let db = null

async function getDb() {
  if (db) return db
  client = new MongoClient(MONGODB_URI)
  await client.connect()
  db = client.db()
  console.log(`[MongoDB] Terhubung ke ${MONGODB_URI}`)
  return db
}

module.exports = { getDb }
