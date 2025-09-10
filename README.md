# Battery Passport Backend

A production-ready microservices backend for a Digital Battery Passport platform, demonstrating enterprise-grade architecture and best practices.

## 🚀 Features

- **Microservices Architecture**: 4 independent services with clear separation of concerns
- **Node.js (>=18) + Express**: Modern JavaScript runtime with fast web framework
- **MongoDB**: NoSQL database for flexible data storage
- **Apache Kafka**: Event streaming platform for real-time messaging
- **JWT + bcrypt**: Secure authentication with role-based access control (RBAC)
- **AWS S3**: Cloud file storage with presigned URLs
- **Docker Compose**: Container orchestration for easy deployment
- **Comprehensive Logging**: Winston-based structured logging across all services
- **API Documentation**: Swagger/OpenAPI documentation for all endpoints
- **Testing**: Jest test suites with CI/CD pipeline
- **Production Ready**: Health checks, error handling, and monitoring

## Services
- Auth Service (4001)
- Passport Service (4002)
- Document Service (4003)
- Notification Service (4004)

## Prerequisites
- Docker and Docker Compose
- AWS credentials for S3 (for Document Service)

## Environment Variables (Required to run)
These variables are consumed by Docker Compose and passed to services. You must set the required ones for the stack to build and run successfully.

Required
- AUTH_JWT_SECRET: strong random secret used to sign JWTs
- AWS_ACCESS_KEY_ID: IAM access key with S3 permissions
- AWS_SECRET_ACCESS_KEY: IAM secret
- AWS_REGION: region of your S3 bucket (e.g., us-east-1)
- S3_BUCKET: name of an existing S3 bucket

Optional
- PRESIGNED_URL_EXPIRE: seconds for S3 presigned URL TTL (default 3600)
- LOG_LEVEL: logging level (default info)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS: if set, Notification Service sends emails; otherwise it logs

Quick setup
```bash
# from project root
# Windows PowerShell
copy .env.example .env
# macOS/Linux
# cp .env.example .env
# Then edit .env and set required values
```

Create a `.env` file in the project root with these variables:
```bash
# JWT Secret - REQUIRED
# Generate a strong random secret: openssl rand -base64 32
AUTH_JWT_SECRET=your_strong_jwt_secret_here

# Logging Level (Optional)
LOG_LEVEL=info

# AWS Configuration - REQUIRED for Document Service
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET=your-s3-bucket-name
PRESIGNED_URL_EXPIRE=3600

# SMTP Configuration (Optional - for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
```

## Run
```bash
docker-compose up --build
```
- Kafka topic `passport.events` is auto-created on startup.
- Swagger UIs:
  - Auth: http://localhost:4001/api-docs
  - Passport: http://localhost:4002/api-docs
  - Document: http://localhost:4003/api-docs
  - Notification: http://localhost:4004/api-docs

## Basic Usage
- Register admin
```bash
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"P@ssw0rd!","role":"admin"}'
```
- Login
```bash
TOKEN=$(curl -s -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"P@ssw0rd!"}' | jq -r .data.token)
```
- Create passport
```bash
curl -X POST http://localhost:4002/api/passports \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"generalInformation":{"manufacturer":"Acme","model":"AB-1000","serialNumber":"SN-12345","productionDate":"2024-01-01T00:00:00.000Z"},"materialComposition":{"cathode":"NMC811","anode":"Graphite","electrolyte":"LiPF6","casing":"Aluminum"},"carbonFootprint":{"productionKgCO2e":1200,"lifecycleKgCO2e":5000}}'
```
- Upload document
```bash
curl -X POST http://localhost:4003/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/file.pdf"
```
- Get document link
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:4003/api/documents/<DOC_ID>
```

## Tests & CI
- Local tests (optional):
```bash
cd services/auth-service && npm ci && npm test
```
- CI runs on GitHub Actions: lint + tests for all services.

## 📊 Logging & Monitoring

### Application Logs
All services use **Winston** for structured logging with JSON format in production and pretty-printed format in development.

#### Where to Find Logs:

1. **Real-time Container Logs**:
   ```bash
   # View all services logs
   docker-compose logs -f
   
   # View specific service logs
   docker-compose logs -f auth-service
   docker-compose logs -f passport-service
   docker-compose logs -f document-service
   docker-compose logs -f notification-service
   ```

2. **Individual Service Logs**:
   ```bash
   # Auth Service API calls and authentication events
   docker-compose logs -f auth-service
   
   # Passport CRUD operations and business logic
   docker-compose logs -f passport-service
   
   # Document uploads, S3 operations, file management
   docker-compose logs -f document-service
   
   # Email notifications and Kafka message processing
   docker-compose logs -f notification-service
   ```

3. **Infrastructure Logs**:
   ```bash
   # MongoDB operations
   docker-compose logs -f mongo
   
   # Kafka message broker
   docker-compose logs -f kafka
   
   # Zookeeper coordination
   docker-compose logs -f zookeeper
   ```

#### Log Levels:
- **error**: Critical errors and exceptions
- **warn**: Warning messages and potential issues
- **info**: General application flow and API calls (default)
- **debug**: Detailed debugging information

#### API Call Logging:
Each API request is logged with:
- HTTP method and endpoint
- Request headers (excluding sensitive data)
- Response status code
- Response time
- User ID (if authenticated)
- Request ID for tracing

Example API log entry:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "service": "auth-service",
  "message": "POST /api/auth/login",
  "meta": {
    "userId": "user123",
    "statusCode": 200,
    "responseTime": "45ms",
    "requestId": "req-abc123"
  }
}
```

### Log File Storage:
- Docker containers log to stdout/stderr
- Docker automatically manages log rotation (max 10MB per file, 1 file retained)
- Logs are accessible via `docker-compose logs` commands
- For production, consider using log aggregation tools like ELK stack or Fluentd

## 🚀 Kafka Event Streaming
See `docs/kafka_topics.md` for detailed event schemas. The `passport-service` produces events to `passport.events` topic, and `notification-service` consumes these events for email notifications.


## 📁 Project Structure
```
battery-passport-backend/
├── docker-compose.yml          # Container orchestration
├── .gitignore                  # Git ignore rules
├── .env                        # Environment variables (create from .env.example)
├── README.md                   # This file
├── docs/                       # Documentation
│   └── kafka_topics.md         # Kafka event schemas
└── services/                   # Microservices
    ├── auth-service/           # Authentication & authorization
    │   ├── src/
    │   │   ├── index.js        # Express server setup
    │   │   ├── logger.js       # Winston logging configuration
    │   │   ├── middleware/     # Auth & error handling middleware
    │   │   ├── models/         # MongoDB User model
    │   │   └── routes/         # API endpoints
    │   ├── tests/              # Jest test suites
    │   └── Dockerfile          # Container configuration
    ├── passport-service/       # Battery passport management
    ├── document-service/       # File upload & S3 storage
    └── notification-service/   # Email notifications via Kafka
```

### ✅ Technical Requirements Met:
- [x] **Microservices Architecture**: 4 independent services
- [x] **API Documentation**: Swagger/OpenAPI on each service
- [x] **Database**: MongoDB with proper models and relationships
- [x] **Authentication**: JWT-based with role-based access control
- [x] **File Storage**: AWS S3 integration with presigned URLs
- [x] **Event Streaming**: Kafka for inter-service communication
- [x] **Containerization**: Docker Compose for easy deployment
- [x] **Testing**: Jest test suites with CI/CD pipeline
- [x] **Logging**: Comprehensive Winston-based logging
- [x] **Error Handling**: Global error middleware
- [x] **Security**: Input validation, rate limiting, CORS

### 🔧 Setup:
1. **Clone the repository**
2. **Create `.env` file** with required environment variables (see above)
3. **Run with Docker**: `docker-compose up --build`
4. **Access APIs**: Each service runs on different ports (4001-4004)
5. **View Documentation**: Visit `/api-docs` on each service
6. **Check Logs**: Use `docker-compose logs -f` commands

### 📈 Key Demonstration Points:
- **Scalable Architecture**: Each service can be scaled independently
- **Production Practices**: Proper logging, error handling, health checks
- **Modern Tech Stack**: Latest Node.js, Express, MongoDB, Kafka
- **Security Best Practices**: JWT authentication, input validation
- **Developer Experience**: Clear documentation, easy setup, comprehensive testing
- **Real-world Patterns**: Event-driven architecture, microservices communication
