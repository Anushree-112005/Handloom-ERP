import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, TrendingDown, BookOpen, AlertTriangle } from 'lucide-react';
import { reportsAPI } from '../../../services/financeApi';

export default function FinanceReports({ type = 'pnl' }) {
  // type: 'pnl', 'trial-balance', 'aging'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [type]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      if (type === 'pnl') {
        const res = await reportsAPI.profitLoss();
        setData(res.data);
      } else if (type === 'trial-balance') {
        const res = await reportsAPI.trialBalance();
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate report. Make sure vouchers are posted.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Generating report...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <AlertTriangle size={32} />
        {error}
      </div>
    );
  }

  if (type === 'pnl' && data) {
    const revenue = data.income || 0;
    const expense = data.expense || 0;
    const profit = revenue - expense;
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} color="var(--primary)" /> Profit & Loss Account
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Real-time computation of income vs expenses.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: 32 }}>
          <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Total Income</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>₹{revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Total Expenses (Cost)</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>₹{expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Net Profit</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: profit >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
              ₹{profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 13, color: profit >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: 8, fontWeight: 600 }}>
              {profit >= 0 ? '+' : ''}{profitMargin}% Margin
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Income Side */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', fontWeight: 600 }}>Income (Credit)</div>
            <div style={{ padding: 20 }}>
              {/* Detailed Breakdown would go here if API returned it */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>Sales Accounts</span>
                <span style={{ fontWeight: 600 }}>₹{revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Expense Side */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', fontWeight: 600 }}>Expenses (Debit)</div>
            <div style={{ padding: 20 }}>
               {/* Detailed Breakdown would go here if API returned it */}
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>Purchase & Job Work</span>
                <span style={{ fontWeight: 600 }}>₹{expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'trial-balance' && data) {
    const totalDr = data.reduce((sum, item) => sum + (item.dr || 0), 0);
    const totalCr = data.reduce((sum, item) => sum + (item.cr || 0), 0);

    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={20} color="var(--primary)" /> Trial Balance
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Summary of all ledger balances.</p>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Ledger / Group</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>Debit (Dr)</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>Credit (Cr)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.ledger_name}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {item.dr > 0 ? `₹${item.dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {item.cr > 0 ? `₹${item.cr.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                <td style={{ padding: '16px', textAlign: 'right' }}>TOTAL</td>
                <td style={{ padding: '16px', textAlign: 'right', color: totalDr === totalCr ? 'var(--text-primary)' : 'var(--danger)' }}>
                  ₹{totalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '16px', textAlign: 'right', color: totalDr === totalCr ? 'var(--text-primary)' : 'var(--danger)' }}>
                  ₹{totalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
