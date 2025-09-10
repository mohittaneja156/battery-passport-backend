import express from 'express'
import multer from 'multer'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import axios from 'axios'
import { Document } from '../models/Document.js'

const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } })
const router = express.Router()

const s3 = new S3Client({ region: process.env.AWS_REGION })
const bucket = process.env.S3_BUCKET
const authServiceUrl = process.env.AUTH_SERVICE_URL
const urlExpire = Number(process.env.PRESIGNED_URL_EXPIRE || 3600)

async function verifyJwt (req) {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const { data } = await axios.get(`${authServiceUrl}/api/auth/verify`, { headers: { Authorization: auth } })
    return data.data.user
  } catch { return null }
}

router.post('/upload', upload.single('file'), async (req, res) => {
  const user = await verifyJwt(req)
  if (!user) return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
  if (!req.file) return res.status(400).json({ success: false, error: { message: 'file required', code: 'VALIDATION_ERROR' } })
  const key = `uploads/${Date.now()}_${req.file.originalname}`
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype }))
  const meta = await Document.create({ fileName: req.file.originalname, s3Key: key, mimeType: req.file.mimetype, size: req.file.size, uploadedBy: user.sub })
  return res.status(201).json({ success: true, data: { docId: String(meta._id) } })
})

router.put('/:docId', async (req, res) => {
  const user = await verifyJwt(req)
  if (!user) return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
  const updated = await Document.findByIdAndUpdate(req.params.docId, req.body, { new: true })
  if (!updated) return res.status(404).json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } })
  return res.json({ success: true, data: updated })
})

router.delete('/:docId', async (req, res) => {
  const user = await verifyJwt(req)
  if (!user) return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
  const doc = await Document.findById(req.params.docId)
  if (!doc) return res.status(404).json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } })
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: doc.s3Key }))
  await Document.findByIdAndDelete(req.params.docId)
  return res.json({ success: true, data: { deleted: true } })
})

router.get('/:docId', async (req, res) => {
  const user = await verifyJwt(req)
  if (!user) return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
  const doc = await Document.findById(req.params.docId)
  if (!doc) return res.status(404).json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } })
  const command = new GetObjectCommand({ Bucket: bucket, Key: doc.s3Key })
  const url = await getSignedUrl(s3, command, { expiresIn: urlExpire })
  return res.json({ success: true, data: { url } })
})

export default router
