# Invalid Token Error - Debug & Fix

## Problem
Getting "Invalid Token" error when trying to schedule a live session.

## Possible Causes

### 1. Token Expired (Most Common)
JWT tokens expire after 15 minutes. If you logged in a while ago, your token is expired.

**Quick Fix**: Logout and login again

### 2. Token Not Being Sent
The token might not be in localStorage or not being sent with the request.

**Check**:
1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage
3. Look for `token` key
4. If missing or empty, logout and login again

### 3. Token Format Issue
Token might be malformed or corrupted.

### 4. JWT_SECRET Mismatch
Backend JWT_SECRET might have changed after you logged in.

---

## Quick Fixes

### Fix 1: Logout and Login Again (90% of cases)
```
1. Click your profile/logout button
2. Login again with your credentials
3. Try scheduling again
```

### Fix 2: Clear Browser Storage
```javascript
// Open browser console (F12) and run:
localStorage.clear();
// Then refresh page and login again
```

### Fix 3: Check Token in Console
```javascript
// Open browser console (F12) and run:
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

// If token is null or undefined, you need to login
```

---

## Permanent Fix - Add Token Refresh

I'll create an improved version that automatically refreshes tokens.

