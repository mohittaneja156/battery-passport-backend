import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema({
  fileName: String,
  s3Key: String,
  mimeType: String,
  size: Number,
  uploadedBy: String,
  createdAt: { type: Date, default: Date.now }
})

export const Document = mongoose.model('Document', documentSchema)
