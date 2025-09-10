import winston from 'winston'

const logLevel = process.env.LOG_LEVEL || 'info'
const serviceName = process.env.SERVICE_NAME || 'passport-service'

export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: { service: serviceName },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
})
