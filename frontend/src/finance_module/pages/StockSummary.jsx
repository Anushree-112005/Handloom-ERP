import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Boxes, Plus, Activity } from 'lucide-react';
import { stockItems } from '../api';
import useCompanyStore from '../store/companyStore';

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function StockSummary() {
  const { activeCompany } = useCompanyStore();
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['stock-items', activeCompany?.id],
    queryFn:  () => stockItems.list(activeCompany.id),
    enabled:  !!activeCompany,
  });

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company first.</p>
      </div>
    );
  }

  const totalItems  = items.length;
  const totalValue  = items.reduce((s, i) => s + ((i.rate || 0) * (i.opening_qty || 0)), 0);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Boxes size={24} color="var(--primary)" />
            Stock Summary
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Inventory valuation, stock on hand, and group metrics
          </p>
        </div>
        <button
          onClick={() => navigate('/inventory/stock-items/create')}
          className="btn btn-primary"
          style={{ padding: '10px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {[
          { label: 'Total Items', value: totalItems, color: '#6366f1', border: '#6366f1' },
          { label: 'Stock Value', value: `₹${fmt(totalValue)}`, color: 'var(--text-primary)', border: '#3b82f6' },
          { label: 'Active Items', value: items.filter(i => i.is_active !== false).length, color: '#10b981', border: '#10b981' },
        ].map(({ label, value, color, border }) => (
          <div key={label} className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeft: `4px solid ${border}`, borderRadius: '12px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
            <p style={{ margin: '8px 0 0 0', fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Stock Table ── */}
      <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Item Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Group</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Unit</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>GST Rate</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Rate</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading stock items…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
                      <Boxes size={40} style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No stock items found</p>
                      <button onClick={() => navigate('/inventory/stock-items/create')} style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                        + Add your first item
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => navigate(`/inventory/stock-items/alter/${item.id}`)} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.stock_group || item.group || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.unit || '—'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {item.gst_rate > 0 ? (
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 700, background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
                          {item.gst_rate}%
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {item.rate ? `₹${fmt(item.rate)}` : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/inventory/stock-items/alter/${item.id}`)}
                        style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Movement CTA ── */}
      <div style={{ padding: '20px 24px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Activity size={20} style={{ color: '#2563eb' }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#1e40af', fontSize: 13, textTransform: 'uppercase' }}>Stock Movement Report</p>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#3b82f6' }}>Track stock ledger logs, inward/outward registers, and batch valuation</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/inventory/movement')}
          className="btn btn-primary"
          style={{ padding: '10px 18px', fontSize: 13 }}
        >
          View Movement
        </button>
      </div>
    </div>
  );
}
