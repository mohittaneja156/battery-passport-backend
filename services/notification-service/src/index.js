import express from 'express'
import dotenv from 'dotenv'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import { Kafka } from 'kafkajs'
import nodemailer from 'nodemailer'
import { logger } from './logger.js'

dotenv.config()

const app = express()
app.use(helmet())

const port = process.env.PORT || 4004
const brokers = (process.env.KAFKA_BROKERS || '').split(',')
const passportBaseUrl = process.env.PASSPORT_BASE_URL || 'http://passport-service:4002'

const swaggerSpec = swaggerJSDoc({ definition: { openapi: '3.0.0', info: { title: 'Notification Service', version: '1.0.0' } }, apis: [] })
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const kafka = new Kafka({ brokers })
const consumer = kafka.consumer({ groupId: 'notification-service' })

function getTransporter () {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  }
  return null
}

async function startConsumer () {
  await consumer.connect()
  await consumer.subscribe({ topic: 'passport.events', fromBeginning: false })
  const transporter = getTransporter()
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const evt = JSON.parse(message.value.toString())
        const link = `${passportBaseUrl}/api/passports/${evt?.payload?.passportId}`
        const text = `Event: ${evt.event}\nPassport: ${evt?.payload?.passportId}\nUser: ${evt?.payload?.userId}\nTime: ${evt?.payload?.timestamp}\nLink: ${link}`
        if (transporter) {
          await transporter.sendMail({ from: 'noreply@example.com', to: 'ops@example.com', subject: `Notification: ${evt.event}`, text })
        } else {
          logger.info('Notification', { text })
        }
      } catch (e) {
        logger.error('Failed to process message', { error: e.message })
      }
    }
  })
}

async function start () {
  try {
    await startConsumer()
    app.listen(port, () => logger.info(`notification-service listening on ${port}`))
  } catch (e) {
    logger.error('Failed to start', { error: e.message })
    process.exit(1)
  }
}

start()

export default app
