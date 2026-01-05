# AI Visibility Tracker

> **Track your brand's visibility in AI search results**

A comprehensive tool to monitor how AI models like ChatGPT mention your brand across different prompts and categories. Built for the WriteSonic Engineering Challenge.

![AI Visibility Tracker](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-purple)

---

## 🎯 Features

### Core Features
- ✅ **Category-Based Tracking** - Track brand mentions in any product/service category
- ✅ **Multi-Brand Analysis** - Track your brand and competitors simultaneously
- ✅ **AI Prompt Generation** - Automatically generates relevant prompts for your category
- ✅ **Real-time Tracking** - Query AI models and track brand mentions in real-time
- ✅ **Comprehensive Dashboard** - Beautiful, modern UI with detailed metrics

### Dashboard Metrics
- 📊 **AI Visibility Score** - Percentage of prompts where your brand appears
- 📈 **Citation Share** - Your share of total brand mentions
- 🏆 **Brand Leaderboard** - Compare your visibility against competitors
- 💬 **Prompt Analysis** - See exactly which prompts mention your brand
- 🔗 **Citation Tracking** - Discover which pages AI models reference

### Bonus Features
- 🎭 **Competitor Impersonation Mode** - See results from a competitor's perspective
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - Dashboard updates as tracking progresses
- 🎨 **Modern UI** - Beautiful, intuitive interface with smooth animations

### 🚀 Production Features (NEW!)
- ⚙️ **Queue-Based Execution** - Bull + Redis for scalable async processing
- 📅 **Daily Scheduled Tracking** - Automated tracking with cron jobs
- 📊 **Historical Trends** - Track visibility changes over time (7/30/90 days)
- 💾 **Persistent Storage** - LowDB for session and historical data
- 🔄 **Background Workers** - Process jobs independently with retry logic
- 📈 **Trend Analysis** - Visualize visibility trends with charts

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- npm or yarn
- OpenAI API key
- Redis (optional, but recommended for production)

### Installation

1. **Clone the repository**
```bash
cd AI-Visibility-Tracker
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Configure environment variables**
```bash
# Create .env file in root directory
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Optional: Redis for production queue
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**Note:** Redis is optional. Without it, the queue uses in-memory storage (fine for development).

4. **Start the application**

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

Or run both together:
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

---

## 📖 How to Use

### Quick Options

1. **One-Time Tracking** - Run immediate tracking session
2. **Scheduled Tracking** - Set up automated daily/weekly tracking
3. **View Trends** - Analyze historical visibility data

---

### Step 1: Setup Your Tracking

1. Navigate to `http://localhost:3000`
2. Enter your **category** (e.g., "CRM software", "project management tools")
3. Enter **your brands** to track (comma-separated)
4. Optionally add **competitor brands** for comparison
5. Choose tracking mode:
   - **Normal Mode**: Standard tracking from neutral perspective
   - **Competitor Mode**: See results as if you were the competitor

### Step 2: Start Tracking

Click **"Start Tracking"** - the system will:
1. Generate 10 relevant prompts for your category
2. Query AI models with each prompt
3. Analyze brand mentions in responses
4. Calculate visibility and citation metrics

This process takes 2-3 minutes.

### Step 3: View Results

The dashboard shows:

**Overview Tab:**
- Key metrics (total prompts, mentions, visibility scores)
- Brand leaderboard comparing all tracked brands
- Visual charts showing visibility and mention distribution

**Prompts Tab:**
- All prompts tested
- AI responses for each prompt
- Which brands were mentioned in each response
- Filter by: All / Mentioned / Missing

**Citations Tab:**
- Detailed breakdown for each brand
- Visibility score and citation share
- Top cited pages
- Example contexts where brand was mentioned

**Trends Tab (NEW!):**
- Historical visibility trends over 7/30/90 days
- Line charts showing score changes
- Citation share evolution
- Mention frequency tracking

### Step 4: Schedule Automated Tracking (Optional)

1. Click **"Scheduled Tracking"** on homepage
2. Create a new schedule:
   - Choose daily or weekly frequency
   - Set time (e.g., 9:00 AM)
   - Configure brands to track
3. View and manage all schedules
4. Data accumulates automatically for trend analysis

---

## 🏗️ Architecture

### Backend (Node.js + Express)

```
backend/
├── server.js              # Express server setup
├── routes/
│   ├── tracking.js        # Tracking session endpoints
│   └── prompts.js         # Prompt generation endpoints
├── controllers/
│   ├── trackingController.js  # Tracking logic
│   └── promptController.js    # Prompt logic
└── services/
    └── aiService.js       # OpenAI integration
```

**Key Endpoints:**
- `POST /api/tracking/start` - Start new tracking session
- `GET /api/tracking/results/:sessionId` - Get session results
- `GET /api/tracking/trends` - Get historical trend data
- `POST /api/scheduler/schedule/daily` - Schedule daily tracking
- `POST /api/scheduler/schedule/weekly` - Schedule weekly tracking
- `GET /api/scheduler/schedules` - Get all schedules
- `POST /api/prompts/generate` - Generate category prompts
- `POST /api/prompts/query` - Query AI with tracking

### Frontend (React)

```
frontend/
├── src/
│   ├── App.js             # Main app component
│   ├── components/
│   │   ├── Setup.js       # Setup/configuration page
│   │   ├── Dashboard.js   # Results dashboard
│   │   ├── Setup.css
│   │   └── Dashboard.css
│   └── App.css            # Global styles
└── public/
```

**Key Components:**
- `Setup` - Initial configuration form
- `Dashboard` - Results visualization with tabs
- `PromptsView` - Prompt analysis view
- `CitationsView` - Citation details view
- `Trends` - Historical trend charts (NEW!)
- `Scheduler` - Schedule management UI (NEW!)

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
OPENAI_API_KEY=sk-...       # Your OpenAI API key (required)
PORT=5000                    # Backend port
NODE_ENV=development         # development | production
FRONTEND_URL=http://localhost:3000  # Frontend URL for CORS
```

**Frontend (frontend/.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Queue & Scheduler Configuration

**Redis (Production):**
```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis  # Ubuntu

# Start Redis
redis-server

# Or use Redis Cloud
REDIS_HOST=your-redis-cloud-host
REDIS_PORT=6379
```

**Without Redis:** System works with in-memory queue (development only).

### OpenAI Configuration

The app uses GPT-4 by default. To change the model, edit `backend/services/aiService.js`:

```javascript
// Line 16 and Line 52
model: 'gpt-4',  // Change to 'gpt-3.5-turbo' for faster/cheaper queries
```

**Cost Estimation:**
- Using GPT-4: ~$0.15-0.30 per tracking session (10 prompts)
- Using GPT-3.5-turbo: ~$0.01-0.02 per tracking session

---

## 🎨 UI/UX Highlights

### Design Principles
- **Modern & Clean** - Gradient backgrounds, card-based layouts, smooth animations
- **Intuitive** - Clear visual hierarchy, contextual help text
- **Responsive** - Mobile-first design, works on all screen sizes
- **Accessible** - High contrast, clear typography, semantic HTML

### Key Features
- Animated loading states
- Real-time progress updates
- Color-coded badges and metrics
- Interactive charts (Recharts)
- Smooth transitions between views
- Hover effects and micro-interactions

---

## 📊 Metrics Explained

### Visibility Score
Percentage of prompts where your brand was mentioned.
```
Visibility Score = (Prompts with Brand / Total Prompts) × 100
```

### Citation Share
Your share of total brand mentions across all tracked brands.
```
Citation Share = (Your Mentions / Total Mentions) × 100
```

### Total Mentions
Number of times your brand was mentioned across all responses.

---

## 🧪 Testing

### Manual Testing Checklist

**Setup Page:**
- [ ] Enter category and brands
- [ ] Add competitors
- [ ] Switch between Normal/Competitor mode
- [ ] Submit form

**Dashboard:**
- [ ] View key metrics
- [ ] Check leaderboard ranking
- [ ] View charts and visualizations
- [ ] Switch between tabs
- [ ] Filter prompts (All/Mentioned/Missing)
- [ ] View citation details

**Edge Cases:**
- [ ] No API key configured
- [ ] Invalid category
- [ ] Single brand tracking
- [ ] No competitors
- [ ] Large number of brands (10+)

### Example Test Scenario

```javascript
// Test Input
Category: "CRM software"
Brands: "Salesforce, HubSpot, Pipedrive"
Competitors: "Zoho, Monday.com"
Mode: "Normal"

// Expected Output
- 10 prompts generated
- All brands tracked
- Visibility scores calculated
- Leaderboard displayed
- Citations extracted
```

---

## 🚀 Deployment

### Backend Deployment (Heroku, Railway, etc.)

1. Set environment variables:
```bash
OPENAI_API_KEY=your_key
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

2. Deploy:
```bash
git push heroku main
```

### Frontend Deployment (Vercel, Netlify, etc.)

1. Build the app:
```bash
cd frontend
npm run build
```

2. Set environment variable:
```
REACT_APP_API_URL=https://your-backend-domain.com/api
```

3. Deploy the `frontend/build` directory

---

## 🔍 Troubleshooting

### Common Issues

**"Failed to start tracking"**
- Check if backend is running on `http://localhost:5000`
- Verify OpenAI API key is set in `.env`
- Check API key has sufficient credits

**"CORS Error"**
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check CORS configuration in `backend/server.js`

**Slow performance**
- Using GPT-4 is slower but more accurate
- Switch to GPT-3.5-turbo for faster responses
- Reduce number of prompts (edit `generatePrompts` count)

**No brand mentions**
- Try more specific categories
- Use well-known brand names
- Check if brands are spelled correctly

### Debug Mode

Enable detailed logging:
```javascript
// backend/services/aiService.js
console.log('Prompt:', prompt);
console.log('Response:', response);
```

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **OpenAI API** - AI model integration
- **Axios** - HTTP client
- **dotenv** - Environment management

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Axios** - API client

### Development
- **create-react-app** - React bootstrapping
- **nodemon** - Backend hot reload
- **concurrently** - Run multiple commands

---

## 📝 API Documentation

### Start Tracking
```http
POST /api/tracking/start
Content-Type: application/json

{
  "category": "CRM software",
  "brands": ["Salesforce", "HubSpot"],
  "competitors": ["Zoho"],
  "mode": "normal"
}

Response:
{
  "sessionId": "uuid",
  "message": "Tracking started",
  "status": "processing"
}
```

### Get Results
```http
GET /api/tracking/results/:sessionId

Response:
{
  "id": "uuid",
  "category": "CRM software",
  "brands": [...],
  "status": "completed",
  "results": {
    "brandStats": {...},
    "summary": {...},
    "promptResults": [...]
  }
}
```

### Generate Prompts
```http
POST /api/prompts/generate
Content-Type: application/json

{
  "category": "CRM software",
  "count": 10
}

Response:
{
  "category": "CRM software",
  "prompts": [...],
  "count": 10
}
```

---

## 🎯 Challenge Requirements

### ✅ Completed Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Takes a category | ✅ | Setup form |
| Takes list of brands | ✅ | Setup form |
| Queries AI model | ✅ | OpenAI GPT-4 integration |
| Shows brand mentions | ✅ | Dashboard prompts tab |
| Shows context | ✅ | Context extraction in citations |
| Key metrics dashboard | ✅ | Visibility, citation share, counts |
| Leaderboard | ✅ | Sortable brand comparison |
| List of prompts | ✅ | Prompts tab with filtering |
| Top cited pages | ✅ | Citations tab |
| Competitor mode | ✅ | Mode selector in setup |
| Modern UI | ✅ | Gradient design, animations |
| Production ready | ✅ | Error handling, loading states |
| **Queue-based execution** | ✅ | Bull + Redis async processing |
| **Daily scheduling** | ✅ | Cron-based automation |
| **Historical trends** | ✅ | 90-day trend tracking |
| **Background workers** | ✅ | Scalable job processing |

---

## 🎓 Learning Resources

To understand AI search visibility better, check out:
- [WriteSonic AI Search Documentation](https://docs.writesonic.com/docs/ai-search-visibility)
- [Understanding RAG](https://www.anthropic.com/index/retrieval-augmented-generation)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

## 👤 Author

Built for the WriteSonic AI Visibility Tracker Engineering Challenge

**Challenge Timeline:** 3-4 hours  
**Deadline:** 5th Jan 11:59 PM IST

---

## 🙏 Acknowledgments

- WriteSonic for the engineering challenge
- OpenAI for GPT-4 API
- React and Node.js communities

---

## 📧 Support

If you have questions or issues:
1. Check the Troubleshooting section above
2. Review the API documentation
3. Check backend logs for errors
4. Verify environment variables are set correctly

---

## 🚀 Production Features Included

Already implemented:
- ✅ Queue-based execution (Bull + Redis)
- ✅ Background workers with retry logic
- ✅ Historical tracking over time (90 days)
- ✅ Scheduled tracking (daily/weekly)
- ✅ Persistent data storage (LowDB)
- ✅ Trend analysis with charts
- ✅ Job monitoring and progress tracking

## 🎯 Future Enhancements

Potential improvements for v3:
- [ ] Database migration (MongoDB/PostgreSQL)
- [ ] User authentication & multi-tenancy
- [ ] Export reports (PDF/CSV)
- [ ] Multiple AI model support (Claude, Gemini, Perplexity)
- [ ] Webhook notifications
- [ ] Email alerts for visibility changes
- [ ] Team collaboration features
- [ ] Custom prompt templates
- [ ] Advanced filtering and search
- [ ] API rate limiting and quotas
- [ ] Dedicated worker processes
- [ ] Bull dashboard for queue monitoring

---

**Built with ❤️ for the WriteSonic Engineering Challenge**

