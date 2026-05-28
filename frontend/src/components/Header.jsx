import { useNavigate } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import defaultLogo from '../assets/logo.svg';

export default function Header({ title }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="header" id="main-header">
      <div style={{ flex: 1, overflow: 'hidden', marginRight: '32px' }}>
        <h2 className="header-title" style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '15px' }}>
          <marquee behavior="scroll" direction="left" scrollamount="6">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', verticalAlign: 'middle' }}>
              <img src={defaultLogo} alt="Logo" style={{ height: '18px', width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontWeight: 600 }}>{title}</span>
            </div>
          </marquee>
        </h2>
      </div>
      <div className="header-actions">
        <button className="btn btn-secondary" style={{ padding: '8px' }} title="Notifications">
          <Bell size={18} />
        </button>
        <div className="header-user">
          <div className="avatar">{(user.user_name || 'A')[0]}</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{user.user_name || 'Admin'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.user_type || 'Admin'}</div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px' }} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
