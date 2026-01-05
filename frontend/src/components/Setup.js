import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Target, TrendingUp, Users, Sparkles, Calendar, ArrowLeft } from 'lucide-react';
import './Setup.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Setup({ onSessionCreated }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: '',
    brands: '',
    competitors: '',
    mode: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const brands = formData.brands.split(',').map(b => b.trim()).filter(b => b);
      const competitors = formData.competitors.split(',').map(c => c.trim()).filter(c => c);

      if (brands.length === 0) {
        setError('Please enter at least one brand to track');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/tracking/start`, {
        category: formData.category,
        brands,
        competitors,
        mode: formData.mode
      });

      const { sessionId } = response.data;
      onSessionCreated(sessionId);
      navigate(`/dashboard/${sessionId}`);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start tracking. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-hero">
        <div className="hero-actions-top">
          <Link to="/" className="btn btn-outline">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <Link to="/scheduler" className="btn btn-outline">
            <Calendar size={20} />
            Scheduled Tracking
          </Link>
        </div>
        <div className="hero-icon">
          <Sparkles size={48} />
        </div>
        <h1 className="hero-title">AI Visibility Tracker</h1>
        <p className="hero-subtitle">
          Track how AI models mention your brand across different prompts and categories
        </p>
      </div>

      <div className="setup-card">
        <div className="setup-header">
          <Target size={32} className="header-icon" />
          <div>
            <h2>Configure Your Tracking</h2>
            <p>Set up a new tracking session to monitor brand visibility in AI responses</p>
          </div>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>
              <Target size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., CRM software, project management tools"
              required
            />
            <small>What category of products/services are you tracking?</small>
          </div>

          <div className="input-group">
            <label>
              <TrendingUp size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Your Brands
            </label>
            <textarea
              value={formData.brands}
              onChange={(e) => setFormData({ ...formData, brands: e.target.value })}
              placeholder="e.g., Salesforce, HubSpot, Pipedrive"
              rows="3"
              required
            />
            <small>Enter brand names separated by commas</small>
          </div>

          <div className="input-group">
            <label>
              <Users size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Competitor Brands (Optional)
            </label>
            <textarea
              value={formData.competitors}
              onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
              placeholder="e.g., Zoho, Monday.com, Notion"
              rows="3"
            />
            <small>Track competitors to compare visibility</small>
          </div>

          <div className="input-group">
            <label>Tracking Mode</label>
            <div className="mode-selector">
              <div 
                className={`mode-option ${formData.mode === 'normal' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, mode: 'normal' })}
              >
                <div className="mode-icon">🎯</div>
                <div className="mode-info">
                  <h4>Normal Mode</h4>
                  <p>Standard tracking from neutral perspective</p>
                </div>
              </div>
              <div 
                className={`mode-option ${formData.mode === 'competitor' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, mode: 'competitor' })}
              >
                <div className="mode-icon">🎭</div>
                <div className="mode-info">
                  <h4>Competitor Mode</h4>
                  <p>See results from competitor's perspective</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Start Tracking
              </>
            )}
          </button>
        </form>
      </div>

      <div className="setup-features">
        <div className="feature">
          <div className="feature-icon">📊</div>
          <h3>AI Visibility Score</h3>
          <p>Track how often your brand appears in AI responses</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🏆</div>
          <h3>Leaderboard</h3>
          <p>Compare your visibility against competitors</p>
        </div>
        <div className="feature">
          <div className="feature-icon">💬</div>
          <h3>Prompt Analysis</h3>
          <p>See exactly which prompts mention your brand</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🔗</div>
          <h3>Citation Tracking</h3>
          <p>Discover which pages AI models cite</p>
        </div>
      </div>
    </div>
  );
}

export default Setup;

