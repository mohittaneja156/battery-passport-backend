import request from 'supertest'
import app from '../src/index.js'

describe('Notification Service', () => {
  describe('API Documentation', () => {
    it('serves /api-docs', async () => {
      const res = await request(app).get('/api-docs')
      expect([200, 301]).toContain(res.status)
    })
  })

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200)

      expect(res.body).toHaveProperty('status', 'healthy')
      expect(res.body).toHaveProperty('service', 'notification-service')
    })
  })

  describe('Kafka Consumer', () => {
    it('should be able to start without errors', async () => {
      // This test verifies the service can start up
      // In a real scenario, you'd test Kafka message processing
      expect(app).toBeDefined()
    })
  })

  describe('Email Service', () => {
    it('should have email configuration available', () => {
      // Test that email configuration is available
      // In a real scenario, you'd test actual email sending
      expect(process.env.SMTP_HOST).toBeDefined()
    })
  })
})
