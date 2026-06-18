// Bottom status bar — exactly like Tally Prime's footer action bar
import { useNavigate } from 'react-router-dom';

export default function ShortcutBar({ currentDate, company }) {
  const navigate = useNavigate();

  const shortcuts = [
    { key: 'F4', label: 'Contra',   route: '/cubebook/vouchers?type=Contra' },
    { key: 'F5', label: 'Payment',  route: '/cubebook/vouchers?type=Payment' },
    { key: 'F6', label: 'Receipt',  route: '/cubebook/vouchers?type=Receipt' },
    { key: 'F7', label: 'Journal',  route: '/cubebook/vouchers?type=Journal' },
    { key: 'F8', label: 'Sales',    route: '/cubebook/vouchers?type=Sales' },
    { key: 'F9', label: 'Purchase', route: '/cubebook/vouchers?type=Purchase' },
    { key: 'Alt+D', label: 'Day Book',  route: '/cubebook/day-book' },
    { key: 'Alt+R', label: 'Reports',   route: '/cubebook/reports' },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-7 flex items-center px-3 gap-5 z-50 select-none"
      style={{
        background: '#1a3b34',
        borderTop: '1px solid #0d211d',
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '11px',
        color: '#e2e8f0',
      }}
    >
      {/* Company indicator */}
      <span style={{ color: '#34d399', fontWeight: 'bold', marginRight: '4px' }}>
        ● {company || 'No Company'}
      </span>

      {/* Separator */}
      <span style={{ color: '#334155' }}>│</span>

      {/* Shortcut keys */}
      {shortcuts.map(({ key, label, route }) => (
        <button
          key={key}
          onClick={() => navigate(route)}
          className="flex items-center gap-1 transition-colors"
          style={{ color: '#cbd5e1' }}
          onMouseEnter={e => e.currentTarget.style.color = '#facc15'}
          onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
        >
          <kbd
            style={{
              background: '#253d35',
              border: '1px solid #2d5248',
              borderRadius: '2px',
              padding: '0 4px',
              fontSize: '10px',
              color: '#facc15',
              fontWeight: 'bold',
              fontFamily: 'inherit',
            }}
          >
            {key}
          </kbd>
          <span style={{ color: '#94a3b8' }}>{label}</span>
        </button>
      ))}

      {/* Date on the right */}
      <span className="ml-auto" style={{ color: '#64748b', fontSize: '10px' }}>
        {currentDate}
      </span>
    </div>
  );
}
