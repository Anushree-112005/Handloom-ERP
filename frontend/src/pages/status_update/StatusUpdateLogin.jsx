import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Factory } from 'lucide-react';
import defaultLogo from '../../assets/logo.svg';
import { authAPI } from '../../services/api';

export default function StatusUpdateLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both Username and Password.');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.login(username, password);
      
      // Status Update Login Rules: ONLY allow users with 'status_update' permission
      if (!res.data.module_permissions?.status_update) {
        setError('Access Denied. You do not have permission to access the Status Update module.');
        setLoading(false);
        return;
      }
      
      // If successful, store a separate token specifically for the Status Update module
      localStorage.setItem('status_update_token', res.data.access_token);
      localStorage.setItem('su_user', JSON.stringify({ 
        empId: res.data.user_id, 
        role: res.data.user_type,
        name: res.data.user_name
      }));
      
      navigate('/status-update/dashboard');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.data?.detail === "Invalid credentials") {
        setError('Invalid Username or Password');
      } else if (err.response?.status === 403 || err.response?.data?.detail === "Account disabled") {
        setError('Your account is inactive. Please contact the administrator.');
      } else {
        setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ minHeight: 'calc(100vh - 120px)', borderRadius: '16px' }}>
      <div className="login-card animate-fade">
        <div className="logo-section">
          <div className="logo-box" style={{ background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 4 }}>
            <img src={defaultLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <h1>PRODUCTION FLOOR LOGIN</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
            Status Update Module
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              className="form-control"
              type="text"
              name="username_dummy"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-pass">Password</label>
            <input
              id="login-pass"
              className="form-control"
              type="password"
              name="password_dummy"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
            <LogIn size={18} />
            {loading ? 'Authenticating…' : 'Access Dashboard'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Factory size={16} /> Restricted Production Access Only
        </div>
      </div>
    </div>
  );
}
