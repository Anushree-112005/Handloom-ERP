import React, { useState, useEffect } from 'react';
import { CheckSquare, Search, Box, MapPin } from 'lucide-react';
import { warehouseInwardOutwardAPI } from '../../../services/api';

export default function PutAwayEntry() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingPutAways, setPendingPutAways] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPutAways();
  }, []);

  const fetchPutAways = async () => {
    try {
      setLoading(true);
      const res = await warehouseInwardOutwardAPI.getPutAway();
      if (res.data) setPendingPutAways(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = pendingPutAways.filter(item => 
    (item.task_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.source_grn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.item_details || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckSquare size={24} color="#3b82f6" /> Put-Away Entry
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Scan and assign received goods to specific physical bins in the godown.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Scan Barcode or Search Put-Away ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading put-away tasks...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Source GRN</th>
                  <th>Item Details</th>
                  <th>Quantity</th>
                  <th>Suggested Location</th>
                  <th>Actual Scan Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.task_id}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.source_grn}</td>
                    <td>{item.item_details}</td>
                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, fontSize: 13 }}>
                        <MapPin size={14} className="text-gray-500" /> {item.suggested_location}
                      </span>
                    </td>
                    <td>
                      <input type="text" className="form-control" placeholder="Scan Bin Barcode" style={{ padding: '4px 8px', width: '140px', fontSize: 13 }} />
                    </td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                        <Box size={14} /> Confirm Put-Away
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No pending put-away tasks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
