import React, { useState, useEffect } from 'react';
import { Box, LayoutDashboard, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Package, MapPin, Search } from 'lucide-react';
import { erpStockAPI } from '../../../services/api';

export default function WarehouseDashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    totalGodowns: 4,
    activeBins: 128,
    receivingDock: 0,
    dispatchStaging: 0,
    inProgressTransfers: 0,
    recentMovements: []
  });

  return (
    <div className="animate-fade p-6">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box size={24} color="var(--primary)" /> Warehouse Dashboard
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time physical movement tracking and staging area monitoring.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <MapPin size={24} />
          </div>
          <div className="stat-details">
            <h3>Physical Locations</h3>
            <div className="value">{data.totalGodowns} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Godowns</span></div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{data.activeBins} Active Bins</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <ArrowDownLeft size={24} />
          </div>
          <div className="stat-details">
            <h3>Receiving Dock</h3>
            <div className="value">{data.receivingDock} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Kgs/Mtrs</span></div>
            <p style={{ fontSize: 12, color: '#10b981', marginTop: 4, fontWeight: 500 }}>Pending Put-Away</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-details">
            <h3>Dispatch Dock</h3>
            <div className="value">{data.dispatchStaging} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Bales</span></div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Ready for Loading</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <ArrowRightLeft size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Transfers</h3>
            <div className="value">{data.inProgressTransfers} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}></span></div>
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4, fontWeight: 500 }}>Inter-Godown Transits</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Physical Movements</h2>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Movement Type</th>
                <th>Item / SKU</th>
                <th>Source Bin</th>
                <th>Target Bin</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentMovements.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Package size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                    <p>No recent physical movements recorded.</p>
                  </td>
                </tr>
              ) : (
                data.recentMovements.map((item, index) => (
                  <tr key={index}>
                    {/* Render data rows here when available */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
