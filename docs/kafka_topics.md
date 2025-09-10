# Kafka Topics

- Topic: `passport.events`

Event payload shape:
```json
{
  "event": "passport.created | passport.updated | passport.deleted",
  "payload": { "passportId": "...", "data": { }, "userId": "...", "timestamp": "ISO" },
  "meta": { "service": "passport-service", "version": "1.0.0" }
}
```
