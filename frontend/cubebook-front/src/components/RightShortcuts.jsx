import { useNavigate, useLocation } from 'react-router-dom';
import useCompanyStore from '../store/companyStore';
import { useState } from 'react';
import KeymapHelp from './KeymapHelp';

const VOUCHER_KEYS = [
  { key: 'F2',  label: 'Date',           route: null },
  { key: 'F3',  label: 'Change Company',  route: '/company-setup' },
  { key: 'F4',  label: 'Contra',         route: '/vouchers?type=Contra' },
  { key: 'F5',  label: 'Payment',        route: '/vouchers?type=Payment' },
  { key: 'F6',  label: 'Receipt',        route: '/vouchers?type=Receipt' },
  { key: 'F7',  label: 'Journal',        route: '/vouchers?type=Journal' },
  { key: 'F8',  label: 'Sales',          route: '/vouchers?type=Sales' },
  { key: 'F9',  label: 'Purchase',       route: '/vouchers?type=Purchase' },
  { key: 'F10', label: 'Other Vouchers', route: '/vouchers' },
];

const ACTION_KEYS = [
  { key: 'F',   label: 'Autofill' },
  { key: 'H',   label: 'Change Mode' },
  { key: 'I',   label: 'More Details' },
  { key: 'O',   label: 'Related Reports' },
];

const OPTION_KEYS = [
  { key: 'L',   label: 'Optional' },
  { key: 'T',   label: 'Post-Dated' },
  { key: 'J',   label: 'Stat Adjustment' },
];

export default function RightShortcuts() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { clearCompany, activeCompany } = useCompanyStore();
  const [showHelp, setShowHelp] = useState(false);

  const currentType = new URLSearchParams(location.search).get('type');

  const handleKey = (key, route) => {
    if (!route) return;
    navigate(route);
  };

  return (
    <>
      <nav
        role="navigation"
        aria-label="Function key shortcuts"
        className="flex flex-col text-[11px] shrink-0 select-none overflow-y-auto"
        style={{
          width: '176px',
          background: '#ede8d0',
          borderLeft: '1px solid rgba(0,0,0,0.12)',
          fontFamily: 'Consolas, "Courier New", monospace',
        }}
      >
        {/* Date header */}
        <div className="px-2 py-1.5 border-b border-black/10 text-right" style={{ fontFamily: 'sans-serif' }}>
          <div className="text-xs font-bold text-slate-700">
            {new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })}
          </div>
          <div className="text-[10px] text-slate-500">
            {new Date().toLocaleDateString('en-IN', { weekday:'long' })}
          </div>
        </div>

        {/* Voucher type keys */}
        <div className="border-b border-black/10">
          {VOUCHER_KEYS.map(({ key, label, route }) => {
            const typeMatch = route?.includes('type=') && route.includes(currentType || '__');
            const isActive  = typeMatch;
            return (
              <button
                key={key}
                onClick={() => handleKey(key, route)}
                disabled={!route}
                aria-label={`${key} ${label}`}
                className="form-control"
                style={{
                  background: isActive ? '#1a3b34' : 'transparent',
                  cursor: route ? 'pointer' : 'default',
                }}
                onMouseEnter={e => { if (route && !isActive) e.currentTarget.style.background = '#c8dff8'; }}
                onMouseLeave={e => { if (route && !isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="flex items-center">
                  <span style={{
                    color: isActive ? '#facc15' : (route ? '#1d4ed8' : '#94a3b8'),
                    fontWeight: 'bold',
                    minWidth: '26px',
                    display: 'inline-block',
                    fontSize: '11px',
                  }}>
                    {key}
                  </span>
                  <span style={{ color: isActive ? '#facc15' : '#64748b' }}>:</span>
                  <span className="ml-1" style={{ color: isActive ? '#fff' : (route ? '#374151' : '#94a3b8') }}>
                    {label}
                  </span>
                </div>
                {isActive && <span style={{ color: '#facc15', fontSize: '9px' }}>◄</span>}
                {!isActive && route && <span style={{ color: '#94a3b8', fontSize: '9px' }}>◄</span>}
              </button>
            );
          })}
        </div>

        {/* Action keys */}
        <div className="border-b border-black/10 mt-1">
          {ACTION_KEYS.map(({ key, label }) => (
            <button key={key}
              className="form-control"
              onMouseEnter={e => e.currentTarget.style.background = '#c8dff8'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ color: '#1d4ed8', fontWeight: 'bold', minWidth: '16px' }}>{key}</span>
              <span style={{ color: '#64748b' }}>:</span>
              <span className="ml-1 text-slate-600">{label}</span>
            </button>
          ))}
        </div>

        {/* Option keys */}
        <div className="mt-1">
          {OPTION_KEYS.map(({ key, label }) => (
            <button key={key}
              className="form-control"
              onMouseEnter={e => e.currentTarget.style.background = '#c8dff8'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ color: '#1d4ed8', fontWeight: 'bold', minWidth: '16px' }}>{key}</span>
              <span style={{ color: '#64748b' }}>:</span>
              <span className="ml-1 text-slate-600">{label}</span>
            </button>
          ))}
        </div>

        {/* Help */}
        <div className="mt-auto border-t border-black/10">
          <button
            onClick={() => setShowHelp(true)}
            className="form-control"
            onMouseEnter={e => e.currentTarget.style.background = '#c8dff8'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>F12</span>
            <span style={{ color: '#64748b' }}>:</span>
            <span className="ml-1 text-slate-600">Configure</span>
          </button>
          {!activeCompany && (
            <div className="px-2 py-1 text-[10px] text-red-500" style={{ fontFamily: 'sans-serif' }}>
              ⚠ No company selected
            </div>
          )}
        </div>
      </nav>

      {showHelp && <KeymapHelp onClose={() => setShowHelp(false)} />}
    </>
  );
}
