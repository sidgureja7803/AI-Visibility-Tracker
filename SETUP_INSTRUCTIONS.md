# Complete Setup Instructions

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 16.x or higher**
   ```bash
   node --version
   # Should show v16.x.x or higher
   ```

2. **npm or yarn**
   ```bash
   npm --version
   # Should show 8.x.x or higher
   ```

3. **OpenAI API Key**
   - Sign up at https://platform.openai.com
   - Create an API key at https://platform.openai.com/api-keys
   - Ensure you have credits available

---

## Installation Steps

### 1. Navigate to Project Directory
```bash
cd /Users/siddhantgureja/Desktop/AI-Visibility-Tracker
```

### 2. Install Backend Dependencies
```bash
npm install
```

This installs:
- express (web server)
- cors (cross-origin requests)
- dotenv (environment variables)
- axios (HTTP client)
- openai (OpenAI SDK)
- nodemon (development)
- concurrently (run multiple commands)

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

This installs:
- react & react-dom (UI framework)
- react-router-dom (routing)
- axios (API calls)
- recharts (charts)
- lucide-react (icons)

### 4. Configure Environment Variables

Create `.env` file in the **root directory**:
```bash
# Mac/Linux
touch .env

# Windows
type nul > .env
```

Add the following content to `.env`:
```env
# REQUIRED: Your OpenAI API Key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Server configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**⚠️ Important:** Replace `sk-your-actual-api-key-here` with your real OpenAI API key!

### 5. Verify Configuration
```bash
# Check .env file exists
cat .env

# Should show your configuration
```

---

## Running the Application

### Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev
```

This command:
- Starts backend on `http://localhost:5000`
- Starts frontend on `http://localhost:3000`
- Opens browser automatically

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

Expected output:
```
🚀 Server running on port 5000
📊 API Health Check: http://localhost:5000/api/health
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Expected output:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
```

---

## Verification

### 1. Check Backend is Running
Visit: http://localhost:5000/api/health

Should return:
```json
{
  "status": "ok",
  "message": "AI Visibility Tracker API is running",
  "timestamp": "2026-01-05T..."
}
```

### 2. Check Frontend is Running
Visit: http://localhost:3000

Should see: Beautiful landing page with "AI Visibility Tracker" title

---

## Configuration Options

### Change OpenAI Model

Edit `backend/services/aiService.js`:

**Line 16 (generatePrompts function):**
```javascript
model: 'gpt-4',  // Change to 'gpt-3.5-turbo' for cheaper/faster
```

**Line 52 (queryWithTracking function):**
```javascript
model: 'gpt-4',  // Change to 'gpt-3.5-turbo' for cheaper/faster
```

### Change Number of Prompts

Edit `backend/controllers/trackingController.js`, line ~58:

```javascript
const prompts = await aiService.generatePrompts(category, 10);
// Change 10 to any number between 5-20
```

### Change Backend Port

Edit `.env`:
```env
PORT=8080  # Change to any available port
```

Also update `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8080/api
```

### Enable CORS for Other Origins

Edit `backend/server.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
```

---

## Project Structure

```
AI-Visibility-Tracker/
├── backend/
│   ├── server.js                  # Express server
│   ├── routes/
│   │   ├── tracking.js            # Tracking routes
│   │   └── prompts.js             # Prompt routes
│   ├── controllers/
│   │   ├── trackingController.js  # Tracking logic
│   │   └── promptController.js    # Prompt logic
│   └── services/
│       └── aiService.js           # OpenAI integration
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js                 # Main app
│       ├── App.css                # Global styles
│       ├── components/
│       │   ├── Setup.js           # Setup page
│       │   ├── Setup.css
│       │   ├── Dashboard.js       # Dashboard page
│       │   └── Dashboard.css
│       ├── index.js
│       └── index.css
├── package.json                   # Backend dependencies
├── .env                           # Environment variables
├── .gitignore
├── README.md                      # Full documentation
├── QUICKSTART.md                  # Quick start guide
└── SETUP_INSTRUCTIONS.md          # This file
```

---

## Common Issues and Solutions

### Issue: "Cannot find module 'express'"
**Solution:** Install backend dependencies:
```bash
npm install
```

### Issue: "OPENAI_API_KEY is not defined"
**Solution:** 
1. Ensure `.env` file exists in root directory
2. Check `OPENAI_API_KEY=...` line is present
3. Restart backend server

### Issue: "Port 5000 is already in use"
**Solution:** Either:
- Kill the process using port 5000
- Or change PORT in `.env` to another port (e.g., 8080)

### Issue: "Network Error" in frontend
**Solution:**
1. Ensure backend is running
2. Check `frontend/.env` has correct API URL
3. Verify CORS is enabled in backend

### Issue: "Insufficient credits" from OpenAI
**Solution:**
- Add credits to your OpenAI account
- Or switch to GPT-3.5-turbo (cheaper)

### Issue: "React app won't start"
**Solution:** 
1. Delete `node_modules` in frontend
2. Delete `package-lock.json`
3. Run `npm install` again

---

## Testing Your Setup

### Test 1: Backend Health Check
```bash
curl http://localhost:5000/api/health
```

Should return JSON with `"status": "ok"`

### Test 2: Generate Prompts
```bash
curl -X POST http://localhost:5000/api/prompts/generate \
  -H "Content-Type: application/json" \
  -d '{"category": "CRM software", "count": 5}'
```

Should return array of 5 prompts

### Test 3: Complete Tracking Flow
1. Open http://localhost:3000
2. Fill in form:
   - Category: "CRM software"
   - Brands: "Salesforce, HubSpot"
   - Competitors: "Zoho"
3. Click "Start Tracking"
4. Wait 2-3 minutes
5. View results dashboard

---

## Development Tips

### Hot Reload
Both backend and frontend support hot reload:
- Backend: Changes auto-reload with nodemon
- Frontend: Changes auto-reload with React hot reload

### View Logs
- Backend logs appear in terminal running `npm run server`
- Frontend logs appear in browser console (F12)

### Debug Mode
Add console.logs in:
- `backend/services/aiService.js` - See AI requests/responses
- `frontend/src/components/Dashboard.js` - See state changes

### API Testing
Use tools like:
- Postman
- Insomnia
- curl
- Browser DevTools Network tab

---

## Production Deployment

### Backend (Heroku Example)
```bash
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your-key
heroku config:set NODE_ENV=production
git push heroku main
```

### Frontend (Vercel Example)
```bash
cd frontend
npm run build
vercel deploy
```

Set environment variable in Vercel:
```
REACT_APP_API_URL=https://your-backend-app.herokuapp.com/api
```

---

## Getting Help

1. **Check logs** - Most errors show useful messages
2. **Review README.md** - Detailed documentation
3. **Check QUICKSTART.md** - Common solutions
4. **API Documentation** - See README.md API section

---

## Next Steps

Once setup is complete:
1. ✅ Test with sample data
2. ✅ Try different categories
3. ✅ Experiment with Competitor Mode
4. ✅ Customize prompts
5. ✅ Adjust styling if needed

---

**Setup complete! You're ready to track AI visibility! 🚀**

