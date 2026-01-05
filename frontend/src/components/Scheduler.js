import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, Trash2, Plus, ArrowLeft } from 'lucide-react';
import './Scheduler.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Scheduler() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    brands: '',
    competitors: '',
    mode: 'normal',
    frequency: 'daily',
    time: '09:00'
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${API_URL}/scheduler/schedules`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const brands = formData.brands.split(',').map(b => b.trim()).filter(b => b);
      const competitors = formData.competitors.split(',').map(c => c.trim()).filter(c => c);

      const endpoint = formData.frequency === 'daily'
        ? `${API_URL}/scheduler/schedule/daily`
        : `${API_URL}/scheduler/schedule/weekly`;

      await axios.post(endpoint, {
        category: formData.category,
        brands,
        competitors,
        mode: formData.mode,
        time: formData.time
      });

      setShowForm(false);
      setFormData({
        category: '',
        brands: '',
        competitors: '',
        mode: 'normal',
        frequency: 'daily',
        time: '09:00'
      });
      fetchSchedules();

    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule');
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to cancel this schedule?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/scheduler/schedule/${jobId}`);
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  return (
    <div className="scheduler-container">
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/')}>
              <ArrowLeft size={20} />
            </button>
            <h2 className="card-title">
              <Calendar size={24} />
              Scheduled Tracking
            </h2>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={20} />
            New Schedule
          </button>
        </div>

        {showForm && (
          <div className="schedule-form">
            <h3>Create New Schedule</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., CRM software"
                  required
                />
              </div>

              <div className="input-group">
                <label>Brands</label>
                <input
                  type="text"
                  value={formData.brands}
                  onChange={(e) => setFormData({ ...formData, brands: e.target.value })}
                  placeholder="Comma-separated"
                  required
                />
              </div>

              <div className="input-group">
                <label>Competitors (Optional)</label>
                <input
                  type="text"
                  value={formData.competitors}
                  onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                  placeholder="Comma-separated"
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="schedules-list">
          {schedules.length === 0 ? (
            <div className="no-schedules">
              <Calendar size={48} />
              <p>No scheduled tracking yet</p>
              <p className="hint">Create a schedule to automatically track your brand visibility</p>
            </div>
          ) : (
            schedules.map(schedule => (
              <div key={schedule.id} className="schedule-item">
                <div className="schedule-icon">
                  <Clock size={24} />
                </div>
                <div className="schedule-info">
                  <h4>{schedule.category}</h4>
                  <p>Brands: {schedule.brands.join(', ')}</p>
                  <div className="schedule-meta">
                    <span className="badge badge-primary">{schedule.type}</span>
                    <span>{schedule.cronExpression}</span>
                  </div>
                </div>
                <button
                  className="btn-icon-danger"
                  onClick={() => handleDelete(schedule.id)}
                  title="Delete schedule"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Scheduler;

