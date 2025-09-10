import express from 'express'
import axios from 'axios'
import { Kafka } from 'kafkajs'
import { Passport } from '../models/Passport.js'

const router = express.Router()
const authServiceUrl = process.env.AUTH_SERVICE_URL
const kafkaBrokers = (process.env.KAFKA_BROKERS || '').split(',')

const kafka = new Kafka({ brokers: kafkaBrokers })
const producer = kafka.producer()
async function ensureProducer () { await producer.connect() }
ensureProducer().catch(() => {})

async function verifyJwt (req, res) {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const { data } = await axios.get(`${authServiceUrl}/api/auth/verify`, { headers: { Authorization: auth } })
    return data.data.user
  } catch (e) { return null }
}

async function emitEvent (event, payload) {
  await producer.send({
    topic: 'passport.events',
    messages: [{ key: payload.passportId, value: JSON.stringify({ event, payload, meta: { service: 'passport-service', version: '1.0.0' } }) }]
  })
}

router.post('/', async (req, res) => {
  const user = await verifyJwt(req, res)
  if (!user || user.role !== 'admin') return res.status(403).json({ success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } })
  const doc = await Passport.create(req.body)
  const payload = { passportId: String(doc._id), data: req.body, userId: user.sub, timestamp: new Date().toISOString() }
  await emitEvent('passport.created', payload)
  return res.status(201).json({ success: true, data: doc })
})

router.get('/:id', async (req, res) => {
  const user = await verifyJwt(req, res)
  if (!user) return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
  const doc = await Passport.findById(req.params.id)
  if (!doc) return res.status(404).json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } })
  return res.json({ success: true, data: doc })
})

router.put('/:id', async (req, res) => {
  const user = await verifyJwt(req, res)
  if (!user || user.role !== 'admin') return res.status(403).json({ success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } })
  const doc = await Passport.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!doc) return res.status(404).json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } })
  const payload = { passportId: String(doc._id), data: req.body, userId: user.sub, timestamp: new Date().toISOString() }
  await emitEvent('passport.updated', payload)
  return res.json({ success: true, data: doc })
})

router.delete('/:id', async (req, res) => {
  const user = await verifyJwt(req, res)
  if (!user || user.role !== 'admin') return res.status(403).json({ success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } })
  const doc = await Passport.findByIdAndDelete(req.params.id)
  if (!doc) return res.status(404).json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } })
  const payload = { passportId: String(doc._id), data: null, userId: user.sub, timestamp: new Date().toISOString() }
  await emitEvent('passport.deleted', payload)
  return res.json({ success: true, data: { deleted: true } })
})

export default router
