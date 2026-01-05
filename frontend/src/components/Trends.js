import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import './Trends.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Trends({ category, brand }) {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (category && brand) {
      fetchTrends();
    }
  }, [category, brand, days]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/tracking/trends`, {
        params: { category, brand, days }
      });
      setTrendData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trends:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading trends...</p>
        </div>
      </div>
    );
  }

  if (!trendData || !trendData.trends || trendData.trends.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <TrendingUp size={24} />
            Historical Trends
          </h3>
        </div>
        <div className="no-data">
          <p>No historical data available yet. Run tracking sessions over time to see trends.</p>
        </div>
      </div>
    );
  }

  // Format data for charts
  const chartData = trendData.trends.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    'Visibility Score': item.visibilityScore,
    'Citation Share': item.citationShare,
    'Mentions': item.totalMentions
  }));

  return (
    <div className="trends-container">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <TrendingUp size={24} />
            Historical Trends - {brand}
          </h3>
          <div className="days-selector">
            <button
              className={`btn ${days === 7 ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setDays(7)}
            >
              7 Days
            </button>
            <button
              className={`btn ${days === 30 ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setDays(30)}
            >
              30 Days
            </button>
            <button
              className={`btn ${days === 90 ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setDays(90)}
            >
              90 Days
            </button>
          </div>
        </div>

        <div className="trends-stats">
          <div className="trend-stat">
            <div className="stat-label">Data Points</div>
            <div className="stat-value">{trendData.trends.length}</div>
          </div>
          <div className="trend-stat">
            <div className="stat-label">Time Period</div>
            <div className="stat-value">{days} Days</div>
          </div>
        </div>

        <div className="chart-container">
          <h4>Visibility Score Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Visibility Score"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>Citation Share Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Citation Share"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>Total Mentions Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Mentions"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Trends;

