# Notification System Documentation

## Overview

The Applicant Tracking System includes a comprehensive **real-time notification system** with the following capabilities:

- ✅ **Real-time Push Notifications** via Socket.IO
- ✅ **Email Fallback** for offline users
- ✅ **Asynchronous Queue Processing** (non-blocking API)
- ✅ **Read/Unread Tracking** per user
- ✅ **Event-Based & Cron-Based Alerts**
- ✅ **User-Targeted Alerts** with role-based distribution

---

## Architecture

### Components

```
┌─────────────────────┐
│   Frontend Client   │
└──────────┬──────────┘
           │
      Socket.IO
           │
┌──────────▼──────────┐       ┌──────────────────┐
│  Real-time Server   │◄─────►│   Alerts Queue   │
│  (Socket.IO)        │       │  (In-Memory FIFO)│
└──────────┬──────────┘       └──────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌──────────┐
│MongoDB │  │SMTP Mail │
│Alerts  │  │ Server   │
└────────┘  └──────────┘
```

### Stack

| Component | Technology |
|-----------|------------|
| Real-time Delivery | Socket.IO 4.8.1 |
| Email Fallback | Nodemailer 8.0.1 |
| Message Queue | In-Memory FIFO |
| Database | MongoDB (Mongoose) |
| Scheduling | node-cron 4.2.1 |

---

## Database Schema

### Alerts Collection

```javascript
{
  _id: ObjectId,
  type: String,                    // Alert category
  section: String,                 // "important" | "general"
  category: String,                // "JOBS" | "CANDIDATES" | "SYSTEM"
  severity: String,                // "high" | "medium" | "low"
  title: String,                   // Alert title
  message: String,                 // Alert message
  timestamp: Date,                 // When alert occurred
  meta: {                          // Alert metadata
    // custom fields based on type
  },
  sourceKey: String,               // Unique identifier (for upserts)
  users: [ObjectId],               // Target user IDs (empty = all dashboard users)
  isActive: Boolean,               // true by default
  readBy: [                        // Read tracking
    {
      user: ObjectId,
      readAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Alert Types

| Type | Section | Category | Trigger |
|------|---------|----------|---------|
| `job_expiring` | important | JOBS | Job closes in 1 day |
| `status_transition` | general | CANDIDATES | Candidate status changes |
| `interview_completed` | general | CANDIDATES | Interview completed (sent to admin/HR/manager) |
| `interview_scheduled` | general | CANDIDATES | Interview assigned (sent to interviewer) |
| `candidate_assigned` | general | CANDIDATES | Candidate assigned to recruiter |
| `offer_accepted` | important | CANDIDATES | Candidate accepts offer |
| `job_status_changed` | general | JOBS | Job status modified |
| `interview_reminder` | important | CANDIDATES | Interview 1 hour away (cron-based) |
| `candidate_inactive` | important | CANDIDATES | Candidate inactive 7 days (cron-based) |

---

## Backend API Endpoints

### 1. Get Alerts Feed

**Endpoint:** `GET /api/dashboard/alerts`

**Headers:**
```bash
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

**Query Parameters:**
```
?endInDays=1           # Jobs expiring within days (default: 1)
?transitionDays=1      # Days to look back for status changes (default: 1)
?transitionLimit=50    # Max results (default: 50)
?agingDays=20          # Aging threshold (default: 20)
?interviewDoneDays=1   # Days to look back for completed interviews (default: 1)
?interviewLimit=50     # Max results (default: 50)
?newApplicantDays=1    # Days to look back for new applicants (default: 1)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filters": {
      "endInDays": 1,
      "transitionDays": 1,
      // ... other filter params
    },
    "summaryCounts": {
      "jobsClosingSoon": 2,
      "jobAging": 5,
      "candidateStageTransitions": 3,
      "interviewsCompleted": 1
    },
    "segments": {
      "jobsClosingSoon": [
        {
          "_id": "65f...",
          "jobTitle": "Senior Developer",
          "department": "Engineering",
          "targetClosureDate": "2026-03-07T..."
        }
      ],
      // ... other segments
    },
    "uiAlerts": {
      "importantAndPriority": [
        {
          "id": "65f...",
          "section": "important",
          "category": "JOBS",
          "severity": "high",
          "title": "Job Posting Expiring",
          "message": "Senior Developer closes on 3/7/2026...",
          "timestamp": "2026-03-06T...",
          "timeAgo": "2h ago",
          "isRead": false,
          "meta": { /* ... */ }
        }
      ],
      "generalNotifications": [
        // ... general alerts
      ]
    },
    "uiSummary": {
      "importantNewCount": 2,
      "generalNewCount": 3,
      "totalNewCount": 5
    }
  }
}
```

---

### 2. Mark All Alerts as Read

**Endpoint:** `PATCH /api/dashboard/alerts/read-all`

**Headers:**
```bash
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "modifiedCount": 5
  }
}
```

---

### 3. Mark Single Alert as Read

**Endpoint:** `PATCH /api/dashboard/alerts/:alertId/read`

**Headers:**
```bash
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65f...",
    "title": "Job Posting Expiring",
    "readBy": [
      {
        "user": "65f...",
        "readAt": "2026-03-06T14:30:00Z"
      }
    ]
  }
}
```

---

### 4. Stream Alerts (Server-Sent Events)

**Endpoint:** `GET /api/dashboard/alerts/stream`

**Headers:**
```bash
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event Types:**
- `snapshot` - Initial alert state
- `update` - Periodic refresh (every 30 seconds)
- `error` - Error event

**Example Response:**
```
event: snapshot
data: {"success":true,"data":{"uiAlerts":{...},"uiSummary":{...}}}

event: update
data: {"success":true,"data":{"uiAlerts":{...},"uiSummary":{...}}}

event: keepalive
data: keepalive 1646568000000
```

---

## Socket.IO Real-Time Integration

### Connection Setup

**Client-side (Frontend):**

```javascript
import io from 'socket.io-client';

// Connect with authentication
const socket = io('http://localhost:5000', {
  path: '/socket.io',
  auth: {
    token: localStorage.getItem('accessToken')
  },
  query: {
    token: localStorage.getItem('accessToken')
  }
});

// Connection established
socket.on('alerts:connected', (data) => {
  console.log('Connected to alerts:', data.connectedAt);
});

// Listen for new alerts
socket.on('alerts:new', (alert) => {
  console.log('New alert:', alert);
  // Display notification in UI
  showNotification(alert);
});

// Listen for refresh signals
socket.on('alerts:refresh', (data) => {
  console.log('Alerts updated:', data.timestamp);
  // Fetch fresh alerts from API
  fetchAlerts();
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from alerts');
});
```

### Socket Events

#### Sent by Server

| Event | Payload | Description |
|-------|---------|-------------|
| `alerts:connected` | `{ success, connectedAt }` | User connected successfully |
| `alerts:new` | Alert object | New alert created for user |
| `alerts:refresh` | `{ timestamp }` | Alerts updated, fetch fresh data |
| `error` | `{ message }` | Socket error |

#### Sent by Client

None required - server automatically broadcasts based on user room.

### Auto-Join Rooms

When a user connects, they automatically join:
- `user:<userId>` - Receives alerts targeted to them
- `alerts:viewDashboard` - Receives all dashboard alerts

---

## Event-Based Alerts Triggers

### Interview Scheduled

**Triggered when:** Interview is created for a candidate

**Recipients:** Interviewer & co-interviewers

**Alert:**
```json
{
  "type": "interview_scheduled",
  "section": "general",
  "category": "CANDIDATES",
  "severity": "low",
  "title": "Interview Assigned",
  "message": "You have been assigned to interview John Doe on 3/10/2026 2:00 PM.",
  "users": ["interviewer_id", "co_interviewer_id"],
  "meta": {
    "candidateId": "...",
    "candidateName": "John Doe",
    "jobId": "...",
    "stage": "Technical Interview 1",
    "interviewerId": "..."
  }
}
```

---

### Candidate Assigned

**Triggered when:** Candidate is assigned to a recruiter

**Recipients:** Assigned recruiter

**Alert:**
```json
{
  "type": "candidate_assigned",
  "section": "general",
  "category": "CANDIDATES",
  "severity": "low",
  "title": "Candidate Assigned",
  "message": "You have been assigned the candidate John Doe.",
  "users": ["recruiter_id"],
  "meta": {
    "candidateId": "...",
    "candidateName": "John Doe",
    "recruiterId": "...",
    "recruiterName": "Jane Smith"
  }
}
```

**To assign a recruiter:**
```bash
PUT /api/candidate/:candidateId
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>

{
  "recruiterId": "65f1234567890abcdef..."
}
```

---

### Interview Completed

**Triggered when:** Interview result is marked as "Passed" or "Failed"

**Recipients:** Super Admin, HR Recruiter, Hiring Manager

**Alert:**
```json
{
  "type": "interview_completed",
  "section": "general",
  "category": "CANDIDATES",
  "severity": "medium", // or "low" if passed
  "title": "Interview Completed",
  "message": "Technical Interview 1 by John Interviewer for Jane Candidate - Result: Passed.",
  "users": ["superadmin_id", "hr_recruiter_id", "manager_id"],
  "meta": {
    "candidateId": "...",
    "candidateName": "Jane Candidate",
    "jobId": "...",
    "stage": "Technical Interview 1",
    "result": "Passed",
    "feedback": "Strong technical skills...",
    "interviewerId": "..."
  }
}
```

---

### Offer Accepted

**Triggered when:** Candidate status changes to "Offer Accepted"

**Recipients:** All dashboard users (important alert)

**Alert:**
```json
{
  "type": "offer_accepted",
  "section": "important",
  "category": "CANDIDATES",
  "severity": "high",
  "title": "Offer Accepted",
  "message": "Jane Candidate has accepted the offer.",
  "users": [],
  "meta": {
    "candidateId": "...",
    "candidateName": "Jane Candidate",
    "updatedById": "...",
    "updatedByName": "HR Manager"
  }
}
```

---

### Job Status Changed

**Triggered when:** Job status is updated

**Recipients:** Super Admin, HR Recruiter

**Alert:**
```json
{
  "type": "job_status_changed",
  "section": "general",
  "category": "JOBS",
  "severity": "medium",
  "title": "Job Status Updated",
  "message": "Senior Developer: Open -> Filled.",
  "users": ["superadmin_id", "hr_recruiter_id"],
  "meta": {
    "jobId": "...",
    "jobTitle": "Senior Developer",
    "fromStatus": "Open",
    "toStatus": "Filled",
    "updatedById": "...",
    "updatedByName": "Hiring Manager"
  }
}
```

---

## Cron-Based Alerts (Background Jobs)

### Schedule

**Frequency:** Every hour (configurable via `ALERTS_CRON_SCHEDULE`)

**Timezone:** Asia/Kolkata (configurable via `ALERTS_CRON_TIMEZONE`)

### Cron Jobs

#### 1. Job Expiring (1 day)

**Runs:** Every hour

**Finds:** Jobs with `targetClosureDate` within 1 day

**Recipients:** Super Admin, Hiring Manager

**Alert:**
```json
{
  "type": "job_expiring",
  "section": "important",
  "category": "JOBS",
  "severity": "high",
  "title": "Job Posting Expiring",
  "message": "Senior Developer closes on 3/7/2026 (Engineering).",
  "users": ["superadmin_id", "manager_id"],
  "meta": {
    "jobId": "...",
    "jobTitle": "Senior Developer",
    "department": "Engineering",
    "targetClosureDate": "2026-03-07T..."
  }
}
```

---

#### 2. Interview Reminders (1 hour before)

**Runs:** Every hour

**Finds:** Pending interviews scheduled within the next hour

**Recipients:** Interviewer & co-interviewers

**Alert:**
```json
{
  "type": "interview_reminder",
  "section": "important",
  "category": "CANDIDATES",
  "severity": "medium",
  "title": "Interview Reminder",
  "message": "Reminder: you have an interview with John Doe at 3/10/2026 2:00 PM.",
  "users": ["interviewer_id"],
  "meta": {
    "candidateId": "...",
    "candidateName": "John Doe",
    "interviewId": "..."
  }
}
```

---

#### 3. Candidate Inactive (7 days)

**Runs:** Every hour

**Finds:** Candidates with `lastActivityAt` >= 7 days ago

**Recipients:** HR Recruiters

**Alert:**
```json
{
  "type": "candidate_inactive",
  "section": "important",
  "category": "CANDIDATES",
  "severity": "medium",
  "title": "Candidate Inactive",
  "message": "Jane Candidate has not been active since 2/27/2026.",
  "users": ["hr_recruiter_id"],
  "meta": {
    "candidateId": "...",
    "lastActivityAt": "2026-02-27T..."
  }
}
```

---

## Email Fallback

### When Emails Are Sent

**Condition:** Alert is `important` OR `severity: high` AND user is **offline**

**Process:**
1. Alert is created
2. Socket.IO checks if user is online
3. If offline → email is queued (non-blocking)
4. Email sent via SMTP

### Environment Variables

```bash
# .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false           # true for port 465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use app-specific password for Gmail
SMTP_FROM="Alerts <noreply@ats.example.com>"
```

### Email Template

**Subject:**
```
Alert: [Alert Title]
```

**Body:**
```
[Alert Message]

View dashboard for details.
```

---

## Asynchronous Queue

### How It Works

1. Alert is triggered
2. Enqueued to in-memory FIFO queue
3. Caller returns immediately (non-blocking)
4. Queue processes in background
5. DB write + email/socket emit

### Benefits

- ✅ API endpoints don't wait for alert processing
- ✅ Reduced latency for API responses
- ✅ Handles spike in alert volume gracefully

### Queue Status

```javascript
// Check queue health
const alertQueue = []; // In-memory FIFO
let isProcessingQueue = false;

// Auto-processes via setImmediate()
```

---

## Read/Unread Tracking

### Implementation

Each alert tracks which users have read it:

```javascript
readBy: [
  {
    user: ObjectId,      // User ID
    readAt: Date         // Timestamp
  }
]
```

### Mark Alert as Read

```bash
PATCH /api/dashboard/alerts/:alertId/read
Authorization: Bearer <ACCESS_TOKEN>

# Response marks alert as read for current user
```

### Check Unread Status

```javascript
// From API response
uiSummary: {
  importantNewCount: 2,    // Unread important
  generalNewCount: 5,      // Unread general
  totalNewCount: 7         // Total unread
}

// Per-alert
alert.isRead = true/false
```

---

## Frontend Integration Guide

### 1. Setup Socket.IO Connection

```javascript
import io from 'socket.io-client';

const initializeAlerts = (accessToken) => {
  const socket = io('http://localhost:5000', {
    path: '/socket.io',
    auth: { token: accessToken },
    query: { token: accessToken },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✅ Connected to alerts');
  });

  socket.on('alerts:connected', (data) => {
    console.log('✅ Alerts ready:', data.connectedAt);
  });

  socket.on('alerts:new', (alert) => {
    handleNewAlert(alert);
  });

  socket.on('alerts:refresh', () => {
    fetchAlertsFromAPI();
  });

  socket.on('disconnect', () => {
    console.log('⚠️ Disconnected from alerts');
  });

  return socket;
};
```

---

### 2. Fetch Alerts on Load

```javascript
const fetchAlerts = async (accessToken) => {
  try {
    const response = await fetch('http://localhost:5000/api/dashboard/alerts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch alerts');

    const { data } = await response.json();

    return {
      alerts: data.uiAlerts.importantAndPriority.concat(
        data.uiAlerts.generalNotifications
      ),
      unreadCount: data.uiSummary.totalNewCount
    };
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    return { alerts: [], unreadCount: 0 };
  }
};
```

---

### 3. Display Real-Time Alerts

```javascript
const handleNewAlert = (alert) => {
  // Show toast/notification
  showNotification({
    title: alert.title,
    message: alert.message,
    type: getSeverityType(alert.severity), // 'success' | 'warning' | 'error'
    duration: 5000
  });

  // Update unread count badge
  updateUnreadBadge();

  // Add to alerts list
  addAlertToList(alert);
};

const showNotification = (config) => {
  // Use your UI library (Toast, Notification, etc.)
  notification.show({
    title: config.title,
    message: config.message,
    type: config.type,
    duration: config.duration
  });
};
```

---

### 4. Mark Alerts as Read

```javascript
const markAlertRead = async (alertId, accessToken) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/dashboard/alerts/${alertId}/read`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) throw new Error('Failed to mark as read');

    // Update UI
    updateAlertReadStatus(alertId, true);
  } catch (error) {
    console.error('❌ Error marking alert as read:', error);
  }
};

const markAllAlertsRead = async (accessToken) => {
  try {
    const response = await fetch(
      'http://localhost:5000/api/dashboard/alerts/read-all',
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) throw new Error('Failed to mark all as read');

    // Clear unread badges
    clearAllUnreadBadges();
  } catch (error) {
    console.error('❌ Error marking all alerts as read:', error);
  }
};
```

---

### 5. Alerts UI Component Example

```jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const AlertsPanel = ({ accessToken }) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO
    const newSocket = io('http://localhost:5000', {
      path: '/socket.io',
      auth: { token: accessToken },
      query: { token: accessToken }
    });

    // Fetch initial alerts
    fetchInitialAlerts();

    // Listen for new alerts
    newSocket.on('alerts:new', (alert) => {
      setAlerts(prev => [alert, ...prev]);
      setUnreadCount(prev => prev + 1);
      showNotification(alert);
    });

    newSocket.on('alerts:refresh', () => {
      fetchInitialAlerts();
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [accessToken]);

  const fetchInitialAlerts = async () => {
    const response = await fetch('http://localhost:5000/api/dashboard/alerts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    const { data } = await response.json();
    setAlerts([
      ...data.uiAlerts.importantAndPriority,
      ...data.uiAlerts.generalNotifications
    ]);
    setUnreadCount(data.uiSummary.totalNewCount);
  };

  const handleMarkAsRead = async (alertId) => {
    await fetch(`http://localhost:5000/api/dashboard/alerts/${alertId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  return (
    <div className="alerts-panel">
      <h3>Alerts ({unreadCount})</h3>
      <div className="alerts-list">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.severity}`}>
            <h4>{alert.title}</h4>
            <p>{alert.message}</p>
            <small>{alert.timeAgo}</small>
            {!alert.isRead && (
              <button onClick={() => handleMarkAsRead(alert.id)}>
                Mark as Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPanel;
```

---

## Testing

### Test Alert Creation

```bash
# Login first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Get alerts
curl -X GET http://localhost:5000/api/dashboard/alerts \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -b cookies.txt
```

### Test Socket Connection

```bash
# Use Socket.IO test client or Postman
ws://localhost:5000/socket.io/
?EIO=4&transport=websocket&token=<ACCESS_TOKEN>
```

---

## Troubleshooting

### Issue: Alerts not appearing

**Check:**
1. ✅ Socket.IO token is valid
2. ✅ User is in correct room (`user:<userId>`)
3. ✅ Alert has correct target `users` array
4. ✅ Check browser console for socket errors

### Issue: Emails not sending

**Check:**
1. ✅ SMTP credentials in `.env`
2. ✅ User is offline when alert created
3. ✅ Alert is `important` OR `severity: high`
4. ✅ User has valid email in database

### Issue: Unread count incorrect

**Check:**
1. ✅ Call mark-as-read endpoint
2. ✅ Refresh `/api/dashboard/alerts`
3. ✅ Check `readBy` field in alert document

---

## Configuration

### Environment Variables

```bash
# .env
JWT_ACCESS_TOKEN_SECRET=your_secret_here
JWT_REFRESH_TOKEN_SECRET=your_secret_here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="ATS Alerts <noreply@ats.example.com>"

# Alerts Cron
ALERTS_CRON_ENABLED=true
ALERTS_CRON_SCHEDULE="0 * * * *"      # Every hour
ALERTS_CRON_TIMEZONE="Asia/Kolkata"

# Server
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
```

---

## Performance Considerations

| Item | Limit | Note |
|------|-------|------|
| Alert Queue Size | Unlimited | Depends on memory |
| Socket Connections | 100+ per server | Consider clustering for scale |
| Email Rate | 100/min | Depends on SMTP provider |
| DB Indexes | 3 | Built on `timestamp`, `users`, `section` |
| Alert Retention | 90 days | Auto-deleted by cron |

---

## Summary

| Feature | Status |
|---------|--------|
| Real-time Socket.IO | ✅ Working |
| Email Fallback | ✅ Configured |
| Async Queue | ✅ Active |
| Read/Unread Tracking | ✅ Implemented |
| Event-Based Alerts | ✅ 9 types |
| Cron-Based Reminders | ✅ Hourly |
| User Targeting | ✅ By ID or role |
| Role-Based Distribution | ✅ Automatic |

---

**Contact Backend Dev** for any integration issues or clarifications needed.
