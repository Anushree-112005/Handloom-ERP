import React, { useState, useEffect, useMemo } from 'react';
import { mockDb } from './mockDb';
import { 
  FileText, Search, Download, Printer, Filter, ChevronRight, 
  AlertTriangle, RefreshCw, Layers, Settings, ArrowDownLeft, PieChart as PieIcon,
  Receipt, ClipboardList, PlusCircle, CheckSquare, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function StoresReport({ defaultTab = 'stock' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Data states
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [issues, setIssues] = useState([]);
  const [grns, setGrns] = useState([]);

  // Search & Filter states
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sync defaultTab prop to activeTab state
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Load data
  const loadData = () => {
    setItems(mockDb.get('consumables_items') || []);
    setCategories(mockDb.get('consumables_categories') || []);
    setLedger(mockDb.get('consumables_ledger') || []);
    setIssues(mockDb.get('consumables_issues') || []);
    setGrns(mockDb.get('consumables_grns') || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Stock Inventory Filtering
  const filteredStock = useMemo(() => {
    return items.filter(i => {
      const matchCat = categoryFilter === '' || i.category === categoryFilter;
      const matchSearch = searchTerm === '' || 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.code || i.id).toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, categoryFilter, searchTerm]);

  // 2. Stock Ledger Filtering
  const filteredLedger = useMemo(() => {
    return ledger.filter(l => {
      const detail = items.find(x => x.id === l.itemId) || {};
      const matchItem = selectedItem === '' || l.itemId === selectedItem;
      const matchSearch = searchTerm === '' || 
        (detail.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.refId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.refType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDateFrom = dateFrom === '' || l.date >= dateFrom;
      const matchDateTo = dateTo === '' || l.date <= dateTo;
      return matchItem && matchSearch && matchDateFrom && matchDateTo;
    });
  }, [ledger, items, selectedItem, searchTerm, dateFrom, dateTo]);

  // 3. Consumption Filtering
  const filteredIssues = useMemo(() => {
    return issues.filter(iss => {
      const matchSearch = searchTerm === '' || 
        iss.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        iss.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        iss.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDateFrom = dateFrom === '' || iss.date >= dateFrom;
      const matchDateTo = dateTo === '' || iss.date <= dateTo;
      return matchSearch && matchDateFrom && matchDateTo;
    });
  }, [issues, searchTerm, dateFrom, dateTo]);

  // 4. Purchase Filtering
  const filteredGrns = useMemo(() => {
    return grns.filter(g => {
      const matchSearch = searchTerm === '' || 
        g.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.poId || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchDateFrom = dateFrom === '' || g.date >= dateFrom;
      const matchDateTo = dateTo === '' || g.date <= dateTo;
      return matchSearch && matchDateFrom && matchDateTo;
    });
  }, [grns, searchTerm, dateFrom, dateTo]);

  // 5. Reorder Alerts Filtering
  const lowStockItems = useMemo(() => {
    return items.filter(i => {
      const isLow = (i.currentStock || 0) <= i.minStock;
      if (!isLow) return false;
      const matchCat = categoryFilter === '' || i.category === categoryFilter;
      const matchSearch = searchTerm === '' || 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.code || i.id).toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, categoryFilter, searchTerm]);

  // 6. Audit Trail Filtering
  const auditEntries = useMemo(() => {
    const rawAudits = ledger.filter(x => x.refType.includes('Adjustment') || x.refType.includes('Audit'));
    return rawAudits.filter(a => {
      const detail = items.find(x => x.id === a.itemId) || {};
      const matchSearch = searchTerm === '' || 
        (detail.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.refId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.refType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDateFrom = dateFrom === '' || a.date >= dateFrom;
      const matchDateTo = dateTo === '' || a.date <= dateTo;
      return matchSearch && matchDateFrom && matchDateTo;
    });
  }, [ledger, items, searchTerm, dateFrom, dateTo]);

  // Calculations
  const totalValuation = useMemo(() => {
    return items.reduce((acc, i) => acc + ((i.currentStock || 0) * (i.rate || 0)), 0);
  }, [items]);

  const totalConsumptionValue = useMemo(() => {
    return issues.reduce((acc, iss) => {
      let val = 0;
      iss.items.forEach(line => {
        const detail = items.find(x => x.id === line.itemId);
        val += line.qty * (detail?.rate || 0);
      });
      return acc + val;
    }, 0);
  }, [issues, items]);

  const totalPurchaseValue = useMemo(() => {
    return grns.reduce((acc, g) => {
      const val = g.items.reduce((sum, i) => sum + (i.acceptedQty * i.rate), 0);
      return acc + val;
    }, 0);
  }, [grns]);

  // Department Consumption breakdown for charts
  const deptSummary = useMemo(() => {
    const summary = {};
    issues.forEach(iss => {
      let val = 0;
      iss.items.forEach(line => {
        const detail = items.find(x => x.id === line.itemId);
        val += line.qty * (detail?.rate || 0);
      });
      summary[iss.department] = (summary[iss.department] || 0) + val;
    });
    return Object.keys(summary).map(dept => ({
      name: dept,
      value: summary[dept]
    }));
  }, [issues, items]);

  // Category Stock valuation distribution for charts
  const categoryStockValuation = useMemo(() => {
    const dist = {};
    items.forEach(i => {
      const val = (i.currentStock || 0) * (i.rate || 0);
      dist[i.category] = (dist[i.category] || 0) + val;
    });
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    return Object.keys(dist).map((cat, idx) => ({
      name: cat,
      value: dist[cat],
      color: colors[idx % colors.length]
    })).filter(x => x.value > 0);
  }, [items]);

  // Reorder Trigger Action
  const handleQuickRequisition = () => {
    const lowStockItemsAll = items.filter(i => (i.currentStock || 0) <= i.minStock);
    if (lowStockItemsAll.length === 0) {
      alert('All items have healthy stock levels.');
      return;
    }
    const reqObj = {
      id: 'PRQ' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      requestedBy: 'System Auto-Trigger',
      status: 'Approved',
      items: lowStockItemsAll.map(i => ({
        itemId: i.id,
        name: i.name,
        currentStock: i.currentStock || 0,
        minStock: i.minStock,
        qty: i.reorderQty || 50
      }))
    };
    const current = mockDb.get('consumables_requisitions') || [];
    current.push(reqObj);
    mockDb.set('consumables_requisitions', current);
    alert('Auto Reorder Requisition slip raised successfully!');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setCategoryFilter('');
    setSelectedItem('');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  // Export Excel Action
  const handleExportExcel = () => {
    let data = [];
    let fileName = '';

    if (activeTab === 'stock') {
      data = filteredStock.map(i => ({
        'Item Code': i.code || i.id,
        'Item Name': i.name,
        'Category': i.category,
        'UOM': i.uom,
        'Current Stock': i.currentStock || 0,
        'Rate': i.rate,
        'Total Valuation': (i.currentStock || 0) * i.rate
      }));
      fileName = 'Stores_Stock_Inventory_Report';
    } else if (activeTab === 'ledger') {
      data = filteredLedger.map(l => {
        const detail = items.find(x => x.id === l.itemId) || {};
        return {
          'Transaction ID': l.id,
          'Date': l.date,
          'Item': detail.name || l.itemId,
          'Reference Voucher': l.refId,
          'Transaction Type': l.refType,
          'In (Receipt)': l.inQty || 0,
          'Out (Issue)': l.outQty || 0,
          'Stock Balance': l.balance
        };
      });
      fileName = 'Stores_Stock_Ledger_Report';
    } else if (activeTab === 'consumption') {
      data = filteredIssues.map(iss => {
        const val = iss.items.reduce((sum, line) => {
          const detail = items.find(x => x.id === line.itemId);
          return sum + (line.qty * (detail?.rate || 0));
        }, 0);
        return {
          'Issue ID': iss.id,
          'Date': iss.date,
          'Department': iss.department,
          'Employee': iss.employee,
          'Purpose': iss.purpose,
          'Items Count': iss.items.length,
          'Consumption Value (Rs)': val
        };
      });
      fileName = 'Stores_Consumption_Analysis_Report';
    } else if (activeTab === 'purchase') {
      data = filteredGrns.map(g => {
        const val = g.items.reduce((sum, i) => sum + (i.acceptedQty * i.rate), 0);
        return {
          'GRN ID': g.id,
          'Date': g.date,
          'Vendor': g.vendor,
          'PO Reference': g.poId || 'N/A',
          'Invoice Number': g.invoiceNo || 'N/A',
          'Items Count': g.items.length,
          'Inward Value (Rs)': val
        };
      });
      fileName = 'Stores_Purchase_Analysis_Report';
    } else if (activeTab === 'reorder') {
      data = lowStockItems.map(i => ({
        'Item Code': i.code || i.id,
        'Item Name': i.name,
        'Category': i.category,
        'UOM': i.uom,
        'Min Stock Limit': i.minStock,
        'Available Stock': i.currentStock || 0,
        'Safety Stock': i.safetyStock,
        'Suggested Reorder Qty': i.reorderQty || 50
      }));
      fileName = 'Stores_Low_Stock_Alerts_Report';
    } else if (activeTab === 'audit') {
      data = auditEntries.map(entry => {
        const itm = items.find(x => x.id === entry.itemId);
        const isOut = entry.outQty > 0;
        return {
          'Audit ID': entry.id,
          'Date': entry.date,
          'Item Name': itm?.name || 'Item',
          'Correction Type': entry.refType,
          'Reference Code': entry.refId,
          'Deviation Qty': isOut ? -entry.outQty : entry.inQty
        };
      });
      fileName = 'Stores_Audit_Trail_Report';
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  // Export PDF Action
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait' });
    doc.setFont('helvetica', 'bold');
    doc.text(`DINESH EXPORTS TEXTILE ERP — STORES & CONSUMABLES`, 14, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    let title = '';
    let headers = [];
    let body = [];

    if (activeTab === 'stock') {
      title = 'STOCK INVENTORY VALUATION REPORT';
      headers = [['Item Code', 'Item Name', 'Category', 'UOM', 'Stock', 'Rate', 'Valuation']];
      body = filteredStock.map(i => [
        i.code || i.id,
        i.name,
        i.category,
        i.uom,
        i.currentStock || 0,
        `Rs.${i.rate}`,
        `Rs.${((i.currentStock || 0) * i.rate).toLocaleString()}`
      ]);
    } else if (activeTab === 'ledger') {
      title = 'STOCK TRANSACTION LEDGER';
      headers = [['Date', 'Item', 'Reference', 'Type', 'In', 'Out', 'Balance']];
      body = filteredLedger.map(l => {
        const detail = items.find(x => x.id === l.itemId) || {};
        return [
          l.date,
          detail.name || l.itemId,
          l.refId,
          l.refType,
          l.inQty ? `+${l.inQty}` : '-',
          l.outQty ? `-${l.outQty}` : '-',
          l.balance
        ];
      });
    } else if (activeTab === 'consumption') {
      title = 'DEPARTMENT-WISE CONSUMPTION AUDIT';
      headers = [['Issue ID', 'Date', 'Department', 'Employee', 'Items Count', 'Total Cost']];
      body = filteredIssues.map(iss => {
        const val = iss.items.reduce((sum, line) => {
          const detail = items.find(x => x.id === line.itemId);
          return sum + (line.qty * (detail?.rate || 0));
        }, 0);
        return [
          iss.id,
          iss.date,
          iss.department,
          iss.employee,
          iss.items.length,
          `Rs.${val.toLocaleString()}`
        ];
      });
    } else if (activeTab === 'purchase') {
      title = 'VENDOR PURCHASE & STOCK INWARDS';
      headers = [['GRN ID', 'Date', 'Vendor', 'PO Ref', 'Invoice No', 'Value']];
      body = filteredGrns.map(g => {
        const val = g.items.reduce((sum, i) => sum + (i.acceptedQty * i.rate), 0);
        return [
          g.id,
          g.date,
          g.vendor,
          g.poId || 'N/A',
          g.invoiceNo || 'N/A',
          `Rs.${val.toLocaleString()}`
        ];
      });
    } else if (activeTab === 'reorder') {
      title = 'LOW STOCK & SAFETY PARAMETER EXCEEDED';
      headers = [['Code', 'Item Name', 'Category', 'Min Stock', 'Available', 'Reorder Qty']];
      body = lowStockItems.map(i => [
        i.code || i.id,
        i.name,
        i.category,
        i.minStock,
        i.currentStock || 0,
        i.reorderQty || 50
      ]);
    } else if (activeTab === 'audit') {
      title = 'MANUAL STOCK ADJUSTMENTS & RECONCILIATIONS';
      headers = [['Audit ID', 'Date', 'Item Name', 'Correction Type', 'Voucher', 'Deviation']];
      body = auditEntries.map(entry => {
        const itm = items.find(x => x.id === entry.itemId);
        const isOut = entry.outQty > 0;
        return [
          entry.id,
          entry.date,
          itm?.name || 'Item',
          entry.refType,
          entry.refId,
          isOut ? `-${entry.outQty}` : `+${entry.inQty}`
        ];
      });
    }

    doc.text(`${title} (Scope: ${activeTab.toUpperCase()})`, 14, 21);
    doc.text(`Generated on: ${new Date().toISOString().substring(0, 10)}`, 14, 26);

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 32,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] } // Indigo header
    });

    doc.save(`Stores_${activeTab}_Report.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER BAR */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <BarChart3 size={26} style={{ color: '#6366f1' }} /> Stores Reports & Analytics
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '500' }}>
            Unified dashboard for stock valuation, department consumption logs, vendor purchases, reorder safety and audit logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Download size={16} style={{ color: '#15803d' }} /> Export Excel
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <FileText size={16} style={{ color: '#6366f1' }} /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #6366f1', padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Inventory Valuation</span>
          <h3 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>₹{totalValuation.toLocaleString()}</h3>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active items in stores</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #ef4444', padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Low Stock Items</span>
          <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#ef4444', margin: '8px 0 4px 0' }}>{items.filter(i => (i.currentStock || 0) <= i.minStock).length} Alerts</h3>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Action recommended</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Purchases</span>
          <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#10b981', margin: '8px 0 4px 0' }}>₹{totalPurchaseValue.toLocaleString()}</h3>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Goods Inward value</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Consumption</span>
          <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#f59e0b', margin: '8px 0 4px 0' }}>₹{totalConsumptionValue.toLocaleString()}</h3>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Department issues cost</span>
        </div>
      </div>

      {/* REPORT TYPE SELECTOR TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '24px' }}>
        {[
          { key: 'stock', label: 'Stock Inventory', icon: PieIcon },
          { key: 'ledger', label: 'Stock Ledger', icon: FileText },
          { key: 'consumption', label: 'Consumption Analysis', icon: PieIcon },
          { key: 'purchase', label: 'Purchase Analysis', icon: Receipt },
          { key: 'reorder', label: 'Low Stock Alerts', icon: AlertTriangle },
          { key: 'audit', label: 'Audit Trail', icon: ClipboardList }
        ].map(tab => {
          const isSelected = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                handleResetFilters();
              }}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 800,
                border: 'none',
                background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                color: isSelected ? '#6366f1' : 'var(--text-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* CHARTS AND VISUALIZATIONS SECTION */}
      {['stock', 'consumption'].includes(activeTab) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          
          {activeTab === 'stock' && (
            <>
              {/* Chart 1: Stock Level Comparer */}
              <div className="card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>📊 Stock Levels (Available vs Min limit)</span>
                  <span style={{ color: '#6366f1', fontSize: '12px' }}>First 6 items</span>
                </h4>
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={items.slice(0, 6)} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                      <Tooltip />
                      <Legend style={{ fontSize: '12px' }} />
                      <Bar dataKey="currentStock" name="Current Stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="minStock" name="Min Limit" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Category Distribution */}
              <div className="card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                  🧶 Category Stock Valuation (Rs)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'center', height: '240px' }}>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStockValuation}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryStockValuation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {categoryStockValuation.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px' }}>{item.name}:</span>
                        <span style={{ color: 'var(--text-muted)' }}>₹{(item.value/1000).toFixed(1)}k</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'consumption' && (
            <>
              {/* Chart 1: Department Consumption Bar */}
              <div className="card" style={{ padding: '24px', gridColumn: 'span 2' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
                  📈 Department-wise Total Consumption Cost Value (₹)
                </h4>
                <div style={{ width: '100%', height: '260px' }}>
                  {deptSummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptSummary} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        <Bar dataKey="value" name="Value (₹)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      No department consumption records found.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* FILTERS AND SEARCH PANEL */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} /> Report Filter parameters
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 100px', gap: '16px', alignItems: 'flex-end' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Keyword Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search Item code, Name, Ref No..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', margin: 0, fontSize: '13px' }}
              />
            </div>
          </div>

          {['stock', 'reorder'].includes(activeTab) && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Category</label>
              <select className="form-control" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ margin: 0, fontSize: '13px' }}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Filter by Item</label>
              <select className="form-control" value={selectedItem} onChange={e => setSelectedItem(e.target.value)} style={{ margin: 0, fontSize: '13px' }}>
                <option value="">All Items</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          )}

          {['ledger', 'consumption', 'purchase', 'audit'].includes(activeTab) && (
            <>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Date From</label>
                <input type="date" className="form-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ margin: 0, fontSize: '13px' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Date To</label>
                <input type="date" className="form-control" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ margin: 0, fontSize: '13px' }} />
              </div>
            </>
          )}

          <button 
            className="btn btn-secondary" 
            style={{ padding: '9px', fontSize: '13px', justifyContent: 'center', margin: 0 }} 
            onClick={handleResetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      {/* DYNAMIC REPORT CONTENT TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>
              {activeTab.replace('-', ' ')} Ledger List
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing matching report entries
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {activeTab === 'reorder' && (
              <button onClick={handleQuickRequisition} className="btn btn-success" style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlusCircle size={14} /> Quick Reorder Requisition
              </button>
            )}
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={handlePrint}>
              <Printer size={12} /> Print Report
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'stock' && (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>UOM</th>
                  <th style={{ textAlign: "right" }}>Stock</th>
                  <th style={{ textAlign: "right" }}>Rate</th>
                  <th style={{ textAlign: "right" }}>Valuation</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No stock items match this filter criteria.</td>
                  </tr>
                ) : (
                  filteredStock.map(i => (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{i.code || i.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{i.name}</td>
                      <td>{i.category}</td>
                      <td>{i.uom}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: (i.currentStock || 0) <= i.minStock ? '#d97706' : 'var(--text-primary)' }}>
                        {i.currentStock || 0}
                      </td>
                      <td style={{ textAlign: 'right' }}>₹{i.rate}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#6366f1' }}>₹{((i.currentStock || 0) * i.rate).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'ledger' && (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Item Name</th>
                  <th>Reference Voucher</th>
                  <th>Transaction Type</th>
                  <th style={{ textAlign: "right" }}>In (Receipt)</th>
                  <th style={{ textAlign: "right" }}>Out (Issue)</th>
                  <th style={{ textAlign: "right" }}>Stock Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transaction ledger records match this filter criteria.</td>
                  </tr>
                ) : (
                  filteredLedger.map(l => {
                    const detail = items.find(x => x.id === l.itemId) || {};
                    return (
                      <tr key={l.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{l.id}</td>
                        <td>{l.date}</td>
                        <td style={{ fontWeight: 600 }}>{detail.name || l.itemId}</td>
                        <td style={{ fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>{l.refId}</td>
                        <td>{l.refType}</td>
                        <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{l.inQty > 0 ? `+${l.inQty}` : '-'}</td>
                        <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>{l.outQty > 0 ? `-${l.outQty}` : '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{l.balance}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'consumption' && (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Date</th>
                  <th>Department</th>
                  <th>Employee</th>
                  <th>Purpose</th>
                  <th style={{ textAlign: "right" }}>Items Count</th>
                  <th style={{ textAlign: "right" }}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No department issues match this filter criteria.</td>
                  </tr>
                ) : (
                  filteredIssues.map(iss => {
                    const val = iss.items.reduce((sum, line) => {
                      const detail = items.find(x => x.id === line.itemId);
                      return sum + (line.qty * (detail?.rate || 0));
                    }, 0);
                    return (
                      <tr key={iss.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{iss.id}</td>
                        <td>{iss.date}</td>
                        <td style={{ fontWeight: 600 }}>🏢 {iss.department}</td>
                        <td>{iss.employee}</td>
                        <td>{iss.purpose}</td>
                        <td style={{ textAlign: 'right' }}>{iss.items.length}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#d97706' }}>₹{val.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'purchase' && (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>GRN No</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>PO ID</th>
                  <th>Invoice No</th>
                  <th style={{ textAlign: "right" }}>Total Items</th>
                  <th style={{ textAlign: "right" }}>Inward Cost</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrns.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No inward purchases match this filter criteria.</td>
                  </tr>
                ) : (
                  filteredGrns.map(grn => {
                    const inwardValue = grn.items.reduce((acc, i) => acc + (i.acceptedQty * i.rate), 0);
                    return (
                      <tr key={grn.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{grn.id}</td>
                        <td>{grn.date}</td>
                        <td style={{ fontWeight: 600 }}>{grn.vendor}</td>
                        <td style={{ fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>{grn.poId || '-'}</td>
                        <td>{grn.invoiceNo || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{grn.items.length}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>₹{inwardValue.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'reorder' && (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Min Stock Limit</th>
                  <th style={{ textAlign: "right" }}>Available Stock</th>
                  <th style={{ textAlign: "right" }}>Suggested Reorder Qty</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#10b981', fontWeight: 700 }}>
                      ✓ All items have healthy stock levels above minimum thresholds!
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map(i => (
                    <tr key={i.id} style={{ backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{i.code || i.id}</td>
                      <td style={{ fontWeight: 600, color: '#ef4444' }}>{i.name}</td>
                      <td>{i.category}</td>
                      <td style={{ textAlign: 'right' }}>{i.minStock}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '12px' }}>
                          {i.currentStock || 0}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#6366f1' }}>{i.reorderQty || 50}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'audit' && (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Date</th>
                  <th>Item Name</th>
                  <th>Correction Type</th>
                  <th>Reference Code</th>
                  <th style={{ textAlign: "right" }}>Deviation Qty</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No audit or discrepancy logs match this filter criteria.</td>
                  </tr>
                ) : (
                  auditEntries.map(entry => {
                    const itm = items.find(x => x.id === entry.itemId);
                    const isOut = entry.outQty > 0;
                    return (
                      <tr key={entry.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{entry.id}</td>
                        <td>{entry.date}</td>
                        <td style={{ fontWeight: 600 }}>{itm?.name || 'Item'}</td>
                        <td>{entry.refType}</td>
                        <td style={{ fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>{entry.refId}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: isOut ? '#ef4444' : '#10b981' }}>
                          {isOut ? `-${entry.outQty}` : `+${entry.inQty}`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
