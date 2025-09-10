export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  transform: {},
  lint: {
    '*': [
      'cd services/auth-service && npm run lint',
      'cd ../passport-service && npm run lint',
      'cd ../document-service && npm run lint',
      'cd ../notification-service && npm run lint'
    ]
  }
}
