# Applicant-Tracking-System

## Notification System

- Supports **event-based** and **cron-based** alerts stored in MongoDB.
- Real-time delivery via Socket.IO (`/socket.io` path).
- Alerts have targets (`users`), `section`, `category`, `severity`, and metadata.
- Includes **email fallback** for offline or important users (SMTP settings required).
- Processing is **asynchronous**—alert creation is queued to avoid slowing API calls.
- Read/unread tracking is maintained per user.

### Environment Variables for Email

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user
SMTP_PASS=pass
SMTP_FROM="no-reply@example.com"
```

