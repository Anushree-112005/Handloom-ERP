import React, { useState } from 'react';
import { 
  Briefcase, BookOpen, Receipt, FileText, CreditCard, PieChart, TrendingUp 
} from 'lucide-react';

import LedgerMaster from './LedgerMaster';
import PurchaseVoucher from './PurchaseVoucher';
import SalesVoucher from './SalesVoucher';
import PaymentReceiptVoucher from './PaymentReceiptVoucher';
import FinanceReports from './FinanceReports';

export default function SalesFinanceDesk() {
  const [activeTab, setActiveTab] = useState('Overview');

  const TABS = [
    { id: 'Overview', label: 'Dashboard & P&L', icon: PieChart },
    { id: 'Ledgers', label: 'Ledger Master', icon: BookOpen },
    { id: 'Purchase', label: 'Purchase Bills', icon: Receipt },
    { id: 'Sales', label: 'Sales Invoices', icon: FileText },
    { id: 'Payment', label: 'Payments (Outward)', icon: CreditCard },
    { id: 'Receipt', label: 'Receipts (Inward)', icon: CreditCard },
    { id: 'TrialBalance', label: 'Trial Balance', icon: TrendingUp },
  ];

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={24} color="#8b5cf6" /> Finance Module
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Real-time accounting integrated directly with production and sales.
          </p>
        </div>
      </div>

      {/* TABS HEADER */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: '8px',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-primary)',
                border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT AREA */}
      <div>
        {activeTab === 'Overview' && <FinanceReports type="pnl" />}
        {activeTab === 'TrialBalance' && <FinanceReports type="trial-balance" />}
        {activeTab === 'Ledgers' && <LedgerMaster />}
        {activeTab === 'Purchase' && <PurchaseVoucher />}
        {activeTab === 'Sales' && <SalesVoucher />}
        {activeTab === 'Payment' && <PaymentReceiptVoucher type="Payment" />}
        {activeTab === 'Receipt' && <PaymentReceiptVoucher type="Receipt" />}
      </div>
    </div>
  );
}
