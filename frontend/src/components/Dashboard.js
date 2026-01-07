import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Award, MessageSquare, Link2, ArrowLeft, 
  RefreshCw, Eye, Target, Users, Activity, Calendar 
} from 'lucide-react';
import Trends from './Trends';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function Dashboard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchResults();
    const interval = setInterval(() => {
      if (session?.status === 'processing') {
        fetchResults();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId, session?.status]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API_URL}/tracking/results/${sessionId}`);
      setSession(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch results');
      setLoading(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <h2>Loading results...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  if (session?.status === 'processing') {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="spinner"></div>
          <h2>Processing Your Tracking Session</h2>
          <p>Generating prompts and querying AI models...</p>
          <p className="loading-detail">This may take a few minutes</p>
        </div>
      </div>
    );
  }

  if (!session?.results) {
    return (
      <div className="dashboard-container">
        <div className="error">
          <h2>No Results Available</h2>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  const { results, category, brands, competitors, mode } = session;
  const { brandStats, summary } = results;

  // Prepare data for charts
  const leaderboardData = Object.entries(brandStats)
    .map(([brand, stats]) => ({
      brand,
      visibilityScore: parseFloat(stats.visibilityScore),
      citationShare: parseFloat(stats.citationShare),
      mentions: stats.totalMentions,
      isUserBrand: brands.includes(brand)
    }))
    .sort((a, b) => b.visibilityScore - a.visibilityScore);

  const mentionDistribution = leaderboardData.map(item => ({
    name: item.brand,
    value: item.mentions
  }));

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-nav">
          <div className="dashboard-nav-left">
            <div>
              <h1 className="dashboard-title">AI Visibility Dashboard</h1>
              <div className="dashboard-subtitle">
                {category} {mode === 'competitor' && '🎭 Competitor Mode'}
              </div>
            </div>
          </div>
          <div className="dashboard-nav-right">
            <button className="btn btn-ghost" onClick={() => navigate('/')}>
              <ArrowLeft size={18} />
            Home
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/setup')}>
            New Session
          </button>
            <button className="btn btn-primary" onClick={fetchResults}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
      {/* Key Metrics */}
        <div className="dashboard-summary">
          <div className="summary-card">
            <div className="summary-card-header">
              <div className="summary-card-icon">
                <MessageSquare size={20} />
              </div>
              <div className="summary-card-title">Total Prompts</div>
          </div>
            <div className="summary-card-value">{summary.totalPrompts}</div>
            <div className="summary-card-description">AI queries analyzed</div>
          </div>

          <div className="summary-card">
            <div className="summary-card-header">
              <div className="summary-card-icon">
                <TrendingUp size={20} />
        </div>
              <div className="summary-card-title">Total Mentions</div>
          </div>
            <div className="summary-card-value">{summary.totalMentions}</div>
            <div className="summary-card-description">Brand citations found</div>
          </div>

          <div className="summary-card">
            <div className="summary-card-header">
              <div className="summary-card-icon">
                <Users size={20} />
        </div>
              <div className="summary-card-title">Brands Tracked</div>
          </div>
            <div className="summary-card-value">{summary.brandsTracked}</div>
            <div className="summary-card-description">Your brands</div>
          </div>

          <div className="summary-card">
            <div className="summary-card-header">
              <div className="summary-card-icon">
                <Award size={20} />
        </div>
              <div className="summary-card-title">Competitors</div>
          </div>
            <div className="summary-card-value">{summary.competitorsTracked}</div>
            <div className="summary-card-description">Being monitored</div>
        </div>
      </div>

      {/* Tabs */}
        <div className="dashboard-tabs">
        <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Eye size={18} />
          Overview
        </button>
        <button 
            className={`tab-button ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          <MessageSquare size={18} />
          Prompts
        </button>
        <button 
            className={`tab-button ${activeTab === 'citations' ? 'active' : ''}`}
          onClick={() => setActiveTab('citations')}
        >
          <Link2 size={18} />
          Citations
        </button>
        <button 
            className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <Activity size={18} />
          Trends
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Leaderboard */}
            <div className="leaderboard">
              <div className="leaderboard-header">
                <div className="leaderboard-icon">
                  <Award size={24} />
                </div>
                <h2 className="leaderboard-title">Brand Leaderboard</h2>
              </div>
              <div className="leaderboard-items">
              {leaderboardData.map((item, index) => (
                  <div key={item.brand} className="leaderboard-item">
                    <div className="leaderboard-rank">#{index + 1}</div>
                    <div className="leaderboard-item-info">
                      <div className="leaderboard-brand">
                      {item.brand}
                      {item.isUserBrand && (
                        <span className="badge badge-primary">Your Brand</span>
                      )}
                    </div>
                    <div className="brand-stats">
                      <span>Visibility: {item.visibilityScore}%</span>
                      <span>•</span>
                      <span>Citation Share: {item.citationShare}%</span>
                      <span>•</span>
                      <span>{item.mentions} mentions</span>
                    </div>
                  </div>
                  <div className="score-bar">
                    <div 
                      className="score-fill"
                      style={{ width: `${item.visibilityScore}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3 className="chart-card-title">
                    <div className="chart-card-icon">
                      <TrendingUp size={20} />
                    </div>
                    Visibility Comparison
                  </h3>
              </div>
                <div className="chart-card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaderboardData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visibilityScore" fill="#6366f1" name="Visibility Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
              </div>

              <div className="chart-card">
                <div className="chart-card-header">
                  <h3 className="chart-card-title">
                    <div className="chart-card-icon">
                      <Award size={20} />
                    </div>
                    Mention Distribution
                  </h3>
                </div>
                <div className="chart-card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mentionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mentionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prompts' && (
        <PromptsView results={results} brands={brands} />
      )}

      {activeTab === 'citations' && (
        <CitationsView brandStats={brandStats} brands={brands} />
      )}

      {activeTab === 'trends' && (
        <div className="tab-content">
          {brands.map(brand => (
            <Trends key={brand} category={category} brand={brand} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function PromptsView({ results, brands }) {
  const [filter, setFilter] = useState('all');
  const { promptResults } = results;

  const filteredPrompts = promptResults.filter(result => {
    if (filter === 'mentioned') {
      return result.mentions.some(m => brands.includes(m.brand));
    }
    if (filter === 'missing') {
      return !result.mentions.some(m => brands.includes(m.brand));
    }
    return true;
  });

  return (
    <div className="tab-content">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <MessageSquare size={24} />
            All Prompts & Responses
          </h2>
          <div className="filter-buttons">
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter('all')}
            >
              All ({promptResults.length})
            </button>
            <button 
              className={`btn ${filter === 'mentioned' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter('mentioned')}
            >
              Mentioned
            </button>
            <button 
              className={`btn ${filter === 'missing' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter('missing')}
            >
              Missing
            </button>
          </div>
        </div>

        <div className="prompts-list">
          {filteredPrompts.map((result, index) => (
            <div key={index} className="prompt-item">
              <div className="prompt-header">
                <h4>{result.prompt}</h4>
                <div className="prompt-badges">
                  {result.mentions.length > 0 ? (
                    <span className="badge badge-success">
                      {result.mentions.length} mention(s)
                    </span>
                  ) : (
                    <span className="badge badge-danger">
                      No mentions
                    </span>
                  )}
                </div>
              </div>
              
              <div className="prompt-answer">
                <strong>AI Response:</strong>
                <p>{result.answer}</p>
              </div>

              {result.mentions.length > 0 && (
                <div className="mentions-list">
                  <strong>Brands Mentioned:</strong>
                  {result.mentions.map((mention, idx) => (
                    <div key={idx} className="mention-item">
                      <span className="mention-brand">
                        {mention.brand}
                        {brands.includes(mention.brand) && (
                          <span className="badge badge-primary">Yours</span>
                        )}
                      </span>
                      <span className="mention-count">{mention.count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CitationsView({ brandStats, brands }) {
  return (
    <div className="tab-content">
      {Object.entries(brandStats).map(([brand, stats]) => (
        <div key={brand} className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Link2 size={24} />
              {brand}
              {brands.includes(brand) && (
                <span className="badge badge-primary">Your Brand</span>
              )}
            </h3>
            <div>
              <span className="badge badge-success">
                {stats.citedPages.length} citation(s)
              </span>
            </div>
          </div>

          <div className="citations-grid">
            <div className="citation-stat">
              <div className="stat-label">Visibility Score</div>
              <div className="stat-value">{stats.visibilityScore}%</div>
            </div>
            <div className="citation-stat">
              <div className="stat-label">Citation Share</div>
              <div className="stat-value">{stats.citationShare}%</div>
            </div>
            <div className="citation-stat">
              <div className="stat-label">Total Mentions</div>
              <div className="stat-value">{stats.totalMentions}</div>
            </div>
            <div className="citation-stat">
              <div className="stat-label">Prompts Mentioned</div>
              <div className="stat-value">{stats.mentionedInPrompts.length}</div>
            </div>
          </div>

          {stats.citedPages.length > 0 && (
            <div className="cited-pages">
              <h4>Top Cited Pages:</h4>
              <ul>
                {stats.citedPages.slice(0, 5).map((page, idx) => (
                  <li key={idx}>
                    <Link2 size={16} />
                    {page}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.contexts.length > 0 && (
            <div className="contexts">
              <h4>Example Contexts:</h4>
              {stats.contexts.slice(0, 3).map((context, idx) => (
                <div key={idx} className="context-item">
                  "{context}"
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Dashboard;

