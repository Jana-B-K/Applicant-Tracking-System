# Authentication & Refresh Token Implementation

## Overview

The system implements a **secure JWT-based authentication** with automatic token refresh and rotation.

- ✅ Access Token (15 minutes)
- ✅ Refresh Token (7 days, stored in secure HTTP-only cookie)
- ✅ Token Rotation on refresh
- ✅ Secure cookie handling

---

## Token Architecture

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Generate Access Token (15m)        │
│  Generate Refresh Token (7d)        │
│  Store Refresh Token in DB & Cookie │
└──────┬──────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Return Access Token  │
│ Set Refresh Cookie   │
└──────────────────────┘
       │
   [User Logged In]
       │
       ▼
┌─────────────────────────────┐
│ Access Token Expires (15m)  │
└──────┬──────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Call /refresh-token        │ ◄─ Send Refresh Token
│ (Automatic on 401)         │
└──────┬─────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Validate Refresh Token       │
│ Generate NEW Access Token    │
│ Rotate Refresh Token (new)   │
└──────┬───────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Return New Access Token     │
│ Set New Refresh Cookie      │
└─────────────────────────────┘
```

---

## Database Schema

### User Model - Token Fields

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  password: String (hashed),
  role: String,             // 'superadmin' | 'hrrecruiter' | 'hiringmanager' | 'interviewpanel' | 'management'
  permissions: Object,
  isActive: Boolean,
  refreshToken: String,     // JWT refresh token (current)
  passwordResetTokenHash: String,
  passwordResetTokenExpiresAt: Date,
  passwordResetOtpAttempts: Number,
  passwordResetLastSentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Token Generation

### Access Token

**File:** `src/utils/token.js`

```javascript
export const generateAccessToken = (id) => 
  jwt.sign(
    { id },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }  // 15 minutes
  );
```

**Payload:**
```javascript
{
  id: ObjectId,           // User ID
  iat: 1646568000,       // Issued at
  exp: 1646568900        // Expires in 15 minutes
}
```

**Usage:** Sent in every API request header
```bash
Authorization: Bearer <ACCESS_TOKEN>
```

---

### Refresh Token

**File:** `src/utils/token.js`

```javascript
export const generateRefreshToken = (id) => 
  jwt.sign(
    { id },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }   // 7 days
  );
```

**Payload:**
```javascript
{
  id: ObjectId,           // User ID
  iat: 1646568000,       // Issued at
  exp: 1647172800        // Expires in 7 days
}
```

**Usage:** Stored in secure HTTP-only cookie
```bash
Cookie: refreshToken=<REFRESH_TOKEN>
```

---

## Environment Variables

```bash
# .env
JWT_ACCESS_TOKEN_SECRET=your_access_secret_key_here_min_32_chars
JWT_REFRESH_TOKEN_SECRET=your_refresh_secret_key_here_min_32_chars
```

**Generate strong secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Login Flow

### Endpoint: `POST /api/auth/login`

**Request:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f1234567890abcdef...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "hiringmanager",
    "assignedPermissions": { /* ... */ },
    "permissions": { /* ... */ }
  }
}
```

**Cookies Set:**
```
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; 
  HttpOnly; 
  Secure; 
  SameSite=Strict; 
  Max-Age=604800 (7 days)
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Refresh Token Flow

### Endpoint: `POST /api/auth/refresh-token`

**Request (with cookie):**
```bash
POST http://localhost:5000/api/auth/refresh-token
Content-Type: application/json
Cookie: refreshToken=<REFRESH_TOKEN>

# OR in body:
{
  "refreshToken": "<REFRESH_TOKEN>"
}
```

**Service Logic:**

```javascript
export const refreshAccessTokenService = async (refreshToken) => {
  // 1. Check if token exists
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  // 2. Verify token signature
  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }

  // 3. Find user in database
  const user = await User.findById(decoded.id);

  // 4. Verify user exists, is active, and token matches DB
  if (!user || !user.isActive || user.refreshToken !== refreshToken) {
    throw new Error("Invalid refresh token");
  }

  // 5. Generate NEW tokens (rotation)
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  // 6. Update DB with new refresh token
  await User.updateOne(
    { _id: user._id },
    { $set: { refreshToken: newRefreshToken } }
  );

  // 7. Return new tokens
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};
```

**Response (200 OK):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cookies Updated:**
```
Set-Cookie: refreshToken=<NEW_REFRESH_TOKEN>; 
  HttpOnly; 
  Secure; 
  SameSite=Strict; 
  Max-Age=604800
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

The `refreshToken` cookie is also cleared on error:
```
Set-Cookie: refreshToken=; 
  HttpOnly; 
  Secure; 
  SameSite=Strict; 
  Max-Age=0
```

---

## Token Validation Middleware

### Endpoint Protection

**File:** `src/middleware/auth.middleware.js`

```javascript
export const protect = async (req, res, next) => {
  try {
    // 1. Extract access token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided"
      });
    }

    // 2. Verify access token signature
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_TOKEN_SECRET
    );

    // 3. Fetch user from DB
    const user = await User.findById(decoded.id)
      .select('-password -refreshToken -passwordResetTokenHash -passwordResetTokenExpiresAt');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found or inactive"
      });
    }

    // 4. Resolve permissions
    const permissions = await resolveUserPermissionsService({
      role: user.role,
      permissions: user.permissions,
    });

    // 5. Attach to request
    req.user = user;
    req.permissions = permissions;

    next();

  } catch (error) {
    // Token expired or invalid
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Token expired or invalid"
    });
  }
};
```

---

## Frontend Integration

### 1. Store Tokens

**Option A: localStorage (simpler, less secure)**
```javascript
// After login
localStorage.setItem('accessToken', response.accessToken);
// refreshToken is stored in HTTP-only cookie automatically
```

**Option B: Memory only (more secure)**
```javascript
let accessToken = null;
// On login
accessToken = response.accessToken;
// refreshToken in HTTP-only cookie
```

---

### 2. Add Token to Requests

```javascript
// Fetch interceptor
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'  // Include cookies
  });

  // Handle 401 - token expired
  if (response.status === 401) {
    const refreshResponse = await fetch(
      'http://localhost:5000/api/auth/refresh-token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'  // Send refresh token cookie
      }
    );

    if (refreshResponse.ok) {
      const { accessToken: newToken } = await refreshResponse.json();
      localStorage.setItem('accessToken', newToken);

      // Retry original request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
    } else {
      // Refresh failed - redirect to login
      window.location.href = '/login';
      return null;
    }
  }

  return response;
};
```

---

### 3. Login Handler

```javascript
const handleLogin = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'  // Accept cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const { accessToken, user } = await response.json();

    // Store access token
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Refresh token cookie is set automatically
    console.log('✅ Login successful');

    // Redirect to dashboard
    window.location.href = '/dashboard';

  } catch (error) {
    console.error('❌ Login failed:', error.message);
    alert(error.message);
  }
};
```

---

### 4. Logout Handler

```javascript
const handleLogout = async () => {
  try {
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');

    // Optional: Call logout endpoint to clear server-side session
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {
      // Endpoint may not exist, that's OK
    });

    console.log('✅ Logged out');

    // Redirect to login
    window.location.href = '/login';

  } catch (error) {
    console.error('❌ Logout error:', error);
  }
};
```

---

### 5. React Hook Example

```javascript
import { useEffect, useState } from 'react';

const useAuth = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get stored token
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token) {
      setAccessToken(token);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { accessToken: token, user: userData } = await response.json();

      setAccessToken(token);
      setUser(userData);

      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const { accessToken: newToken } = await response.json();

      setAccessToken(newToken);
      localStorage.setItem('accessToken', newToken);

      return { success: true };

    } catch (error) {
      // Clear on error
      logout();
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  return {
    accessToken,
    user,
    loading,
    login,
    refreshAccessToken,
    logout,
    isAuthenticated: !!accessToken
  };
};

export default useAuth;
```

---

### 6. Axios Interceptor (Alternative)

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true  // Include cookies
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - attempt refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          'http://localhost:5000/api/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        const { accessToken: newToken } = response.data;
        localStorage.setItem('accessToken', newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Security Features

### 1. Token Rotation

Every refresh generates a new refresh token:
```javascript
// Old token becomes invalid
user.refreshToken = newRefreshToken;  // Update DB
```

**Benefit:** Limits window of compromise if token is leaked

---

### 2. HTTP-Only Cookies

Refresh token stored in secure cookie:
```javascript
res.cookie("refreshToken", data.refreshToken, {
  httpOnly: true,        // ✅ Not accessible via JavaScript
  secure: true,          // ✅ HTTPS only
  sameSite: "strict",    // ✅ CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

**Benefit:** Protects against XSS attacks

---

### 3. Token Verification

Multiple checks on refresh:
- ✅ Token signature valid
- ✅ Token not expired
- ✅ User exists in DB
- ✅ User is active
- ✅ Token matches DB value (prevents replay)

---

### 4. Access Token Expiry

Short 15-minute lifetime forces frequent refresh:
- ✅ Limits damage from stolen token
- ✅ User activity triggers refresh
- ✅ Automatic on client-side

---

## Testing

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt \
  -v

# Response includes:
# - accessToken in body
# - refreshToken in Set-Cookie header
```

### Test Refresh Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v

# Response includes:
# - New accessToken in body
# - New refreshToken in Set-Cookie header
```

### Test Protected Endpoint

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json"

# Response includes user data
```

### Test Expired Token

```bash
# Wait 15 minutes or manually generate old token

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <EXPIRED_TOKEN>" \
  -H "Content-Type: application/json"

# Response: 401 Unauthorized
```

---

## Troubleshooting

### Issue: "Refresh token required"

**Cause:** Refresh token cookie not sent

**Solution:**
- ✅ Use `credentials: 'include'` in fetch
- ✅ Check browser cookies in DevTools
- ✅ Verify `secure` flag in production (HTTPS required)

---

### Issue: "Invalid refresh token"

**Cause:** Token mismatch or user not found

**Solution:**
- ✅ Login again to get new tokens
- ✅ Check DB `refreshToken` field matches
- ✅ Verify `isActive` is true

---

### Issue: Access token expires constantly

**Cause:** Refresh token refresh not working

**Solution:**
- ✅ Implement axios interceptor (above)
- ✅ Auto-refresh before expiry (optional)
- ✅ Check refresh endpoint works

---

### Issue: CORS errors with cookies

**Cause:** Credentials not sent properly

**Solution:**
```javascript
// ✅ CORRECT
fetch(url, { credentials: 'include' })
axios.create({ withCredentials: true })

// ❌ WRONG
fetch(url, { credentials: 'omit' })
axios.get(url)  // without withCredentials
```

---

## Summary

| Feature | Status |
|---------|--------|
| Access Token (15m) | ✅ Working |
| Refresh Token (7d) | ✅ Working |
| Token Rotation | ✅ Active |
| Secure Cookies | ✅ Configured |
| DB Storage | ✅ Stored |
| Middleware Protection | ✅ Implemented |
| Frontend Integration | ✅ Ready |
| Error Handling | ✅ Complete |

---

**The refresh token system is fully operational and production-ready.**

Ensure to:
1. Use `credentials: 'include'` in all fetch requests
2. Implement client-side token refresh (axios interceptor recommended)
3. Store only `accessToken` in localStorage
4. Let refresh token live in HTTP-only cookie
5. Test with expired tokens before production
