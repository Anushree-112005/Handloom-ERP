import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Search, Filter, Download, ArrowLeft, Save, 
  Trash2, Eye, Activity, Box, Settings, Users, Truck, CheckSquare,
  BarChart2, X, AlertTriangle, IndianRupee, PieChart, TrendingUp, TrendingDown,
  Calculator, RefreshCw, Printer, Beaker
} from 'lucide-react';
import { costingSheetAPI, buyerOrderAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Constants
const TABS = [
  { id: 'general', label: 'General Info', icon: FileText },
  { id: 'bom', label: 'Bill of Materials', icon: Box },
  { id: 'process', label: 'Process Cost', icon: Settings },
  { id: 'labour', label: 'Labour Cost', icon: Users },
  { id: 'machine', label: 'Machine Cost', icon: Activity },
  { id: 'overhead', label: 'Overhead Cost', icon: BarChart2 },
  { id: 'logistics', label: 'Logistics & Packing', icon: Truck },
  { id: 'testing', label: 'Testing Cost', icon: Beaker },
  { id: 'wastage', label: 'Wastage', icon: AlertTriangle },
  { id: 'summary', label: 'Cost Summary', icon: PieChart }
];

export default function CostingSheetModule() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [sheets, setSheets] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(getInitialState());

  function getInitialState() {
    return {
      costing_no: '', buyer: '', buyer_order: '', sales_order: '', product: '', style_no: '',
      fabric_type: '', fabric_construction: '', gsm: '', width: '', color: '', quantity: 0,
      unit: 'Kg', delivery_date: '', currency: 'INR', exchange_rate: 1, remarks: '', status: 'Draft',
      bom_items: [], process_costs: [], labour_costs: [], machine_costs: [],
      overhead_costs: [], logistics_packing: { cartons: 0, shipping: 0 }, testing_costs: [], wastage: [],
      estimated_cost: 0, actual_cost: 0, selling_price: 0, profit_margin_pct: 0
    };
  }

  useEffect(() => {
    fetchSheets();
    fetchBuyerOrders();
  }, []);

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const res = await costingSheetAPI.list();
      setSheets(res.data || []);
    } catch (err) {
      console.error("Failed to fetch costing sheets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyerOrders = async () => {
    try {
      const res = await buyerOrderAPI.list();
      setBuyerOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch buyer orders:", err);
    }
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      if (payload.delivery_date === '') payload.delivery_date = null;
      if (payload.approval_date === '') payload.approval_date = null;

      if (formData.id) {
        await costingSheetAPI.update(formData.id, payload);
      } else {
        await costingSheetAPI.create(payload);
      }
      fetchSheets();
      setView('list');
    } catch (err) {
      console.error("Save error:", err.response?.data || err);
      alert("Failed to save costing sheet.");
    }
  };

  const handleCreate = () => {
    setFormData(getInitialState());
    setActiveTab('general');
    setView('form');
  };

  // Autocalculation
  const updateTotals = (data) => {
    let est = 0;
    let act = 0;

    data.bom_items.forEach(i => { est += (i.amount || 0); act += (i.actual_amount || 0); });
    data.process_costs.forEach(i => { est += (i.estimated_cost || 0); act += (i.actual_cost || 0); });
    data.labour_costs.forEach(i => { est += (i.estimated_cost || 0); act += (i.actual_cost || 0); });
    data.machine_costs.forEach(i => { est += (i.estimated_cost || 0); act += (i.actual_cost || 0); });
    data.overhead_costs.forEach(i => { est += (i.estimated_cost || 0); act += (i.actual_cost || 0); });
    
    const pk = data.logistics_packing || {};
    est += (pk.cartons_est || 0) + (pk.shipping_est || 0);
    act += (pk.cartons_act || 0) + (pk.shipping_act || 0);

    data.testing_costs.forEach(i => { est += (i.estimated_cost || 0); act += (i.actual_cost || 0); });
    data.wastage.forEach(i => { est += (i.estimated_cost || 0); act += (i.actual_cost || 0); });

    data.estimated_cost = est;
    data.actual_cost = act;

    if (data.selling_price) {
      data.profit_margin_pct = ((data.selling_price - est) / data.selling_price) * 100;
    }

    setFormData({ ...data });
  };

  const handleBuyerOrderSelect = (orderNo) => {
    const order = buyerOrders.find(o => o.ibpo_number === orderNo);
    if (order) {
      setFormData(prev => ({
        ...prev,
        buyer_order: order.ibpo_number,
        buyer: order.buyer_name || order.party_name || '',
        product: order.order_type || 'Apparel',
        quantity: order.items && order.items.length > 0 ? order.items[0].total_quantity : 1000,
        delivery_date: order.delivery_date || '',
      }));
    } else {
      setFormData(prev => ({ ...prev, buyer_order: orderNo }));
    }
  };

  const renderGeneralTab = () => (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div className="form-group">
        <label>Costing Number</label>
        <input type="text" className="input-field" disabled value={formData.costing_no || 'Auto Generated'} />
      </div>
      <div className="form-group">
        <label>Buyer Order</label>
        <select className="input-field" value={formData.buyer_order || ''} onChange={e => handleBuyerOrderSelect(e.target.value)}>
          <option value="">Select Buyer Order</option>
          {buyerOrders.map(bo => (
            <option key={bo.id} value={bo.ibpo_number}>{bo.ibpo_number} - {bo.buyer_name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Buyer</label>
        <input type="text" className="input-field" value={formData.buyer || ''} onChange={e => setFormData({...formData, buyer: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Product</label>
        <input type="text" className="input-field" value={formData.product || ''} onChange={e => setFormData({...formData, product: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Quantity</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="number" className="input-field" value={formData.quantity || 0} onChange={e => { formData.quantity = parseFloat(e.target.value) || 0; updateTotals(formData); }} />
          <select className="input-field" style={{ width: '100px' }} value={formData.unit || 'Kg'} onChange={e => setFormData({...formData, unit: e.target.value})}>
            <option>Kg</option><option>Mtr</option><option>Pcs</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Fabric Type</label>
        <input type="text" className="input-field" value={formData.fabric_type || ''} onChange={e => setFormData({...formData, fabric_type: e.target.value})} />
      </div>
      <div className="form-group">
        <label>GSM & Width</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="GSM" className="input-field" value={formData.gsm || ''} onChange={e => setFormData({...formData, gsm: e.target.value})} />
          <input type="text" placeholder="Width" className="input-field" value={formData.width || ''} onChange={e => setFormData({...formData, width: e.target.value})} />
        </div>
      </div>
      <div className="form-group">
        <label>Delivery Date</label>
        <input type="date" className="input-field" value={formData.delivery_date || ''} onChange={e => setFormData({...formData, delivery_date: e.target.value})} />
      </div>
      <div className="form-group">
        <label>Status</label>
        <select className="input-field" value={formData.status || 'Draft'} onChange={e => setFormData({...formData, status: e.target.value})}>
          <option value="Draft">Draft</option>
          <option value="Under Review">Under Review</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Production Started">Production Started</option>
          <option value="Production Completed">Production Completed</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div style={{ gridColumn: 'span 2', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <h4 style={{ marginBottom: '16px' }}>Approval Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label>Prepared By</label>
            <input type="text" className="input-field" value={formData.prepared_by || ''} onChange={e => setFormData({...formData, prepared_by: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Reviewed By</label>
            <input type="text" className="input-field" value={formData.reviewed_by || ''} onChange={e => setFormData({...formData, reviewed_by: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Approved By</label>
            <input type="text" className="input-field" value={formData.approved_by || ''} onChange={e => setFormData({...formData, approved_by: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Approval Date</label>
            <input type="date" className="input-field" value={formData.approval_date || ''} onChange={e => setFormData({...formData, approval_date: e.target.value})} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTable = (field, columns) => {
    const list = formData[field] || [];
    return (
      <div style={{ padding: '24px' }}>
        <table className="table" style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              {columns.map(c => <th key={c.key}>{c.label}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, idx) => (
              <tr key={idx}>
                {columns.map(c => (
                  <td key={c.key}>
                    <input 
                      type={c.type || 'text'} 
                      className="input-field" 
                      style={{ padding: '4px', height: '30px' }}
                      value={item[c.key] || ''} 
                      onChange={e => {
                        const val = c.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                        const newList = [...list];
                        newList[idx][c.key] = val;
                        if (field === 'bom_items' && (c.key === 'req_qty' || c.key === 'unit_price')) {
                          newList[idx].amount = (newList[idx].req_qty || 0) * (newList[idx].unit_price || 0);
                        }
                        formData[field] = newList;
                        updateTotals(formData);
                      }} 
                    />
                  </td>
                ))}
                <td>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => {
                    const newList = list.filter((_, i) => i !== idx);
                    formData[field] = newList;
                    updateTotals(formData);
                  }}><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => {
          const newItem = {};
          columns.forEach(c => newItem[c.key] = c.type === 'number' ? 0 : '');
          formData[field] = [...list, newItem];
          updateTotals(formData);
        }}>
          <Plus size={16} /> Add Row
        </button>
      </div>
    );
  };

  const renderLogisticsTab = () => {
    const pk = formData.logistics_packing || {};
    return (
      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h4>Packing Cost</h4>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Estimated Cartons/Poly Bags Cost</label>
            <input type="number" className="input-field" value={pk.cartons_est || 0} onChange={e => {
              formData.logistics_packing = { ...pk, cartons_est: parseFloat(e.target.value) || 0 };
              updateTotals(formData);
            }}/>
          </div>
          <div className="form-group">
            <label>Actual Cartons/Poly Bags Cost</label>
            <input type="number" className="input-field" value={pk.cartons_act || 0} onChange={e => {
              formData.logistics_packing = { ...pk, cartons_act: parseFloat(e.target.value) || 0 };
              updateTotals(formData);
            }}/>
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <h4>Logistics & Transport</h4>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Estimated Transport/Shipping Cost</label>
            <input type="number" className="input-field" value={pk.shipping_est || 0} onChange={e => {
              formData.logistics_packing = { ...pk, shipping_est: parseFloat(e.target.value) || 0 };
              updateTotals(formData);
            }}/>
          </div>
          <div className="form-group">
            <label>Actual Transport/Shipping Cost</label>
            <input type="number" className="input-field" value={pk.shipping_act || 0} onChange={e => {
              formData.logistics_packing = { ...pk, shipping_act: parseFloat(e.target.value) || 0 };
              updateTotals(formData);
            }}/>
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryTab = () => {
    const v = formData;
    const isOver = v.actual_cost > v.estimated_cost;
    const pColor = v.profit_margin_pct >= 15 ? 'green' : v.profit_margin_pct >= 5 ? 'orange' : 'red';

    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Estimated Cost</h4>
            <h2><IndianRupee size={20}/> {v.estimated_cost.toFixed(2)}</h2>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: `4px solid ${isOver ? 'red' : 'green'}` }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Actual Cost</h4>
            <h2><IndianRupee size={20}/> {v.actual_cost.toFixed(2)}</h2>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: `4px solid ${pColor}` }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Profit Margin</h4>
            <h2>{v.profit_margin_pct.toFixed(2)} %</h2>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h4>Cost Breakdown</h4>
          <table className="table" style={{ width: '100%', marginTop: '16px' }}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Estimated (<IndianRupee size={12}/>)</th>
                <th>Actual (<IndianRupee size={12}/>)</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {['Materials', 'Process', 'Labour', 'Machine', 'Overhead', 'Logistics', 'Testing', 'Wastage'].map((cat, idx) => {
                let est = 0, act = 0;
                if (cat === 'Materials') { est = v.bom_items.reduce((s,i)=>s+(i.amount||0),0); act = v.bom_items.reduce((s,i)=>s+(i.actual_amount||0),0); }
                if (cat === 'Process') { est = v.process_costs.reduce((s,i)=>s+(i.estimated_cost||0),0); act = v.process_costs.reduce((s,i)=>s+(i.actual_cost||0),0); }
                if (cat === 'Labour') { est = v.labour_costs.reduce((s,i)=>s+(i.estimated_cost||0),0); act = v.labour_costs.reduce((s,i)=>s+(i.actual_cost||0),0); }
                if (cat === 'Machine') { est = v.machine_costs.reduce((s,i)=>s+(i.estimated_cost||0),0); act = v.machine_costs.reduce((s,i)=>s+(i.actual_cost||0),0); }
                if (cat === 'Overhead') { est = v.overhead_costs.reduce((s,i)=>s+(i.estimated_cost||0),0); act = v.overhead_costs.reduce((s,i)=>s+(i.actual_cost||0),0); }
                if (cat === 'Logistics') { est = (v.logistics_packing.cartons_est||0) + (v.logistics_packing.shipping_est||0); act = (v.logistics_packing.cartons_act||0) + (v.logistics_packing.shipping_act||0); }
                if (cat === 'Testing') { est = v.testing_costs?.reduce((s,i)=>s+(i.estimated_cost||0),0) || 0; act = v.testing_costs?.reduce((s,i)=>s+(i.actual_cost||0),0) || 0; }
                if (cat === 'Wastage') { est = v.wastage.reduce((s,i)=>s+(i.estimated_cost||0),0); act = v.wastage.reduce((s,i)=>s+(i.actual_cost||0),0); }
                const diff = act - est;
                return (
                  <tr key={idx}>
                    <td>{cat}</td>
                    <td>{est.toFixed(2)}</td>
                    <td>{act.toFixed(2)}</td>
                    <td style={{ color: diff > 0 ? 'red' : 'green' }}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: '20px', marginTop: '24px' }}>
          <h4>Profit Analysis</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
            <div className="form-group">
              <label>Target Selling Price (per {formData.unit || 'Kg'})</label>
              <input type="number" className="input-field" value={v.selling_price || 0} onChange={e => {
                formData.selling_price = parseFloat(e.target.value) || 0;
                updateTotals(formData);
              }} />
            </div>
            <div className="form-group">
              <label>Expected Total Revenue</label>
              <input type="number" className="input-field" disabled value={((v.selling_price || 0) * (v.quantity || 0)).toFixed(2)} />
            </div>
            <div className="form-group">
              <label>Cost Per Unit ({formData.unit || 'Kg'})</label>
              <input type="number" className="input-field" disabled value={v.quantity ? (v.estimated_cost / v.quantity).toFixed(2) : 0} style={{ fontWeight: 'bold' }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab();
      case 'bom': return renderTable('bom_items', [
        { key: 'material', label: 'Material' },
        { key: 'category', label: 'Category' },
        { key: 'req_qty', label: 'Req Qty', type: 'number' },
        { key: 'unit', label: 'Unit' },
        { key: 'unit_price', label: 'Unit Price', type: 'number' },
        { key: 'amount', label: 'Est Amount', type: 'number' },
        { key: 'actual_amount', label: 'Act Amount', type: 'number' },
      ]);
      case 'process': return renderTable('process_costs', [
        { key: 'process', label: 'Process (e.g. Dyeing)' },
        { key: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
        { key: 'actual_cost', label: 'Actual Cost', type: 'number' },
      ]);
      case 'labour': return renderTable('labour_costs', [
        { key: 'department', label: 'Department' },
        { key: 'employees', label: 'Employees', type: 'number' },
        { key: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
        { key: 'actual_cost', label: 'Actual Cost', type: 'number' },
      ]);
      case 'machine': return renderTable('machine_costs', [
        { key: 'machine', label: 'Machine' },
        { key: 'hours', label: 'Est Hours', type: 'number' },
        { key: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
        { key: 'actual_cost', label: 'Actual Cost', type: 'number' },
      ]);
      case 'overhead': return renderTable('overhead_costs', [
        { key: 'expense', label: 'Expense Type' },
        { key: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
        { key: 'actual_cost', label: 'Actual Cost', type: 'number' },
      ]);
      case 'logistics': return renderLogisticsTab();
      case 'testing': return renderTable('testing_costs', [
        { key: 'test_name', label: 'Test Name (e.g. GSM, Shrinkage)' },
        { key: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
        { key: 'actual_cost', label: 'Actual Cost', type: 'number' },
      ]);
      case 'wastage': return renderTable('wastage', [
        { key: 'type', label: 'Wastage Type' },
        { key: 'percentage', label: 'Percentage (%)', type: 'number' },
        { key: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
        { key: 'actual_cost', label: 'Actual Cost', type: 'number' },
      ]);
      case 'summary': return renderSummaryTab();
      default: return null;
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sheets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CostingSheets");
    XLSX.writeFile(wb, "Costing_Sheets.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Costing Sheets Report', 14, 20);
    const tableData = sheets.map(s => [
      s.costing_no || '-',
      s.buyer || '-',
      s.product || '-',
      s.estimated_cost?.toFixed(2) || '0',
      s.actual_cost?.toFixed(2) || '0',
      (s.profit_margin_pct?.toFixed(2) || '0') + '%',
      s.status || '-'
    ]);
    autoTable(doc, {
      startY: 30,
      head: [['Costing No', 'Buyer', 'Product', 'Est. Cost', 'Act. Cost', 'Margin', 'Status']],
      body: tableData
    });
    doc.save('Costing_Sheets_Report.pdf');
  };

  return (
    <div style={{ padding: '24px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      {view === 'list' ? (
        <>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
              <Calculator size={28} style={{ marginRight: 12, color: 'var(--primary)' }}/> 
              Costing Sheets
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={fetchSheets}>
                <RefreshCw size={16} /> Refresh
              </button>
              <button className="btn btn-secondary" onClick={exportPDF}>
                <FileText size={16} /> Export PDF
              </button>
              <button className="btn btn-secondary" onClick={exportExcel}>
                <Download size={16} /> Export Excel
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                <Plus size={16} /> New Costing
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Total Sheets</h4>
              <h2>{sheets.length}</h2>
            </div>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid green' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Approved</h4>
              <h2>{sheets.filter(s => s.status === 'Approved').length}</h2>
            </div>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid orange' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Pending Approval</h4>
              <h2>{sheets.filter(s => s.status === 'Pending Approval').length}</h2>
            </div>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid purple' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Avg Margin</h4>
              <h2>{sheets.length > 0 ? (sheets.reduce((acc, s) => acc + (s.profit_margin_pct||0), 0) / sheets.length).toFixed(1) : 0}%</h2>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={20} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by Costing No, Buyer or Product..." 
                  style={{ paddingLeft: 40, width: '100%' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table className="table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Costing No</th>
                  <th>Buyer</th>
                  <th>Product</th>
                  <th>Est. Cost</th>
                  <th>Act. Cost</th>
                  <th>Margin</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sheets.filter(s => 
                  (s.costing_no || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (s.buyer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (s.product || '').toLowerCase().includes(searchTerm.toLowerCase())
                ).map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.costing_no}</strong></td>
                    <td>{s.buyer}</td>
                    <td>{s.product}</td>
                    <td><IndianRupee size={12}/>{s.estimated_cost?.toFixed(2)}</td>
                    <td><IndianRupee size={12}/>{s.actual_cost?.toFixed(2)}</td>
                    <td style={{ color: s.profit_margin_pct >= 10 ? 'green' : s.profit_margin_pct > 0 ? 'orange' : 'red' }}>
                      {s.profit_margin_pct?.toFixed(1)}%
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                        background: s.status === 'Approved' ? '#dcfce7' : s.status === 'Draft' ? '#f1f5f9' : '#fef9c3',
                        color: s.status === 'Approved' ? '#166534' : s.status === 'Draft' ? '#475569' : '#854d0e'
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => { setFormData(s); setView('form'); }}>
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setView('list')}>
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ margin: 0 }}>{formData.id ? `Edit Costing: ${formData.costing_no}` : 'Create New Costing Sheet'}</h2>
              <span style={{
                padding: '4px 12px', borderRadius: '12px', fontSize: '14px', marginLeft: '12px',
                background: formData.status === 'Approved' ? '#dcfce7' : '#fef9c3',
                color: formData.status === 'Approved' ? '#166534' : '#854d0e',
                fontWeight: 600
              }}>
                {formData.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {formData.id && (
                <button className="btn btn-secondary" onClick={() => window.print()}>
                  <Printer size={16} /> Print
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => { setFormData({...formData, status: 'Pending Approval'}); handleSave(); }}>
                <CheckSquare size={16} /> Submit Approval
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={16} /> Save Costing
              </button>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', minHeight: '600px', overflow: 'hidden' }}>
            {/* Sidebar Tabs */}
            <div style={{ width: '250px', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', padding: '16px 0' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 24px',
                    background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                    border: 'none', borderRight: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? '600' : '400', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                  onMouseOut={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <tab.icon size={18} /> {tab.label}
                </button>
              ))}
            </div>
            {/* Content Area */}
            <div style={{ flex: 1, background: 'var(--bg-primary)', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
              {renderTabContent()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
