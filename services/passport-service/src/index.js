import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import { logger } from './logger.js'
import passportRouter from './routes/passports.js'

dotenv.config()

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const port = process.env.PORT || 4002
const mongoUri = process.env.MONGO_URI

const swaggerSpec = swaggerJSDoc({
  definition: { openapi: '3.0.0', info: { title: 'Passport Service', version: '1.0.0' } },
  apis: ['./src/routes/*.js']
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/passports', passportRouter)

app.use((req, res) => res.status(404).json({ success: false, error: { message: 'Not Found', code: 'NOT_FOUND' } }))
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message })
  res.status(500).json({ success: false, error: { message: 'Internal Server Error', code: 'INTERNAL_ERROR' } })
})

async function start () {
  try {
    await mongoose.connect(mongoUri)
    app.listen(port, () => logger.info(`passport-service listening on ${port}`))
  } catch (e) {
    logger.error('Failed to start', { error: e.message })
    process.exit(1)
  }
}

start()

export default app
