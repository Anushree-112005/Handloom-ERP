import React from 'react';
import { Construction } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';

export default function ComingSoonPlaceholder() {
  const location = useLocation();
  const params = useParams();

  // Extract a readable title from the URL path
  let title = "Module In Development";
  if (location.pathname.includes('/raw/yarn')) title = "Raw Material: Yarn Stock";
  else if (location.pathname.includes('/raw/consumables')) title = "Raw Material: Chemicals & Consumables";
  else if (location.pathname.includes('/wip/')) {
    const unit = params.unit ? params.unit.charAt(0).toUpperCase() + params.unit.slice(1) : '';
    title = `WIP Stock: At ${unit} Unit`;
  }
  else if (location.pathname.includes('/finished/')) {
    const type = params.type ? params.type.charAt(0).toUpperCase() + params.type.slice(1) : '';
    title = `Finished Goods: ${type} Fabric`;
  }
  else if (location.pathname.includes('/valuation')) title = "Stock Valuation Report";
  else if (location.pathname.includes('/audit')) title = "Physical Stock Audit";
  else if (location.pathname.includes('/godown')) title = "Godown-wise Stock";
  else if (location.pathname.includes('/photos')) title = "Stock Photos";
  else if (location.pathname.includes('/alerts')) title = "Low Stock Alerts";

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <Construction size={40} style={{ color: '#64748b' }} />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
        {title}
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.6' }}>
        This module is part of the upcoming Phase 2 inventory tracking expansion. 
        It will feature dedicated tables and real-time data sync for this specific section.
      </p>
      <div style={{ marginTop: '32px', padding: '16px 24px', background: '#eff6ff', border: '1px dashed #bfdbfe', borderRadius: '12px', color: '#1e40af', fontSize: '14px', fontWeight: '500' }}>
        Tell the AI to "Build this module next" if you want to prioritize it!
      </div>
    </div>
  );
}
