import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET

export function requireAuth (req, res, next) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
    const payload = jwt.verify(token, jwtSecret)
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } })
  }
}

export function requireRole (...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } })
    }
    next()
  }
}
