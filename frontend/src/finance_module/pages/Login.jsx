import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, BookOpen, Factory, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

// ── Auth helpers ───────────────────────────────────────────────────────────
async function tryLoginCubeBook(username, password) {
  const res = await axios.post('http://localhost:8000/api/auth/login', { username, password });
  return res.data; // { access_token, user_id, username, full_name, role }
}

async function tryLoginDinesh(username, password) {
  const params = new URLSearchParams({ username, password });
  const res = await axios.post(
    'http://localhost:8001/api/v1/auth/login',
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data; // { access_token, user_id, user_name, user_type }
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // After successful auth, we store results per-app and show portal selector
  const [portals, setPortals] = useState(null); // null = login step, object = portal step

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const results = { cubebook: null, dinesh: null };

    // Try both — we don't fail hard if one is offline; just mark it unavailable
    await Promise.allSettled([
      tryLoginCubeBook(form.username, form.password)
        .then(d => { results.cubebook = d; })
        .catch(() => { /* offline or wrong creds */ }),
      tryLoginDinesh(form.username, form.password)
        .then(d => { results.dinesh = d; })
        .catch(() => { /* offline or wrong creds */ }),
    ]);

    setLoading(false);

    if (!results.cubebook && !results.dinesh) {
      setError('Invalid username or password');
      return;
    }

    // Persist CubeBook session if available
    if (results.cubebook) {
      localStorage.setItem('cb_auth_token', results.cubebook.access_token);
      localStorage.setItem('cb_auth_user', JSON.stringify({
        id:        results.cubebook.user_id,
        username:  results.cubebook.username,
        full_name: results.cubebook.full_name,
        role:      results.cubebook.role,
      }));
    }

    // Persist Dinesh session token separately (for cross-launch URL)
    if (results.dinesh) {
      localStorage.setItem('dinesh_auth_token', results.dinesh.access_token);
      localStorage.setItem('dinesh_auth_user', JSON.stringify({
        user_id:   results.dinesh.user_id,
        user_name: results.dinesh.user_name,
        user_type: results.dinesh.user_type,
      }));
    }

    // If only one app is available, go straight in
    if (results.cubebook && !results.dinesh) {
      navigate('/setup');
      return;
    }
    if (results.dinesh && !results.cubebook) {
      openDinesh(results.dinesh.access_token);
      return;
    }

    // Both available — show portal chooser
    setPortals(results);
  };

  const openDinesh = (token) => {
    // Pass token via URL hash so dinesh-tex Login can auto-populate localStorage
    window.open(`http://localhost:5174/auto-login?token=${encodeURIComponent(token)}`, '_blank');
  };

  // ── Portal chooser screen ──────────────────────────────────────────────
  if (portals) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-500 rounded-2xl shadow-2xl shadow-green-500/40 mb-4">
              <CheckCircle2 size={26} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Welcome, {
              portals.cubebook?.full_name || portals.dinesh?.user_name || 'User'
            }!</h1>
            <p className="text-slate-400 text-sm mt-2">Choose which application to open</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* ── CubeBook Portal ── */}
            <button
              onClick={() => navigate('/setup')}
              className="group relative text-left bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/10 hover:border-purple-400/40 rounded-3xl p-7 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-500/20 hover:shadow-2xl"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/40 group-hover:scale-110 transition-transform">
                  <BookOpen size={26} className="text-white" />
                </div>
                <ArrowRight size={18} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">CubeBook</h2>
              <p className="text-slate-400 text-sm leading-relaxed">Accounting & Financial Management</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Online · Port 8000</span>
              </div>
            </button>

            {/* ── Dinesh ERP Portal ── */}
            <button
              onClick={() => openDinesh(portals.dinesh.access_token)}
              className="group relative text-left bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 rounded-3xl p-7 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-500/20 hover:shadow-2xl"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/40 group-hover:scale-110 transition-transform">
                  <Factory size={26} className="text-white" />
                </div>
                <ArrowRight size={18} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Dinesh Exports ERP</h2>
              <p className="text-slate-400 text-sm leading-relaxed">Textile Manufacturing & Operations</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Online · Port 8001</span>
              </div>
            </button>
          </div>

          <p className="text-center text-slate-600 text-xs mt-8">
            Signed in as <span className="text-slate-400 font-mono">{form.username}</span>
            <button onClick={() => { setPortals(null); setForm({ username: '', password: '' }); }} className="ml-3 text-purple-400 hover:text-purple-300 underline">
              Switch user
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Login form screen ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-2xl shadow-purple-600/40">
              <BookOpen size={22} className="text-white" />
            </div>
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-2xl shadow-amber-500/40">
              <Factory size={22} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Pannu Group</h1>
          <p className="text-purple-300 text-sm mt-1 font-medium">Single Sign-On Portal</p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white mb-1">Sign In</h2>
          <p className="text-slate-400 text-sm mb-6">Access CubeBook &amp; Dinesh Exports ERP</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
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
                  {showPwd ? <Eye size={16} /> : <EyeOff size={16} />}
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
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
