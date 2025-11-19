# 🔍 Debug Guide - Report Not Showing Values

## ✅ Current Status

**Backend:** Running on http://localhost:5000 ✅
**Frontend:** Running on http://localhost:5173 ✅
**Both servers restarted with latest code** ✅

---

## 🧪 Step-by-Step Testing

### Step 1: Check if You're Logged In

1. Open browser: **http://localhost:5173**
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Type this and press Enter:

```javascript
localStorage.getItem('token')
```

**Expected Result:** Should show a long JWT token string
**If NULL:** You need to login first!

---

### Step 2: Manual Login (if needed)

If you don't have a token, you need to login. For the user `691e068b0c4975c081cec5eb`:

**Option A: Use the login page**
- Go to login page
- Enter the email associated with this user
- The token will be stored automatically

**Option B: Manual token creation (temporary testing)**
In the browser console, run:

```javascript
// This is just for testing - create a simple token
const testUserId = '691e068b0c4975c081cec5eb';
const testToken = btoa(JSON.stringify({ userId: testUserId, id: testUserId }));
localStorage.setItem('token', testToken);
console.log('✅ Test token set!');
```

---

### Step 3: Test the API Directly

Open this test page I created for you:
**file:///C:/main/hackathon-project-master/test-api.html**

1. Open the file in your browser
2. The user ID should already be filled: `691e068b0c4975c081cec5eb`
3. Click "Get from localStorage" to load your token
4. Click "Test API Call"

**What to look for:**
- ✅ Status 200 = SUCCESS
- ❌ Status 400 = No token or invalid token
- ❌ Status 404 = User not found or no data

---

### Step 4: Navigate to Report Page

1. Make sure you're logged in (token exists)
2. Go to: **http://localhost:5173** (or wherever your app navigates to Report)
3. Open **Developer Tools (F12)** → **Console** tab

**Look for these log messages:**

```
🔑 Token check: Token found
📡 Fetching from: http://localhost:5000/api/auth/adhd-analysis
📥 Response status: 200 OK
📦 Received data: { userId, generatedAt, ... }
🎮 Latest game metrics: { cognitivePerformance, finalAttention, ... }
✅ Loaded ALL metrics from adhdAnalysisReport: { ... }
📊 Zone: Good | Score: 61
```

---

## ❌ Common Issues & Solutions

### Issue 1: "No token found"
**Symptom:** Console shows `❌ No token found, using default scores`
**Solution:** 
- Login to the app first
- Or use the manual token method above
- Check if token is in localStorage

### Issue 2: "Failed to fetch" / CORS Error
**Symptom:** `Error fetching ADHD analysis: TypeError: Failed to fetch`
**Solution:**
- Make sure backend is running on port 5000
- Check if CORS is enabled in server.js
- Try accessing http://localhost:5000 directly to verify it's running

### Issue 3: "Status 404" - No data found
**Symptom:** `❌ Failed to fetch ADHD analysis: 404`
**Solution:**
- The user might not have `adhdAnalysisReport` field in their document
- Check MongoDB directly to verify the data structure
- User ID might be wrong

### Issue 4: "Status 400" - Bad request
**Symptom:** `❌ Failed to fetch ADHD analysis: 400`
**Solution:**
- Token is invalid or malformed
- Token doesn't contain userId
- Try logging in again to get a fresh token

### Issue 5: Values still showing 40/40/40
**Symptom:** All metrics show default value of 40
**Solution:**
- API call failed (check console for errors)
- `gamesAnalyzed` array is empty
- Metrics object doesn't have the required fields

---

## 🔧 Backend Debugging

If you need to debug the backend, check these files:

### 1. Check Backend Console

Look at the terminal where you ran `node server.js`:

**Expected logs when API is called:**
```
✅ Found adhdAnalysisReport in User document for: 691e068b0c4975c081cec5eb
```

**OR**

```
✅ ADHD Analysis fetched from collection for user: 691e068b0c4975c081cec5eb | cognitivePerformance: 61.08
```

### 2. Test Backend Route Directly

Use this curl command (or Postman):

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:5000/api/auth/adhd-analysis
```

Replace `YOUR_TOKEN_HERE` with your actual JWT token from localStorage.

---

## 📊 Expected Data for User 691e068b0c4975c081cec5eb

When working correctly, you should see these values on the Report Page:

| Metric | Value |
|--------|-------|
| Cognitive Performance | 61 |
| Attention | 57 |
| Motor Control | 66 |
| Cognitive Load | 58 |
| Behavioral Stability | 60 |
| NeuroBalance | 68 |

**Zone:** Zone 13 - "Good" Performance
**Color:** Green theme

---

## 🚀 Quick Fix Checklist

Run through these in order:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] User is logged in (token in localStorage)
- [ ] Token is valid JWT
- [ ] Open Report Page
- [ ] Check console for logs
- [ ] If errors, check error messages
- [ ] If 404, verify user has adhdAnalysisReport data
- [ ] If 40/40/40, check API response in Network tab

---

## 📞 Still Not Working?

If you've tried all of the above and it's still not working, check:

1. **Network Tab in DevTools:**
   - Go to Network tab
   - Reload Report Page
   - Look for request to `/api/auth/adhd-analysis`
   - Click on it to see Request Headers and Response

2. **Backend Logs:**
   - Look at the terminal running `node server.js`
   - Check for any error messages
   - Look for the "✅ Found adhdAnalysisReport" message

3. **MongoDB Document:**
   - Verify the user document has `adhdAnalysisReport` field
   - Verify `gamesAnalyzed` array has at least 1 item
   - Verify metrics object has all required fields

---

## 🎯 What You Should See Now

With the new debugging logs, your console will be VERY verbose and tell you exactly what's happening at each step. Look for:

- 🔑 = Token check
- 📡 = API request
- 📥 = Response received
- 📦 = Data received
- 🎮 = Metrics extracted
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning
- 💡 = Helpful tip

Follow the emoji trail to find where things are failing!
