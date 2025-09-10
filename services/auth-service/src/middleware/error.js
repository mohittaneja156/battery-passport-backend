export function notFound (req, res, next) {
  res.status(404).json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } })
}

export function errorHandler (err, req, res, next) {
  const status = err.status || 500
  const code = err.code || 'INTERNAL_ERROR'
  const details = err.details
  res.status(status).json({ success: false, error: { message: err.message || 'Internal Server Error', code, details } })
}
