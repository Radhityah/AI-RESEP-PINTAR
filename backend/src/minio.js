// ═══════════════════════════════════════════════════════
// Client MinIO + upload file
// ═══════════════════════════════════════════════════════
const Minio = require('minio')

const BUCKET = process.env.MINIO_BUCKET || 'resep-pintar'

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET)
  if (!exists) {
    await minioClient.makeBucket(BUCKET, 'us-east-1')
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        },
      ],
    })
    await minioClient.setBucketPolicy(BUCKET, policy)
  }
}

async function uploadFile(buffer, filename, contentType) {
  await ensureBucket()
  await minioClient.putObject(BUCKET, filename, buffer, buffer.length, {
    'Content-Type': contentType,
  })
  // URL publik yang bisa diakses browser (bukan hostname internal docker)
  const publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'
  return `${publicUrl}/${BUCKET}/${filename}`
}

module.exports = { uploadFile }
