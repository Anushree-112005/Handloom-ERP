import { useNavigate } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';

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
      <h2 className="header-title">{title}</h2>
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
