import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { Lock, User, Eye, EyeOff, BookOpen } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await auth.login({ username: form.username, password: form.password });
      // Persist token and user profile
      localStorage.setItem('cb_auth_token', data.access_token);
      localStorage.setItem('cb_auth_user', JSON.stringify({
        id:        data.user_id,
        username:  data.username,
        full_name: data.full_name,
        role:      data.role,
      }));
      navigate('/setup');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="btn btn-primary" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="btn btn-primary">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">CubeBook</h1>
          <p className="text-purple-300 text-sm mt-1 font-medium">Accounting Management System</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="btn btn-danger">
              <Lock size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Username */}
            <label className="block">
              <span className="text-sm font-semibold text-slate-300 block mb-1.5">Username</span>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="admin"
                  className="form-control"
                />
              </div>
            </label>

            {/* Password */}
            <label className="block">
              <span className="text-sm font-semibold text-slate-300 block mb-1.5">Password</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="form-control"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="form-control"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-slate-500 text-xs mt-6">
            Default: <span className="text-slate-400 font-mono font-bold">admin / CubeBook@2026</span>
          </p>
        </form>
      </div>
    </div>
  );
}
