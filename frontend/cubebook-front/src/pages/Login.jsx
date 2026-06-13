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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl shadow-2xl shadow-purple-600/40 mb-4">
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
            <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
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
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all"
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
                  className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all"
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
            className="w-full mt-6 py-3 px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0"
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
