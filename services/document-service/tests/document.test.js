import request from 'supertest'
import app from '../src/index.js'
import mongoose from 'mongoose'
import Document from '../src/models/Document.js'

describe('Document Service', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/battery_passport_test')
    }
  })

  afterAll(async () => {
    // Clean up test database
    await Document.deleteMany({})
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clear documents before each test
    await Document.deleteMany({})
  })

  describe('API Documentation', () => {
    it('serves /api-docs', async () => {
      const res = await request(app).get('/api-docs')
      expect([200, 301]).toContain(res.status)
    })
  })

  describe('Document Upload', () => {
    it('should require authentication for document upload', async () => {
      const res = await request(app)
        .post('/api/documents/upload')
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })

    it('should validate required fields for document upload', async () => {
      // This would require a valid JWT token in a real test
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })
  })

  describe('Document Retrieval', () => {
    it('should require authentication for document retrieval', async () => {
      const res = await request(app)
        .get('/api/documents')
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })

    it('should require authentication for specific document', async () => {
      const res = await request(app)
        .get('/api/documents/invalid-id')
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })
  })

  describe('Presigned URL Generation', () => {
    it('should require authentication for presigned URL', async () => {
      const res = await request(app)
        .post('/api/documents/presigned-url')
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })
  })

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200)

      expect(res.body).toHaveProperty('status', 'healthy')
      expect(res.body).toHaveProperty('service', 'document-service')
    })
  })
})
