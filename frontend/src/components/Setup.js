import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Target, TrendingUp, Users, Sparkles, Calendar, ArrowLeft, Check } from 'lucide-react';
import './Setup.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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
      {/* Navigation Header */}
      <div className="setup-header-nav">
        <div className="setup-nav-content">
          <div className="setup-nav-left">
            <Link to="/" className="setup-nav-logo">
              <img 
                src="/assets/logo.png" 
                alt="WriteSonic" 
                className="setup-logo-img"
              />
              <span className="setup-nav-divider">×</span>
              <span className="setup-nav-title">AI Visibility Tracker</span>
            </Link>
          </div>
          <div className="setup-nav-right">
            <Link to="/" className="btn btn-ghost">
              <ArrowLeft size={18} />
              Back to Home
            </Link>
            <Link to="/scheduler" className="btn btn-outline">
              <Calendar size={18} />
              Scheduled Tracking
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="setup-main">
        {/* Hero */}
        <div className="setup-hero">
          <div className="setup-hero-badge">
            <Sparkles size={14} />
            <span>AI-Powered Brand Tracking</span>
          </div>
          <h1 className="setup-hero-title">
            Configure Your Tracking
          </h1>
          <p className="setup-hero-subtitle">
            Set up a new tracking session to monitor how AI models mention your brand 
            across different prompts and categories
          </p>
        </div>

        {/* Form Card */}
        <div className="setup-card">
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="setup-form">
            <div className="input-group">
              <label>
                <Target size={18} />
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
                <TrendingUp size={18} />
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
                <Users size={18} />
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
                  <div className="mode-option-header">
                    <span className="mode-icon">🎯</span>
                    <span className="mode-option-title">Normal Mode</span>
                  </div>
                  <p className="mode-option-description">
                    Standard tracking from neutral perspective
                  </p>
                  <div className="mode-check">
                    <Check size={14} />
                  </div>
                </div>

                <div 
                  className={`mode-option ${formData.mode === 'competitor' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, mode: 'competitor' })}
                >
                  <div className="mode-option-header">
                    <span className="mode-icon">🎭</span>
                    <span className="mode-option-title">Competitor Mode</span>
                  </div>
                  <p className="mode-option-description">
                    See results from competitor's perspective
                  </p>
                  <div className="mode-check">
                    <Check size={14} />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-button"
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

        {/* Footer Info */}
        <div className="setup-footer">
          <div className="setup-footer-card">
            <p className="setup-footer-text">
              After tracking completes, you'll see detailed metrics including visibility scores, 
              competitive analysis, prompt breakdowns, and citation tracking—all in one comprehensive dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup;
