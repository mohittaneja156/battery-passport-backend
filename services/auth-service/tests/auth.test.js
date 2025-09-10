import request from 'supertest'
import app from '../src/index.js'
import mongoose from 'mongoose'
import User from '../src/models/User.js'

describe('Auth Service', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/battery_passport_test')
    }
  })

  afterAll(async () => {
    // Clean up test database
    await User.deleteMany({})
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({})
  })

  describe('API Documentation', () => {
    it('should expose /api-docs', async () => {
      const res = await request(app).get('/api-docs')
      expect([200, 301]).toContain(res.status)
    })
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(res.body).toHaveProperty('message')
      expect(res.body).toHaveProperty('user')
      expect(res.body.user.email).toBe(userData.email)
      expect(res.body.user).not.toHaveProperty('password')
    })

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)

      // Try to create user with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(res.body).toHaveProperty('error')
    })

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400)

      expect(res.body).toHaveProperty('error')
    })
  })

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }
      await request(app)
        .post('/api/auth/register')
        .send(userData)
    })

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(res.body).toHaveProperty('token')
      expect(res.body).toHaveProperty('user')
      expect(res.body.user.email).toBe(loginData.email)
    })

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(res.body).toHaveProperty('error')
    })

    it('should not login with non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
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
      expect(res.body).toHaveProperty('service', 'auth-service')
    })
  })
})
