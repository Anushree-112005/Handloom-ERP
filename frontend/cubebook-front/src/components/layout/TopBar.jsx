import { Link, useNavigate } from 'react-router-dom';
import { Bell as BellIcon, LogOut as LogOutIcon, Menu } from 'lucide-react';
import useCompanyStore from '../../store/companyStore';

const TopBar = () => {
  const { activeCompany, clearCompany } = useCompanyStore();
  const navigate = useNavigate();

  // Read real user from JWT profile stored at login
  const authUser = (() => {
    try { return JSON.parse(localStorage.getItem('cb_auth_user') || '{}'); }
    catch { return {}; }
  })();
  const displayName  = authUser.full_name || authUser.username || 'User';
  const displayRole  = authUser.role || 'User';
  const initials     = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('cb_company_id');
    localStorage.removeItem('cb_company_name');
    localStorage.removeItem('cb_auth_token');
    localStorage.removeItem('cb_auth_user');
    clearCompany();
    navigate('/login');
  };

  return (
    <header className="btn btn-secondary">
      <div className="flex items-center gap-4">
        {/* Mobile menu button placeholder */}
        <button className="md:hidden text-slate-500 hover:text-slate-700">
          <Menu size={24} />
        </button>
        {/* Brand Logo Area */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex gap-1 items-center justify-center">
            {/* Simple logo placeholder made with colored blocks */}
            <div className="flex flex-col gap-0.5">
              <div className="w-2.5 h-2.5 bg-pink-500 rounded-sm"></div>
              <div className="btn btn-primary"></div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="w-2.5 h-2.5 bg-teal-500 rounded-sm"></div>
              <div className="btn btn-primary"></div>
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-slate-800 leading-none">CubeBook</h1>
            <p className="text-[10px] text-slate-500">Accounting Management</p>
          </div>
        </div>
      </div>

      {activeCompany && (
        <div className="btn btn-secondary">
          <div className="w-4 h-4 flex gap-0.5 items-center justify-center">
             <div className="flex flex-col gap-[1px]">
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-sm"></div>
              <div className="btn btn-primary"></div>
            </div>
            <div className="flex flex-col gap-[1px]">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-sm"></div>
              <div className="btn btn-primary"></div>
            </div>
          </div>
          <span className="font-medium text-sm text-slate-700">{activeCompany.name}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button className="btn btn-secondary">
          <BellIcon size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="btn btn-secondary">
          <div className="btn btn-primary">
            {initials || 'A'}
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-semibold text-slate-800 leading-tight">{displayName}</p>
            <p className="text-xs text-slate-500">{displayRole}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn btn-secondary"
          title="Logout"
        >
          <LogOutIcon size={18} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;

