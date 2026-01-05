import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Award, MessageSquare, Link2, 
  Eye, Calendar, Activity, Sparkles, 
  ArrowRight, CheckCircle, Zap 
} from 'lucide-react';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Eye size={32} />,
      title: 'AI Visibility Score',
      description: 'Track how often your brand appears in AI search results across multiple prompts'
    },
    {
      icon: <Award size={32} />,
      title: 'Competitive Analysis',
      description: 'Compare your visibility against competitors with detailed leaderboards'
    },
    {
      icon: <MessageSquare size={32} />,
      title: 'Prompt Analysis',
      description: 'See exactly which prompts mention your brand and which ones miss you'
    },
    {
      icon: <Link2 size={32} />,
      title: 'Citation Tracking',
      description: 'Discover which pages AI models cite when mentioning your brand'
    },
    {
      icon: <Activity size={32} />,
      title: 'Historical Trends',
      description: 'Track visibility changes over time with 7/30/90-day trend analysis'
    },
    {
      icon: <Calendar size={32} />,
      title: 'Automated Tracking',
      description: 'Schedule daily or weekly tracking to monitor your brand automatically'
    }
  ];

  const stats = [
    { value: '10+', label: 'AI Prompts Generated' },
    { value: '100%', label: 'Automated Analysis' },
    { value: '90 Days', label: 'Historical Data' },
    { value: 'Real-time', label: 'Updates' }
  ];

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>

        <nav className="landing-nav">
          <div className="nav-logo">
            <img 
              src="/assets/logo.png" 
              alt="WriteSonic" 
              className="writesonic-logo"
            />
            <span className="nav-divider">×</span>
            <span className="nav-title">AI Visibility Tracker</span>
          </div>
          <button className="nav-cta" onClick={() => navigate('/setup')}>
            Get Started
            <ArrowRight size={20} />
          </button>
        </nav>

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Powered by WriteSonic & OpenAI GPT-4</span>
          </div>

          <h1 className="hero-title">
            Track Your Brand's
            <span className="gradient-text"> AI Visibility</span>
          </h1>

          <p className="hero-subtitle">
            Monitor how AI models like ChatGPT mention your brand. Get actionable insights 
            on your visibility in AI-powered search results and stay ahead of the competition.
          </p>

          <div className="hero-actions">
            <button className="btn-primary-large" onClick={() => navigate('/setup')}>
              <Zap size={24} />
              Try Demo
              <ArrowRight size={20} />
            </button>
            <button className="btn-secondary-large" onClick={() => navigate('/scheduler')}>
              <Calendar size={24} />
              Schedule Tracking
            </button>
          </div>

          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Win in AI Search</h2>
          <p className="section-subtitle">
            Comprehensive tools to track, analyze, and improve your brand's visibility in AI-powered search
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Simple, powerful, and automated</p>
        </div>

        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Configure Your Tracking</h3>
              <p>Enter your category, brands, and competitors. Choose between normal or competitor impersonation mode.</p>
            </div>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI Analysis</h3>
              <p>Our system generates relevant prompts and queries GPT-4 to analyze brand mentions across responses.</p>
            </div>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get Insights</h3>
              <p>View comprehensive dashboards with visibility scores, leaderboards, trends, and actionable insights.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <div className="benefits-content">
          <h2 className="section-title">Why AI Visibility Matters</h2>
          <div className="benefits-list">
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <div>
                <h4>Stay Ahead of Competition</h4>
                <p>Know exactly how your competitors are mentioned in AI responses</p>
              </div>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <div>
                <h4>Optimize Your Content</h4>
                <p>Understand which contexts and prompts your brand appears in</p>
              </div>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <div>
                <h4>Track Your Progress</h4>
                <p>Monitor visibility trends over time with historical data</p>
              </div>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <div>
                <h4>Automate Monitoring</h4>
                <p>Set up scheduled tracking to get regular visibility reports</p>
              </div>
            </div>
          </div>
        </div>

        <div className="benefits-visual">
          <div className="visual-card">
            <div className="visual-header">
              <TrendingUp size={24} />
              <span>Your Brand Visibility</span>
            </div>
            <div className="visual-chart">
              <div className="chart-bar" style={{ height: '60%', background: '#6366f1' }}>
                <span className="bar-label">You</span>
              </div>
              <div className="chart-bar" style={{ height: '85%', background: '#8b5cf6' }}>
                <span className="bar-label">Top Competitor</span>
              </div>
              <div className="chart-bar" style={{ height: '45%', background: '#ec4899' }}>
                <span className="bar-label">Competitor 2</span>
              </div>
              <div className="chart-bar" style={{ height: '30%', background: '#f59e0b' }}>
                <span className="bar-label">Competitor 3</span>
              </div>
            </div>
            <div className="visual-footer">
              Track your position vs competitors
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Track Your AI Visibility?</h2>
          <p className="cta-subtitle">
            Start monitoring how AI models mention your brand. Get insights in minutes.
          </p>
          <div className="cta-buttons">
            <button className="btn-cta-primary" onClick={() => navigate('/setup')}>
              <Sparkles size={24} />
              Start Free Demo
              <ArrowRight size={20} />
            </button>
          </div>
          <p className="cta-note">
            No credit card required • Powered by OpenAI GPT-4
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-left">
            <img 
              src="/assets/logo.png" 
              alt="WriteSonic" 
              className="footer-logo"
            />
            <p className="footer-text">AI Visibility Tracker by WriteSonic</p>
          </div>
          <div className="footer-right">
            <p className="footer-credit">Built for the WriteSonic Engineering Challenge</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;

