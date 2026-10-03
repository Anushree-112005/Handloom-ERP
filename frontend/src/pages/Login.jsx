import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import defaultLogo from '../assets/logo.svg';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(username, password);
      
      // Main ERP Login Rules: Only allow admin users (reject 'user' explicitly)
      if (res.data.user_id.toLowerCase() === 'user') {
        setError('Invalid Username or Password.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        user_id: res.data.user_id,
        user_name: res.data.user_name,
        user_type: res.data.user_type,
        module_permissions: res.data.module_permissions
      }));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade">
        <div className="logo-section">
          <div className="logo-box" style={{ background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 4 }}>
            <img src={defaultLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <h1>HANDLOOM ERP</h1>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-user">USER ID</label>
            <input
              id="login-user"
              className="form-control"
              type="text"
              placeholder="Enter User ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-pass">PASSWORD</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="login-pass"
                className="form-control"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '40px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'color 0.2s',
                }}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}
