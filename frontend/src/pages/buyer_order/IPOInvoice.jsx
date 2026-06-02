import React, { useState } from 'react';
import { FileText, Download, Plus, Search, Edit2, Eye, FileCheck, Globe, Filter, CheckCircle, FilePlus } from 'lucide-react';

export default function IPOInvoice() {
  const [activeCard, setActiveCard] = useState('Proforma Invoice');
  
  const [filters, setFilters] = useState({
    partyName: '', buyerName: '', dateFrom: '', dateTo: '', status: 'All', type: 'All', designNo: ''
  });

  const cards = [
    { title: 'Proforma Invoice', icon: FileText, color: '#3b82f6', desc: 'Domestic pre-shipment invoices' },
    { title: 'Export Proforma Invoice', icon: Globe, color: '#8b5cf6', desc: 'International export invoices' },
    { title: 'Open Invoice', icon: FileCheck, color: '#10b981', desc: 'Finalized active invoices' }
  ];

  // Linked invoices database
  const [invoices, setInvoices] = useState([]);

  return (
    <div className="page-container animate-fade">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>IPO Invoicing System</h1>
        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage Proforma, Export, and Open Invoices linked directly to your Buyer Orders.</p>
      </div>

      {/* Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        {cards.map(c => (
          <div 
            key={c.title} 
            className="card" 
            onClick={() => setActiveCard(c.title)}
            style={{ 
              padding: 24, 
              cursor: 'pointer', 
              border: activeCard === c.title ? `2px solid ${c.color}` : '1px solid transparent',
              background: activeCard === c.title ? `rgba(${c.color === '#3b82f6' ? '59,130,246' : c.color === '#8b5cf6' ? '139,92,246' : '16,185,129'}, 0.05)` : 'var(--bg-secondary)',
              transition: 'all 0.2s ease',
              transform: activeCard === c.title ? 'translateY(-2px)' : 'none',
              boxShadow: activeCard === c.title ? `0 10px 15px -3px rgba(0,0,0,0.1)` : '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 12, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(0,0,0,0.15)` }}>
                <c.icon size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{c.title}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{c.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ padding: 24, minHeight: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
            <Filter size={18} /> {activeCard} - Overview
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} /> Export View
            </button>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilePlus size={16} /> Generate Invoice from Order
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Party Name</label>
            <input type="text" className="form-control" placeholder="Search party..." style={{ margin: 0 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Buyer Name</label>
            <input type="text" className="form-control" placeholder="Search buyer..." style={{ margin: 0 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Design No.</label>
            <input type="text" className="form-control" placeholder="Search design..." style={{ margin: 0 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Invoice Status</label>
            <select className="form-control" style={{ margin: 0 }}>
              <option>All Statuses</option>
              <option>Draft</option>
              <option>Confirmed</option>
              <option>Completed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Invoice Type</label>
            <select className="form-control" style={{ margin: 0 }}>
              <option>All Types</option>
              <option>Regular</option>
              <option>Special</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Date From</label>
              <input type="date" className="form-control" style={{ margin: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Date To</label>
              <input type="date" className="form-control" style={{ margin: 0 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-secondary" style={{ width: '100%', height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff' }}>
              <Search size={16} /> Apply Filters
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <table className="data-table">
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                <th style={{ padding: '12px 16px' }}>Invoice No</th>
                <th style={{ padding: '12px 16px' }}>Order Ref ID</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Party Name</th>
                <th style={{ padding: '12px 16px' }}>Design No</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeCard === 'Proforma Invoice' && invoices.length > 0 ? invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--primary)' }}>{inv.invoice_no}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{inv.order_ref}</td>
                  <td style={{ padding: '12px 16px' }}>{inv.date}</td>
                  <td style={{ padding: '12px 16px' }}>{inv.party_name}</td>
                  <td style={{ padding: '12px 16px' }}>{inv.design_no}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${inv.status === 'Draft' ? 'badge-draft' : 'badge-active'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px' }} title="View"><Eye size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#10b981' }} title="Finalize"><CheckCircle size={14} /></button>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', color: '#3b82f6' }} title="Export PDF"><Download size={14} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                      <FileCheck size={48} style={{ opacity: 0.2, color: 'var(--primary)' }} />
                      <p style={{ margin: 0, fontSize: 14 }}>No {activeCard}s found matching the current filters.</p>
                      <button className="btn btn-primary" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={16} /> Auto-pull from Buyer Order
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
