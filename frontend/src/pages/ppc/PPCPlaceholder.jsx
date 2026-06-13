import React from 'react';
import { Construction } from 'lucide-react';

export default function PPCPlaceholder({ title }) {
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <Construction size={64} style={{ color: 'var(--primary)', marginBottom: 24 }} />
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
        This module is currently under construction. It will be available in the upcoming development sprint.
      </p>
    </div>
  );
}
