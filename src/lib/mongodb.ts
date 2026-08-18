import { MongoClient, Db } from 'mongodb'

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

// Cache untuk production (module-level, di-reset saat restart)
let _clientPromise: Promise<MongoClient> | null = null

// Lazy: koneksi hanya dibuat saat getDb() pertama kali dipanggil,
// bukan saat module di-import — mencegah crash saat Docker build
// karena MONGODB_URI belum tersedia di build time.
function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not set')

  if (process.env.NODE_ENV === 'development') {
    // Di development, pakai global agar hot-reload tidak membuat koneksi baru
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect()
    }
    return global._mongoClientPromise
  }

  // Di production, cache di module level
  if (!_clientPromise) {
    _clientPromise = new MongoClient(uri).connect()
  }
  return _clientPromise
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise()
  return client.db('resep-pintar')
}
