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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            Home
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/setup')}>
            New Session
          </button>
        </div>
        <div className="header-info">
          <h1>AI Visibility Dashboard</h1>
          <div className="header-meta">
            <span className="meta-item">
              <Target size={16} />
              {category}
            </span>
            {mode === 'competitor' && (
              <span className="badge badge-warning">
                🎭 Competitor Mode
              </span>
            )}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={fetchResults}>
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#dbeafe' }}>
            <MessageSquare size={24} color="#1e3a8a" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Prompts</div>
            <div className="metric-value">{summary.totalPrompts}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fef3c7' }}>
            <TrendingUp size={24} color="#92400e" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Mentions</div>
            <div className="metric-value">{summary.totalMentions}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#d1fae5' }}>
            <Users size={24} color="#065f46" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Brands Tracked</div>
            <div className="metric-value">{summary.brandsTracked}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fce7f3' }}>
            <Award size={24} color="#831843" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Competitors</div>
            <div className="metric-value">{summary.competitorsTracked}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Eye size={18} />
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          <MessageSquare size={18} />
          Prompts
        </button>
        <button 
          className={`tab ${activeTab === 'citations' ? 'active' : ''}`}
          onClick={() => setActiveTab('citations')}
        >
          <Link2 size={18} />
          Citations
        </button>
        <button 
          className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
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
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Award size={24} />
                Brand Leaderboard
              </h2>
            </div>
            <div className="leaderboard">
              {leaderboardData.map((item, index) => (
                <div 
                  key={item.brand} 
                  className={`leaderboard-item ${item.isUserBrand ? 'highlight' : ''}`}
                >
                  <div className="rank">#{index + 1}</div>
                  <div className="brand-info">
                    <div className="brand-name">
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
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Visibility Comparison</h3>
              </div>
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

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Mention Distribution</h3>
              </div>
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

