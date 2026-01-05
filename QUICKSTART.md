# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies (2 minutes)
```bash
cd /Users/siddhantgureja/Desktop/AI-Visibility-Tracker
npm install
cd frontend
npm install
cd ..
```

### Step 2: Configure OpenAI API Key (1 minute)
Create a `.env` file in the root directory:
```bash
touch .env
```

Add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-key-here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Get your API key:** https://platform.openai.com/api-keys

### Step 3: Start Backend (30 seconds)
Open a terminal:
```bash
npm run server
```

You should see:
```
🚀 Server running on port 5000
📊 API Health Check: http://localhost:5000/api/health
```

### Step 4: Start Frontend (30 seconds)
Open another terminal:
```bash
cd frontend
npm start
```

Browser will open automatically at `http://localhost:3000`

### Step 5: Test It Out (1 minute)

1. Enter a category: **"CRM software"**
2. Enter your brands: **"Salesforce, HubSpot, Pipedrive"**
3. Enter competitors: **"Zoho, Monday.com"**
4. Click **"Start Tracking"**

Wait 2-3 minutes for results!

---

## ⚡ One-Command Start (Alternative)

If you have `concurrently` installed:
```bash
npm run dev
```

This starts both backend and frontend together!

---

## 🐛 Troubleshooting

**Can't start server?**
- Make sure port 5000 is free
- Check `.env` file exists with OPENAI_API_KEY

**OpenAI API errors?**
- Verify your API key is valid
- Check you have credits: https://platform.openai.com/usage
- Ensure key has GPT-4 access (or switch to gpt-3.5-turbo in code)

**Frontend won't connect?**
- Backend must be running first
- Check `frontend/.env` has correct API URL

---

## 💰 Cost Estimation

**Per tracking session (10 prompts):**
- GPT-4: ~$0.15-0.30
- GPT-3.5-turbo: ~$0.01-0.02

**To use GPT-3.5 (cheaper/faster):**
Edit `backend/services/aiService.js`:
- Line 16: Change `model: 'gpt-4'` to `model: 'gpt-3.5-turbo'`
- Line 52: Same change

---

## 📱 Features to Try

1. **Normal Mode** - Standard tracking
2. **Competitor Mode** - See results from competitor perspective
3. **Leaderboard** - Compare brand visibility
4. **Prompts Tab** - See all AI responses
5. **Citations Tab** - View context and cited pages

---

## ✅ Expected Results

After tracking completes, you should see:
- ✅ Visibility scores for each brand
- ✅ Brand leaderboard with rankings
- ✅ 10 prompts with AI responses
- ✅ Brand mentions highlighted
- ✅ Citation analysis
- ✅ Beautiful charts and visualizations

---

## 🎯 Next Steps

- Try different categories
- Compare your brand against competitors
- Switch to Competitor Mode to see bias
- Export results (take screenshots for now)

---

**Need help?** Check the full [README.md](./README.md) for detailed documentation.

