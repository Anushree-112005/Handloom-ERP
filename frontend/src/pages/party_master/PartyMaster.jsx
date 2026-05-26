import { useEffect, useState } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
import { partyAPI } from '../../services/api';

export default function PartyMaster() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    party_type: 'Sales Party', company_name: '', city: '', state: '',
    gst_no: '', pan_no: '', mobile: '', email: '', contact_person: '',
    credit_days: 0, address: '',
  });

  const loadParties = () => {
    partyAPI.list().then(r => setParties(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(loadParties, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await partyAPI.create(form);
      setShowForm(false);
      setForm({ party_type: 'Sales Party', company_name: '', city: '', state: '', gst_no: '', pan_no: '', mobile: '', email: '', contact_person: '', credit_days: 0, address: '' });
      loadParties();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating party');
    }
  };

  return (
    <div className="animate-fade">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Party Master</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> New Party
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} style={{ marginBottom: 24, padding: 20, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div className="form-row">
              <div className="form-group">
                <label>Party Type</label>
                <select className="form-control" value={form.party_type} onChange={e => setForm({...form, party_type: e.target.value})}>
                  <option>Sales Party</option><option>Purchase Party</option><option>Agent</option>
                  <option>Logistics</option><option>Processor</option><option>Vendor</option>
                </select>
              </div>
              <div className="form-group">
                <label>Company Name *</label>
                <input className="form-control" required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <input className="form-control" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input className="form-control" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              </div>
              <div className="form-group">
                <label>State</label>
                <input className="form-control" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
              </div>
              <div className="form-group">
                <label>GST No</label>
                <input className="form-control" value={form.gst_no} onChange={e => setForm({...form, gst_no: e.target.value})} />
              </div>
              <div className="form-group">
                <label>PAN No</label>
                <input className="form-control" value={form.pan_no} onChange={e => setForm({...form, pan_no: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mobile</label>
                <input className="form-control" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Credit Days</label>
                <input className="form-control" type="number" value={form.credit_days} onChange={e => setForm({...form, credit_days: parseInt(e.target.value)||0})} />
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea className="form-control" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-success">Save Party</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th><th>Company Name</th><th>Type</th><th>City</th>
                <th>GST No</th><th>Mobile</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Loading…</td></tr>
              ) : parties.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No parties found. Click "New Party" to add one.</td></tr>
              ) : parties.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{p.customer_code}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.company_name}</td>
                  <td><span className="badge badge-active">{p.party_type}</span></td>
                  <td>{p.city}</td>
                  <td>{p.gst_no || '—'}</td>
                  <td>{p.mobile || '—'}</td>
                  <td><span className={`badge ${p.status === 'Active' ? 'badge-active' : 'badge-draft'}`}>{p.status}</span></td>
                  <td><button className="btn btn-secondary" style={{ padding: '4px 8px' }}><Eye size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
