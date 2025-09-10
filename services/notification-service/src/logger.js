import winston from 'winston'

const serviceName = process.env.SERVICE_NAME || 'notification-service'
const logLevel = process.env.LOG_LEVEL || 'info'
const isDev = process.env.NODE_ENV !== 'production'

// Filter out verbose messages
const filterVerbose = winston.format((info) => {
  const verbosePatterns = [
    /mongoose.*connected/i,
    /listening on/i,
    /server running/i,
    /health check/i,
    /kafka.*connected/i
  ]
  
  if (verbosePatterns.some(pattern => pattern.test(info.message))) {
    return false
  }
  return info
})

const jsonTransport = new winston.transports.Console({
  level: logLevel,
  format: winston.format.combine(
    filterVerbose(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  )
})

const prettyTransport = new winston.transports.Console({
  level: logLevel,
  format: winston.format.combine(
    filterVerbose(),
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
      return `[${timestamp}] ${level} (${serviceName}): ${stack || message}${metaStr}`
    })
  )
})

export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: { service: serviceName },
  transports: [isDev ? prettyTransport : jsonTransport]
})

// Log startup only once
logger.info('🚀 Notification service starting...')
