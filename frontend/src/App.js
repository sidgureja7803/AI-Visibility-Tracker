import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Setup from './components/Setup';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [sessionId, setSessionId] = useState(null);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={<Setup onSessionCreated={setSessionId} />} 
          />
          <Route 
            path="/dashboard/:sessionId" 
            element={<Dashboard />} 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
