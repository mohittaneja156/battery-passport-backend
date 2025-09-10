import request from 'supertest'
import app from '../src/index.js'

describe('Auth Service', () => {
  it('should expose /api-docs', async () => {
    const res = await request(app).get('/api-docs')
    expect([200, 301]).toContain(res.status)
  })
})
