import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Package, Receipt, ShoppingBag, ClipboardList, CheckCircle, AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    stockValue: 0,
    todayIssues: 0,
    todayReceipts: 0,
    pendingRequests: 0,
    pendingApprovals: 0,
    lowStockItems: 0,
    deadStockItems: 0
  });

  const [departmentData, setDepartmentData] = useState([]);
  const [recentLedger, setRecentLedger] = useState([]);
  const [maxDeptValue, setMaxDeptValue] = useState(20000);
  const [auditScore, setAuditScore] = useState('100.0%');

  useEffect(() => {
    // Calculate Stats
    const items = mockDb.get('consumables_items');
    const requests = mockDb.get('consumables_requests');
    const pos = mockDb.get('consumables_pos');
    const ledger = mockDb.get('consumables_ledger');
    const issues = mockDb.get('consumables_issues');
    const verifications = mockDb.get('consumables_verifications') || [];

    const totalVal = items.reduce((acc, x) => acc + ((x.currentStock || 0) * (x.rate || 0)), 0);
    const lowStockCount = items.filter(x => (x.currentStock || 0) <= (x.minStock || 0)).length;
    const pendingReqCount = requests.filter(x => x.status === 'Pending').length;
    const pendingPoCount = pos.filter(x => x.status === 'Draft' || x.status === 'Ordered').length;

    // Issues today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayIssuesVal = issues
      .filter(x => x.date === todayStr)
      .reduce((acc, x) => acc + x.items.reduce((sum, item) => sum + (item.qty * (item.rate || 0)), 0), 0);

    // Dead Stock Items (currentStock > 0 and no outbound ledger transactions)
    const deadStockCount = items.filter(itm => {
      if ((itm.currentStock || 0) <= 0) return false;
      const hasOutbound = ledger.some(l => l.itemId === itm.id && (l.outQty > 0 || l.refType === 'Issue' || l.refType === 'Transfer'));
      return !hasOutbound;
    }).length;

    setStats({
      stockValue: totalVal,
      todayIssues: todayIssuesVal,
      todayReceipts: 0,
      pendingRequests: pendingReqCount,
      pendingApprovals: pendingPoCount,
      lowStockItems: lowStockCount,
      deadStockItems: deadStockCount
    });

    // Calculate Audit Score
    if (verifications.length > 0) {
      const latestVer = verifications[verifications.length - 1];
      const totalSystem = (latestVer.items || []).reduce((sum, i) => sum + (i.systemQty || 0), 0);
      const totalDiff = (latestVer.items || []).reduce((sum, i) => sum + Math.abs(i.difference || 0), 0);
      if (totalSystem > 0) {
        const score = Math.max(0, Math.min(100, (1 - (totalDiff / totalSystem)) * 100));
        setAuditScore(score.toFixed(1) + '%');
      } else {
        setAuditScore('100.0%');
      }
    } else {
      setAuditScore('100.0%');
    }

    // Department wise consumption data calculated dynamically from issues
    const deptColors = {
      'Production': '#4f46e5',
      'HR & Admin': '#06b6d4',
      'Accounts': '#10b981',
      'Stores & Warehouse': '#f59e0b',
      'Quality Assurance': '#ec4899',
      'Accounts & Finance': '#10b981'
    };

    const deptTotals = {};
    issues.forEach(issue => {
      const dept = issue.department || 'Other';
      const issueTotal = (issue.items || []).reduce((sum, item) => {
        let rate = item.rate;
        if (rate === undefined || rate === null) {
          const matchedItem = items.find(itm => itm.id === item.itemId);
          rate = matchedItem ? (matchedItem.rate || 0) : 0;
        }
        return sum + ((item.qty || 0) * rate);
      }, 0);
      deptTotals[dept] = (deptTotals[dept] || 0) + issueTotal;
    });

    const defaultDepts = mockDb.get('consumables_departments') || [];
    const allDeptNames = Array.from(new Set([...defaultDepts.map(d => d.name), ...Object.keys(deptTotals)]));
    
    const computedDeptData = allDeptNames.map(name => ({
      name,
      value: deptTotals[name] || 0,
      color: deptColors[name] || '#6366f1'
    })).sort((a, b) => b.value - a.value);

    setDepartmentData(computedDeptData);
    
    const maxVal = Math.max(...computedDeptData.map(d => d.value), 20000);
    setMaxDeptValue(maxVal);

    setRecentLedger(ledger.slice(-5).reverse());
  }, []);

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Package style={{ color: 'var(--primary)' }} size={28} />
            Stationery & Consumables Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>Real-time stock valuation, item requests, and consumption audits</p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>₹{stats.stockValue.toLocaleString()}</h3>
            <p>Stock Value</p>
          </div>
        </div>

        <div className="card stat-card" style={{ '--stat-color': 'var(--secondary)' }}>
          <div className="stat-icon" style={{ background: 'rgba(8, 145, 178, 0.1)', color: 'var(--secondary)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>₹{stats.todayIssues.toLocaleString()}</h3>
            <p>Today's Issues</p>
          </div>
        </div>

        <div className="card stat-card" style={{ '--stat-color': 'var(--success)' }}>
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)' }}>
            <Receipt size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.pendingApprovals} POs</h3>
            <p>Pending POs</p>
          </div>
        </div>

        <div className="card stat-card" style={{ '--stat-color': 'var(--accent)' }}>
          <div className="stat-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--accent)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.lowStockItems} Items</h3>
            <p>Low Stock Alert</p>
          </div>
        </div>
      </div>

      {/* Grid of Chart and Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Department Consumption */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 style={{ color: 'var(--primary)' }} size={20} /> Department Wise Monthly Consumption
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {departmentData.map((dept, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{dept.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{dept.value.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', background: 'var(--bg-secondary)', borderRadius: 100, height: 8 }}>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 100,
                        width: `${maxDeptValue > 0 ? (dept.value / maxDeptValue) * 100 : 0}%`,
                        backgroundColor: dept.color,
                        transition: 'width 0.6s ease'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Stock Breakdown Status</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)' }}>{stats.pendingRequests}</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>Pending Material Requests</p>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)' }}>{auditScore}</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>Audit Score</p>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{stats.deadStockItems}</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>Dead Stock Items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Movement Ledger */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList style={{ color: 'var(--primary)' }} size={20} /> Recent Stock Movements
            </h3>
          </div>
          <div>
            {recentLedger.map((log) => (
              <div key={log.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.refType} ({log.refId})
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Date: {log.date}
                  </p>
                </div>
                <div>
                  {log.inQty > 0 ? (
                    <span className="badge badge-active">+{log.inQty} In</span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)' }}>-{log.outQty} Out</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
