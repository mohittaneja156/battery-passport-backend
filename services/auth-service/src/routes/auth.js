import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const router = express.Router()
const jwtSecret = process.env.JWT_SECRET

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [admin, user] }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role } = req.body
    if (!email || !password) return res.status(400).json({ success: false, error: { message: 'email and password required', code: 'VALIDATION_ERROR' } })
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ success: false, error: { message: 'Email already registered', code: 'CONFLICT' } })
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, passwordHash, role: role === 'admin' ? 'admin' : 'user' })
    return res.status(201).json({ success: true, data: { id: user._id, email: user.email, role: user.role } })
  } catch (err) { next(err) }
})

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ success: false, error: { message: 'Invalid credentials', code: 'UNAUTHORIZED' } })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ success: false, error: { message: 'Invalid credentials', code: 'UNAUTHORIZED' } })
    const token = jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, jwtSecret, { expiresIn: '1h' })
    return res.json({ success: true, data: { token } })
  } catch (err) { next(err) }
})

/**
 * @openapi
 * /api/auth/verify:
 *   get:
 *     summary: Verify token
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/verify', (req, res) => {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
    const payload = jwt.verify(token, jwtSecret)
    return res.json({ success: true, data: { user: payload } })
  } catch (e) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
  }
})

export default router
