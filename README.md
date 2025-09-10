# battery-passport-backend

Production-like microservices backend for a Digital Battery Passport platform aligned with MEAtec assignment.

- Node.js (>=18) + Express
- MongoDB for persistence
- Apache Kafka (with Zookeeper) for async messaging
- JWT + bcrypt for authentication & RBAC
- AWS S3 for file storage using @aws-sdk v3
- Docker Compose orchestration
- Swagger docs, Winston logging, Jest tests, GitHub Actions CI

## Services
- Auth Service (4001)
- Passport Service (4002)
- Document Service (4003)
- Notification Service (4004)

## Prerequisites
- Docker and Docker Compose
- AWS credentials for S3 (for Document Service)

## Installation & Setup
1. Clone repo and move into directory
```bash
git clone <your-repo-url>
cd battery-passport-backend
```
2. Create and fill env file
```bash
# PowerShell (Windows)
copy .env.example .env
# macOS/Linux
# cp .env.example .env
```
3. Edit `.env` (example below)

### .env example
```
AUTH_JWT_SECRET=change_me_to_strong_random_value
LOG_LEVEL=info

# Document Service AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=yourSecretHere
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
PRESIGNED_URL_EXPIRE=3600

# Notification Service SMTP (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
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

## Kafka
See `docs/kafka_topics.md`. `passport-service` produces events to `passport.events`. `notification-service` consumes and emails/logs.
