# Authentication Service Documentation

## Overview

The `authService` is a centralized authentication service that manages JWT tokens (access and refresh tokens) and provides methods for authenticated API calls with automatic token refresh.

## Features

- ✅ **Token Management**: Automatically stores and retrieves access and refresh tokens
- ✅ **User Data Storage**: Saves user information from login response
- ✅ **Automatic Token Refresh**: Automatically refreshes expired access tokens
- ✅ **Authenticated Requests**: Provides a wrapper for making authenticated API calls
- ✅ **Error Handling**: Handles authentication errors gracefully

## Usage

### 1. Login

```typescript
import { authService } from './services/authService';

try {
  const loginResponse = await authService.login('username', 'password');
  console.log('Login successful:', loginResponse.user);
  // Tokens are automatically saved to localStorage
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### 2. Check Authentication Status

```typescript
if (authService.isAuthenticated()) {
  console.log('User is authenticated');
} else {
  console.log('User is not authenticated');
}
```

### 3. Get User Data

```typescript
const user = authService.getUserData();
if (user) {
  console.log('Current user:', user.username);
}
```

### 4. Make Authenticated API Calls

The `authenticatedFetch` method automatically:
- Adds the Authorization header with the access token
- Handles 401 errors by refreshing the token
- Retries the request with the new token

```typescript
// GET request
const response = await authService.authenticatedFetch(
  'http://localhost:8000/api/some-endpoint/'
);
const data = await response.json();

// POST request
const response = await authService.authenticatedFetch(
  'http://localhost:8000/api/some-endpoint/',
  {
    method: 'POST',
    body: JSON.stringify({ key: 'value' })
  }
);
```

### 5. Manual Token Refresh

```typescript
try {
  const newAccessToken = await authService.refreshAccessToken();
  console.log('Token refreshed successfully');
} catch (error) {
  console.error('Token refresh failed:', error);
  // User will be logged out automatically
}
```

### 6. Logout

```typescript
authService.logout();
// This clears all tokens and user data from localStorage
```

### 7. Get Tokens Manually

```typescript
const accessToken = authService.getAccessToken();
const refreshToken = authService.getRefreshToken();
```

## API Response Formats

### Login Response
```json
{
  "user": {
    "id": 2,
    "username": "admin",
    "email": "admin@gmail.com",
    "first_name": "",
    "last_name": "",
    "phone": null,
    "created_at": "2026-01-15T22:31:57.060731Z"
  },
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "message": "Login successful"
}
```

### Refresh Token Response
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## Example: Creating a Protected API Service

See `apiService.example.ts` for examples of how to create API service functions that use `authService.authenticatedFetch()`.

```typescript
import { authService } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function getUserProfile() {
  const response = await authService.authenticatedFetch(
    `${BASE_URL}/api/user/profile/`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  
  return await response.json();
}
```

## Error Handling

The service handles errors in the following ways:

1. **Login Failure**: Throws an error with the message from the API
2. **Token Refresh Failure**: Automatically clears all auth data and throws an error
3. **401 Unauthorized**: Automatically attempts to refresh the token and retry the request
4. **Network Errors**: Throws the original error for handling by the caller

## Storage

All authentication data is stored in `localStorage`:
- `access_token`: JWT access token
- `refresh_token`: JWT refresh token
- `user_data`: JSON string of user information

## Security Notes

- Tokens are stored in localStorage (consider using httpOnly cookies for production)
- The service automatically clears tokens if refresh fails
- All authenticated requests include the Authorization header
- Token refresh is automatic and transparent to the caller

## Integration with React Router

You can create a protected route component:

```typescript
import { Navigate } from 'react-router-dom';
import { authService } from './services/authService';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

## Environment Variables

Make sure to set the API base URL in your `.env` file:

```
VITE_API_BASE_URL=http://localhost:8000
```
