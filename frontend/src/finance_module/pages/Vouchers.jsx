import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { vouchers, ledgers as ledgersApi, companies, stockItems as stockItemsApi, locations as locationsApi } from '../api';
import useCompanyStore from '../store/companyStore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import VoucherForm from '../components/VoucherForm';
import { Plus, Search, Receipt, Filter, ArrowLeft } from 'lucide-react';

/* ─── Voucher type accent colors ─── */
const TYPE_ACCENT = {
  Sales:        { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
  Purchase:     { bg: '#fdf2f8', color: '#be185d', border: '#f9a8d4' },
  Receipt:      { bg: '#f0fdf4', color: '#059669', border: '#86efac' },
  Payment:      { bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
  Journal:      { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  Contra:       { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  'Debit Note': { bg: '#fff1f2', color: '#be123c', border: '#fca5a5' },
  'Credit Note':{ bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
};

const VOUCHER_TYPES = ['Contra','Payment','Receipt','Journal','Sales','Purchase','Debit Note','Credit Note'];

const STATUS_BADGE = {
  Posted:    { bg: 'rgba(5,150,105,0.08)',  color: '#059669', border: 'rgba(5,150,105,0.2)' },
  Cancelled: { bg: 'rgba(220,38,38,0.08)',  color: '#dc2626', border: 'rgba(220,38,38,0.2)' },
  Draft:     { bg: 'rgba(217,119,6,0.08)',  color: '#d97706', border: 'rgba(217,119,6,0.2)' },
};

const fmt = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function Vouchers() {
  const { activeCompany } = useCompanyStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [isFormOpen,  setIsFormOpen]  = useState(false);
  const [voucherType, setVoucherType] = useState('Payment');
  const [editingVoucherId, setEditingVoucherId] = useState(null);
  const [seeding,     setSeeding]     = useState(false);

  const { data: vouchersList = [], isLoading } = useQuery({
    queryKey: ['vouchers', activeCompany?.id],
    queryFn:  () => vouchers.list({ company_id: activeCompany.id }),
    enabled:  !!activeCompany,
  });

  const { data: ledgersList = [] } = useQuery({
    queryKey: ['ledgers', activeCompany?.id],
    queryFn:  () => ledgersApi.list({ company_id: activeCompany.id }),
    enabled:  !!activeCompany,
  });

  const { data: stockItemsList = [] } = useQuery({
    queryKey: ['stockItems', activeCompany?.id],
    queryFn:  () => stockItemsApi.list({ company_id: activeCompany.id }),
    enabled:  !!activeCompany,
  });

  const { data: locationsList = [] } = useQuery({
    queryKey: ['locations', activeCompany?.id],
    queryFn:  () => locationsApi.list({ company_id: activeCompany.id }),
    enabled:  !!activeCompany,
  });

  /* Open form from URL param ?type=Payment */
  useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setVoucherType(type);
      setIsFormOpen(true);
    }
  }, [searchParams]);

  const openVoucher = (type, voucherId = null) => {
    setVoucherType(type);
    setEditingVoucherId(voucherId);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingVoucherId(null);
    searchParams.delete('type');
    setSearchParams(searchParams);
    navigate('/vouchers', { replace: true });
  };

  const handleSeedVouchers = async () => {
    if (!activeCompany?.id) return;
    try {
      setSeeding(true);
      await companies.seedVouchers(activeCompany.id);
      queryClient.invalidateQueries();
      alert('Successfully seeded textile vouchers!');
    } catch (err) {
      alert('Error seeding vouchers: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSeeding(false);
    }
  };

  const filtered = vouchersList.filter(v => {
    const matchSearch = !search ||
      v.voucher_number?.toLowerCase().includes(search.toLowerCase()) ||
      v.narration?.toLowerCase().includes(search.toLowerCase()) ||
      (v.entries?.[0]?.ledger_name && v.entries[0].ledger_name.toLowerCase().includes(search.toLowerCase()));
    const matchType = !typeFilter || v.voucher_type === typeFilter;
    return matchSearch && matchType;
  });

  const totalAmt   = filtered.reduce((s, v) => s + (Number(v.total_amount) || 0), 0);
  const typeCounts = VOUCHER_TYPES.reduce((acc, t) => {
    acc[t] = vouchersList.filter(v => v.voucher_type === t).length;
    return acc;
  }, {});

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Select a company to view vouchers.</p>
      </div>
    );
  }

  /* ── If form is open, show full-page form ── */
  if (isFormOpen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={closeForm}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', fontSize: 13, fontWeight: 600,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              color: 'var(--text-secondary)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
          >
            <ArrowLeft size={14} /> Back to Vouchers
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            → Creating <strong style={{ color: 'var(--text-primary)' }}>{voucherType}</strong> Voucher
          </span>
        </div>

        <VoucherForm
          type={voucherType}
          voucherId={editingVoucherId}
          companyId={activeCompany.id}
          ledgers={ledgersList}
          stockItems={stockItemsList}
          locations={locationsList}
          onClose={closeForm}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['vouchers'] })}
        />
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-md)',
            background: 'rgba(79,70,229,0.1)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Receipt size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Voucher Entry</h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Record and manage ledger transactions · {vouchersList.length} total vouchers
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleSeedVouchers}
            disabled={seeding}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', fontSize: 13, fontWeight: 600,
              background: 'rgba(79,70,229,0.06)', color: 'var(--primary)',
              border: '1px solid rgba(79,70,229,0.25)', borderRadius: 'var(--radius-sm)',
              cursor: seeding ? 'not-allowed' : 'pointer', opacity: seeding ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            {seeding ? 'Generating…' : 'Seed Textile Vouchers'}
          </button>
          <button
            onClick={() => openVoucher(typeFilter || 'Sales', null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
          >
            <Plus size={15} /> New {typeFilter ? typeFilter : 'Voucher'}
          </button>
        </div>
      </div>

      {/* ── Quick Actions — voucher type tiles ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '16px 20px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Quick Actions &amp; Filters
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Click card to filter · Click <strong>+</strong> to create new
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {VOUCHER_TYPES.map(t => {
            const isActive = typeFilter === t;
            const acc = TYPE_ACCENT[t] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
            const count = typeCounts[t] || 0;
            return (
              <div
                key={t}
                onClick={() => setTypeFilter(isActive ? '' : t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isActive ? acc.border : 'var(--border)'}`,
                  background: isActive ? acc.bg : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  userSelect: 'none',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = acc.bg; e.currentTarget.style.borderColor = acc.border; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
              >
                {/* Type label */}
                <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? acc.color : 'var(--text-secondary)' }}>
                  {t}
                </span>
                {/* Count badge */}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '1px 7px',
                  borderRadius: 100, minWidth: 22, textAlign: 'center',
                  background: isActive ? acc.color + '25' : 'var(--border)',
                  color: isActive ? acc.color : 'var(--text-muted)',
                }}>
                  {count}
                </span>
                {/* + Create button */}
                <button
                  type="button"
                  title={`Create New ${t} Voucher`}
                  onClick={e => {
                    e.stopPropagation();
                    openVoucher(t, null);
                  }}
                  style={{
                    width: 24, height: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? acc.color + '20' : 'var(--bg-card)',
                    border: `1px solid ${isActive ? acc.border : 'var(--border)'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: isActive ? acc.color : 'var(--text-muted)',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = acc.color + '20';
                    e.currentTarget.style.color = acc.color;
                    e.currentTarget.style.borderColor = acc.border;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isActive ? acc.color + '20' : 'var(--bg-card)';
                    e.currentTarget.style.color = isActive ? acc.color : 'var(--text-muted)';
                    e.currentTarget.style.borderColor = isActive ? acc.border : 'var(--border)';
                  }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Table Card ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search voucher, particulars…"
                style={{
                  width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  fontSize: 13, background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>
            {/* Type filter */}
            <div style={{ position: 'relative' }}>
              <Filter size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={{
                  paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  fontSize: 13, background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">All Voucher Types</option>
                {VOUCHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {(typeFilter || search) && (
              <button
                onClick={() => { setTypeFilter(''); setSearch(''); }}
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              >
                Reset Filters
              </button>
            )}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> of {vouchersList.length}
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Date','Voucher No.','Type','Particulars / Narration','Ref No.','Status','Amount'].map((h, i) => (
                  <th key={h} style={{
                    padding: '11px 16px',
                    textAlign: i === 6 ? 'right' : i === 5 ? 'center' : 'left',
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px',
                    color: 'var(--text-muted)', background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    Loading vouchers…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '56px 20px', textAlign: 'center' }}>
                    <Receipt size={36} style={{ color: 'var(--border-light)', margin: '0 auto 10px' }} />
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>No vouchers found</p>
                    <button
                      onClick={() => openVoucher(typeFilter || 'Sales', null)}
                      style={{ fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Create your first voucher
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map(v => {
                  const acc = TYPE_ACCENT[v.voucher_type] || TYPE_ACCENT.Journal;
                  const ss  = STATUS_BADGE[v.status]      || STATUS_BADGE.Posted;
                  const particulars = v.entries?.[0]?.ledger_name || v.narration || '—';
                  return (
                    <tr
                      key={v.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                      onClick={() => openVoucher(v.voucher_type, v.id)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{v.date}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{v.voucher_number}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                          background: acc.bg, color: acc.color, border: `1px solid ${acc.border}`,
                        }}>
                          {v.voucher_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: 300 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{particulars}</span>
                        {v.narration && <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', marginLeft: 8 }}>— {v.narration}</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{v.reference_no || '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                          background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                        }}>
                          {v.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        ₹{fmt(v.total_amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ padding: '11px 16px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                    Total ({filtered.length} voucher{filtered.length !== 1 ? 's' : ''})
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                    ₹{fmt(totalAmt)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px', borderTop: '1px solid var(--border)',
          background: 'var(--bg-secondary)', fontSize: 12, color: 'var(--text-muted)',
        }}>
          <span>Showing {filtered.length} entries</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>Page 1 of 1</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Previous','Next'].map(label => (
                <button key={label} disabled style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--border-light)', cursor: 'not-allowed' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
