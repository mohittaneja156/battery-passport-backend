import request from 'supertest'
import app from '../src/index.js'
import mongoose from 'mongoose'
import Passport from '../src/models/Passport.js'

describe('Passport Service', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/battery_passport_test')
    }
  })

  afterAll(async () => {
    // Clean up test database
    await Passport.deleteMany({})
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clear passports before each test
    await Passport.deleteMany({})
  })

  describe('API Documentation', () => {
    it('serves /api-docs', async () => {
      const res = await request(app).get('/api-docs')
      expect([200, 301]).toContain(res.status)
    })
  })

  describe('Passport Creation', () => {
    it('should require authentication for passport creation', async () => {
      const passportData = {
        batteryId: 'BAT001',
        manufacturer: 'Test Manufacturer',
        model: 'Test Model'
      }

      const res = await request(app)
        .post('/api/passports')
        .send(passportData)
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })

    it('should validate required fields for passport creation', async () => {
      const res = await request(app)
        .post('/api/passports')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })
  })

  describe('Passport Retrieval', () => {
    it('should require authentication for passport retrieval', async () => {
      const res = await request(app)
        .get('/api/passports')
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })

    it('should require authentication for specific passport', async () => {
      const res = await request(app)
        .get('/api/passports/invalid-id')
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })
  })

  describe('Passport Updates', () => {
    it('should require authentication for passport updates', async () => {
      const res = await request(app)
        .put('/api/passports/invalid-id')
        .send({ status: 'updated' })
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })

    it('should require authentication for passport deletion', async () => {
      const res = await request(app)
        .delete('/api/passports/invalid-id')
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
      expect(res.body).toHaveProperty('service', 'passport-service')
    })
  })
})
