import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import { logger } from './logger.js'
import authRouter from './routes/auth.js'
import { errorHandler, notFound } from './middleware/error.js'

dotenv.config()

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const port = process.env.PORT || 4001
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/battery_passport'

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Auth Service', version: '1.0.0' }
  },
  apis: ['./src/routes/*.js']
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/auth', authRouter)

app.use(notFound)
app.use(errorHandler)

async function start () {
  try {
    await mongoose.connect(mongoUri)
    app.listen(port, () => {
      logger.info(`auth-service listening on ${port}`)
    })
  } catch (err) {
    logger.error('Failed to start', { error: err.message })
    process.exit(1)
  }
}

start()

export default app
