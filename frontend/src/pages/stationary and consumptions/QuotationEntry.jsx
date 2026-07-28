import React, { useState, useEffect, useRef } from 'react';
import storesService from '../../services/storesService';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Plus, Trash2, Download, FileText, CheckCircle, Clock, Search,
  AlertCircle, RefreshCw, Loader2, TrendingUp, Users, Building2,
  ShieldCheck, UploadCloud, X, Tag, IndianRupee, Package, Save, Printer,
  FileSpreadsheet, ArrowLeft
} from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';

/* ─── helpers ─── */
const statusColor = {
  Submitted: 'bg-blue-50 text-blue-600',
  Pending: 'bg-amber-50 text-amber-600',
  Approved: 'bg-emerald-50 text-emerald-600',
  Rejected: 'bg-red-50 text-red-500',
};

export default function QuotationEntry() {
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });
  const [mainView, setMainView] = useState('bids'); // bids, vendors
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // Modal toggle state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('order_info'); // order_info, item_details, tax_logistics

  // New Vendor Form inside modal
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [newVendorData, setNewVendorData] = useState({ vendor_name: '', contact_info: '' });
  const [editingVendorId, setEditingVendorId] = useState(null);

  // Main Form Data matching the requested schema
  const [formData, setFormData] = useState({
    company_name: 'Dinesh Exports Private Limited',
    date: new Date().toISOString().split('T')[0],
    vendor_id: '',
    items: [
      { item_name: 'Blue Gel Pens', quantity: 50, unit_price: 5.0, gst_percentage: 18.0, total: 295.0 },
      { item_name: 'Notebooks (Classmate)', quantity: 20, unit_price: 20.0, gst_percentage: 18.0, total: 472.0 },
      { item_name: 'Printing Books', quantity: 10, unit_price: 100.0, gst_percentage: 18.0, total: 1180.0 }
    ]
  });

  const printAreaRef = useRef(null);

  const showToast = (msg, ok = true) => {
    setToast({ show: true, msg, ok });
    setTimeout(() => setToast({ show: false, msg: '', ok: true }), 3500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quotes, mainVens] = await Promise.all([
        storesService.getProcurementQuotations(),
        storesService.getVendors().catch(() => [])
      ]);
      setQuotations(quotes || []);

      const mappedVendors = (mainVens || []).map(v => ({
        vendor_id: v.id,
        vendor_name: v.vendor_name,
        contact_info: [v.phone, v.email, v.address].filter(Boolean).join(', ') || '—'
      }));
      setVendors(mappedVendors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add Item dynamically
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { item_name: '', quantity: 1, unit_price: 0, gst_percentage: 18.0, total: 0 }
      ]
    }));
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = [...formData.items];

    if (field === 'quantity' || field === 'unit_price' || field === 'gst_percentage') {
      const numVal = value === '' ? '' : (parseFloat(value) || 0);
      updated[index][field] = numVal;

      // Automatically calculate line total with GST
      const qty = field === 'quantity' ? numVal : updated[index].quantity;
      const price = field === 'unit_price' ? numVal : updated[index].unit_price;
      const gst = field === 'gst_percentage' ? numVal : updated[index].gst_percentage;

      // total = qty * price * (1 + GST%)
      const lineTotal = (qty || 0) * (price || 0) * (1 + ((gst || 0) / 100));
      updated[index].total = value === '' ? '' : (Math.round(lineTotal * 100) / 100);
    } else if (field === 'total') {
      const numVal = value === '' ? '' : (parseFloat(value) || 0);
      updated[index].total = numVal;

      // Back calculate unit price
      const qty = updated[index].quantity || 1;
      const gst = updated[index].gst_percentage || 0;
      if (qty > 0) {
        const rawUnitPrice = (numVal || 0) / (qty * (1 + (gst / 100)));
        updated[index].unit_price = value === '' ? '' : (Math.round(rawUnitPrice * 100) / 100);
      }
    } else {
      updated[index][field] = value;
    }

    setFormData(prev => ({ ...prev, items: updated }));
  };

  // Calculate totals
  const subTotalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const gstAmountVal = formData.items.reduce((sum, item) => sum + ((item.quantity * item.unit_price) * (item.gst_percentage / 100)), 0);
  const grandTotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);

  // Add/Update Vendor dynamically in Vendor Master
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    if (!newVendorData.vendor_name.trim()) return;
    try {
      if (editingVendorId) {
        // Update main vendor
        const payload = {
          vendor_name: newVendorData.vendor_name,
          email: newVendorData.contact_info.includes('@') ? newVendorData.contact_info : '',
          address: !newVendorData.contact_info.includes('@') ? newVendorData.contact_info : '',
          status: 'Active'
        };
        const updated = await storesService.updateVendor(editingVendorId, payload);
        setVendors(prev => prev.map(v => v.vendor_id === editingVendorId ? {
          vendor_id: updated.id,
          vendor_name: updated.vendor_name,
          contact_info: [updated.phone, updated.email, updated.address].filter(Boolean).join(', ') || '—'
        } : v));
        setEditingVendorId(null);
        showToast('Vendor updated in Vendor Master successfully!');
      } else {
        // Create main vendor
        const uniqueCode = 'VN-' + Date.now().toString().slice(-6);
        const payload = {
          vendor_code: uniqueCode,
          vendor_name: newVendorData.vendor_name,
          email: newVendorData.contact_info.includes('@') ? newVendorData.contact_info : '',
          address: !newVendorData.contact_info.includes('@') ? newVendorData.contact_info : '',
          status: 'Active'
        };
        const saved = await storesService.createVendor(payload);
        const mappedSaved = {
          vendor_id: saved.id,
          vendor_name: saved.vendor_name,
          contact_info: [saved.phone, saved.email, saved.address].filter(Boolean).join(', ') || '—'
        };
        setVendors(prev => [...prev, mappedSaved]);
        setFormData(prev => ({ ...prev, vendor_id: saved.id.toString() }));
        showToast('Vendor added to Vendor Master successfully!');
      }
      setShowAddVendorForm(false);
      setNewVendorData({ vendor_name: '', contact_info: '' });
    } catch (err) {
      console.error(err);
      showToast('Failed to save vendor.', false);
    }
  };

  // Delete vendor from Vendor Master
  const handleDeleteVendor = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this vendor from Vendor Master?')) return;
    try {
      await storesService.deleteVendor(id);
      setVendors(prev => prev.filter(v => v.vendor_id !== id));
      if (formData.vendor_id === id.toString() || formData.vendor_id === id) {
        setFormData(prev => ({ ...prev, vendor_id: '' }));
      }
      showToast('Vendor deleted from Vendor Master successfully.');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete vendor.', false);
    }
  };

  // Delete quotation bid
  const handleDeleteQuotation = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this quotation bid?')) return;
    try {
      await storesService.deleteProcurementQuotation(id);
      showToast('Quotation deleted successfully.');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete quotation.', false);
    }
  };

  // Submit quotation to database
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.vendor_id) {
      showToast('Please select a vendor.', false);
      return;
    }
    if (formData.items.length === 0) {
      showToast('Please add at least one item.', false);
      return;
    }
    for (const item of formData.items) {
      if (!(item.item_name || '').trim()) {
        showToast('Item name cannot be empty.', false);
        return;
      }
    }

    setSubmitLoading(true);
    try {
      const payload = {
        company_name: formData.company_name,
        vendor_id: parseInt(formData.vendor_id),
        items: formData.items.map(item => ({
          item_name: item.item_name,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          gst_percentage: parseFloat(item.gst_percentage) || 0
        }))
      };
      await storesService.createProcurementQuotation(payload);
      showToast('Quotation saved successfully!');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save quotation.', false);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Print Quotation
  const handlePrint = () => {
    const printContent = printAreaRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation Invoice</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: 800; color: #1e1b4b; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .details-block { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background-color: #f8fafc; }
            .details-title { font-weight: bold; font-size: 14px; text-transform: uppercase; color: #475569; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #6366f1; color: white; padding: 12px; text-align: left; font-size: 13px; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .summary-box { float: right; width: 300px; margin-top: 30px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background-color: #f8fafc; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .total-row { border-top: 2px solid #6366f1; padding-top: 8px; font-weight: bold; font-size: 16px; color: #6366f1; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(30, 27, 75); // Dark blue / indigo
      doc.text(formData.company_name, 14, 20);

      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("PROCUREMENT & VENDOR BID QUOTATION INVOICE", 14, 26);

      // Divider line
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(1);
      doc.line(14, 30, 196, 30);

      // Info section
      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("QUOTATION DETAILS", 14, 40);
      doc.text("VENDOR INFO", 110, 40);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`Date: ${new Date(formData.date).toLocaleDateString('en-IN')}`, 14, 46);
      doc.text("Status: Submitted Bid", 14, 52);

      doc.text(selectedVendor ? selectedVendor.vendor_name : 'No Vendor Selected', 110, 46);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(selectedVendor?.contact_info || 'No contact info', 110, 52);

      // Items Table
      const tableRows = formData.items.map((item, idx) => [
        idx + 1,
        item.item_name || 'Unnamed Item',
        item.quantity,
        `INR ${item.unit_price.toFixed(2)}`,
        `${item.gst_percentage}%`,
        `INR ${item.total.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 60,
        head: [['SNo', 'Item Details', 'Qty', 'Unit Price', 'GST %', 'Subtotal']],
        body: tableRows,
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 70 },
          2: { cellWidth: 20, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' }
        }
      });

      // Summary section
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(71, 85, 105);

      doc.text("Taxable Subtotal:", 135, finalY);
      doc.setFont("Helvetica", "normal");
      doc.text(`INR ${subTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 196, finalY, { align: 'right' });

      doc.setFont("Helvetica", "bold");
      doc.text("CGST & SGST / IGST:", 135, finalY + 7);
      doc.setFont("Helvetica", "normal");
      doc.text(`INR ${gstAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 196, finalY + 7, { align: 'right' });

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(99, 102, 241);
      doc.text("GRAND TOTAL:", 135, finalY + 15);
      doc.text(`INR ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 196, finalY + 15, { align: 'right' });

      // Save PDF
      doc.save(`Quotation_${selectedVendor?.vendor_name.replace(/\s+/g, '_') || 'Vendor'}_${formData.date}.pdf`);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      doc.save("Quotation.pdf");
      console.error(err);
      showToast('PDF saved as default.', true);
    }
  };

  const handleExportExcel = () => {
    try {
      const dataRows = formData.items.map((item, idx) => ({
        "SNo": idx + 1,
        "Item Details": item.item_name,
        "Quantity": item.quantity,
        "Unit Price (INR)": item.unit_price,
        "GST %": item.gst_percentage,
        "Total (INR)": item.total
      }));

      // Add summary details to the bottom
      dataRows.push({});
      dataRows.push({ "Item Details": "Taxable Subtotal", "Total (INR)": subTotalAmount });
      dataRows.push({ "Item Details": "CGST & SGST / IGST", "Total (INR)": gstAmountVal });
      dataRows.push({ "Item Details": "GRAND TOTAL", "Total (INR)": grandTotal });

      const ws = XLSX.utils.json_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Quotation Details");

      // Set header info sheet columns width
      ws["!cols"] = [
        { wch: 6 },
        { wch: 30 },
        { wch: 12 },
        { wch: 18 },
        { wch: 10 },
        { wch: 18 }
      ];

      XLSX.writeFile(wb, `Quotation_${selectedVendor?.vendor_name.replace(/\s+/g, '_') || 'Vendor'}_${formData.date}.xlsx`);
      showToast('Excel file downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Excel.', false);
    }
  };

  const filteredQuotations = quotations.filter(q =>
    q.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.vendor?.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVendors = vendors.filter(v =>
    v.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contact_info?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedVendor = vendors.find(v => v.vendor_id === parseInt(formData.vendor_id));

  // Tab definitions
  const tabs = [
    { id: 'order_info', label: 'Order Info', icon: Building2 },
    { id: 'item_details', label: 'Item / Design Details', icon: Package },
    { id: 'tax_logistics', label: 'Print & Summary', icon: IndianRupee }
  ];

  return (
    <div className="animate-fade flex flex-col gap-5 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: "24px",
        background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        marginBottom: "24px"
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            color: 'rgb(99, 102, 241)',
            padding: '12px',
            borderRadius: '12px'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Vendor Quotation Management</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Track procurement bid proposals, GST values and calculate grand totals.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Main View Toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setMainView('bids')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                border: 'none',
                background: mainView === 'bids' ? '#fff' : 'transparent',
                color: mainView === 'bids' ? 'var(--primary)' : '#64748b',
                boxShadow: mainView === 'bids' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer'
              }}
            >
              Quotation Bids
            </button>
            <button
              onClick={() => setMainView('vendors')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                border: 'none',
                background: mainView === 'vendors' ? '#fff' : 'transparent',
                color: mainView === 'vendors' ? 'var(--primary)' : '#64748b',
                boxShadow: mainView === 'vendors' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer'
              }}
            >
              Registered Vendors
            </button>
          </div>

          {mainView === 'bids' ? (
            <button
              onClick={() => {
                setShowAddVendorForm(false);
                setFormData({
                  company_name: 'Dinesh Exports Private Limited',
                  date: new Date().toISOString().split('T')[0],
                  vendor_id: vendors[0]?.vendor_id || '',
                  items: [
                    { item_name: 'Pens', quantity: 50, unit_price: 5.0, gst_percentage: 18.0, total: 295.0 },
                    { item_name: 'Notebooks', quantity: 20, unit_price: 20.0, gst_percentage: 18.0, total: 472.0 },
                    { item_name: 'Printing Books', quantity: 10, unit_price: 100.0, gst_percentage: 18.0, total: 1180.0 }
                  ]
                });
                setActiveTab('order_info');
                setIsModalOpen(true);
              }}
              className="btn btn-primary font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
            >
              <Plus size={16} /> Place Quotation
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingVendorId(null);
                setNewVendorData({ vendor_name: '', contact_info: '' });
                setIsVendorModalOpen(true);
              }}
              className="btn btn-primary font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
            >
              <Plus size={16} /> Register New Vendor
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        {[
          { label: 'Total Bids Recorded', value: quotations.length, icon: <FileText size={24} />, color: '#3b82f6' },
          { label: 'Active Vendors', value: vendors.length, icon: <Users size={24} />, color: '#8b5cf6' },
          { label: 'Total Estimated Value', value: `₹${quotations.reduce((sum, q) => sum + (q.grand_total || 0), 0).toLocaleString('en-IN')}`, icon: <TrendingUp size={24} />, color: '#10b981' }
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-icon" style={{ background: `${s.color}1a`, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-info">
              <h3>{loading ? '—' : s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quotation / Vendor Table ── */}
      <div className="card overflow-hidden flex-1 flex flex-col mt-4">
        <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center gap-4 bg-slate-50/40">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={mainView === 'bids' ? "Search Company or Vendor…" : "Search Vendor Name or Contact…"}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <button onClick={loadData} title="Refresh" className="btn btn-secondary p-2">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="p-16 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
              <span className="text-xs">Loading data…</span>
            </div>
          ) : mainView === 'bids' ? (
            filteredQuotations.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="p-5 bg-indigo-50 rounded-2xl">
                  <FileText size={38} className="text-indigo-300" />
                </div>
                <span className="text-sm font-bold text-slate-600">No vendor quotations recorded yet.</span>
                <span className="text-xs text-slate-400">Click "Place Quotation" to create a quotation.</span>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3">Quotation ID</th>
                    <th className="px-5 py-3">Company Name</th>
                    <th className="px-5 py-3">Vendor</th>
                    <th className="px-5 py-3">Date Created</th>
                    <th className="px-5 py-3 text-right">Grand Total (incl. GST)</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {filteredQuotations.map(q => (
                    <tr key={q.quotation_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-800 font-mono">QTN-{q.quotation_id}</td>
                      <td className="px-5 py-3 font-semibold text-indigo-600">{q.company_name}</td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{q.vendor?.vendor_name || '—'}</td>
                      <td className="px-5 py-3">{new Date(q.date_created).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-800">
                        ₹{(q.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={async () => {
                            const detailedQuote = await storesService.getProcurementQuotation(q.quotation_id);
                            setFormData({
                              company_name: detailedQuote.company_name,
                              date: detailedQuote.date_created.split('T')[0],
                              vendor_id: detailedQuote.vendor_id.toString(),
                              items: detailedQuote.items.map(item => ({
                                item_name: item.item_name,
                                quantity: item.quantity,
                                unit_price: item.unit_price,
                                gst_percentage: item.gst_percentage,
                                total: item.total
                              }))
                            });
                            setActiveTab('tax_logistics');
                            setIsModalOpen(true);
                          }}
                          className="btn btn-secondary py-1 px-3.5 text-xs mr-2 font-semibold"
                        >
                          Print Preview
                        </button>
                        <button
                          onClick={(e) => handleDeleteQuotation(q.quotation_id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors inline-flex align-middle"
                          title="Delete Quotation"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            filteredVendors.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="p-5 bg-indigo-50 rounded-2xl">
                  <Users size={38} className="text-indigo-300" />
                </div>
                <span className="text-sm font-bold text-slate-600">No registered vendors found.</span>
                <span className="text-xs text-slate-400">Click "Register New Vendor" to add the first one.</span>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3" style={{ width: 120 }}>Vendor ID</th>
                    <th className="px-5 py-3">Vendor Name</th>
                    <th className="px-5 py-3">Contact Info / Email</th>
                    <th className="px-5 py-3 text-center" style={{ width: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {filteredVendors.map(v => (
                    <tr key={v.vendor_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-800 font-mono">VEN-{v.vendor_id}</td>
                      <td className="px-5 py-3 font-bold text-slate-800">{v.vendor_name}</td>
                      <td className="px-5 py-3 text-slate-500">{v.contact_info || '—'}</td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => {
                            setEditingVendorId(v.vendor_id);
                            setNewVendorData({ vendor_name: v.vendor_name, contact_info: v.contact_info || '' });
                            setIsVendorModalOpen(true);
                          }}
                          className="btn btn-secondary py-1 px-3 text-xs font-semibold mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteVendor(v.vendor_id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* ─── STYLISH VENDOR QUOTATION FORM MODAL (New Purchase Order style) ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl flex flex-col my-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: '1px solid var(--border)',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
                  Record Vendor Quotation
                </h2>
              </div>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#f1f5f9', overflowX: 'auto' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '16px 24px',
                    background: activeTab === tab.id ? '#fff' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                    fontWeight: 600,
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, background: '#fff', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>

              {/* Tab 1: Order Info */}
              {activeTab === 'order_info' && (
                <div className="animate-fade flex flex-col gap-6">
                  <div>
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Company & Vendor Info</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                      <div className="form-group">
                        <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Order Date *</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.date}
                          onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Company Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.company_name}
                          onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Supplier / Vendor *</label>
                        <div className="flex gap-2">
                          <MasterDropdown
                            label=""
                            name="vendor_id"
                            value={formData.vendor_id}
                            options={vendors.map(v => ({...v, name: v.vendor_name, id: v.vendor_id}))}
                            required={true}
                            onChange={(name, val) => setFormData(prev => ({ ...prev, [name]: val }))}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary px-3"
                            onClick={() => setShowAddVendorForm(!showAddVendorForm)}
                            title="Add New Vendor"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add/Manage Vendor Form (Inline toggle) */}
                  {showAddVendorForm && (
                    <div style={{ background: '#f8fafc', padding: 20, border: '1px solid #e2e8f0', borderRadius: 8 }} className="animate-fade flex flex-col gap-4">
                      <form onSubmit={handleSaveVendor}>
                        <h5 style={{ margin: '0 0 12px 0', fontWeight: 700, color: '#1e1b4b' }}>
                          {editingVendorId ? 'Edit Vendor Registration' : 'Register New Vendor'}
                        </h5>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Vendor Name *</label>
                            <input
                              type="text"
                              required
                              className="form-control"
                              placeholder="e.g. Stationery Wholesale Ltd"
                              value={newVendorData.vendor_name}
                              onChange={e => setNewVendorData(prev => ({ ...prev, vendor_name: e.target.value }))}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Contact Info / Email</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Phone, Address or Email"
                              value={newVendorData.contact_info}
                              onChange={e => setNewVendorData(prev => ({ ...prev, contact_info: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <button type="submit" className="btn btn-primary py-2.5 px-4 font-semibold">
                              {editingVendorId ? 'Update Vendor' : 'Save Vendor'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary py-2.5"
                              onClick={() => {
                                setShowAddVendorForm(false);
                                setEditingVendorId(null);
                                setNewVendorData({ vendor_name: '', contact_info: '' });
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Item / Design Details */}
              {activeTab === 'item_details' && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>Item Bid Quotation Table</h4>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddItem}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}
                    >
                      <Plus size={14} /> Add New Item
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100">
                          <th className="px-4 py-3" style={{ width: 60 }}>SNo</th>
                          <th className="px-4 py-3">Item Name</th>
                          <th className="px-4 py-3" style={{ width: 120 }}>Quantity</th>
                          <th className="px-4 py-3" style={{ width: 140 }}>Unit Price (₹)</th>
                          <th className="px-4 py-3" style={{ width: 120 }}>GST %</th>
                          <th className="px-4 py-3 text-right" style={{ width: 180 }}>Total (incl. GST)</th>
                          <th className="px-4 py-3 text-center" style={{ width: 60 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                        {formData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="form-control font-semibold"
                                placeholder="e.g. pens, notebooks, printing books"
                                value={item.item_name}
                                onChange={e => handleItemFieldChange(idx, 'item_name', e.target.value)}
                                required
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                className="form-control"
                                min="1"
                                value={item.quantity}
                                onChange={e => handleItemFieldChange(idx, 'quantity', e.target.value)}
                                required
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={e => handleItemFieldChange(idx, 'unit_price', e.target.value)}
                                required
                              />
                            </td>
                            <td className="px-4 py-3">
                              <MasterDropdown
                                label=""
                                name="gst_percentage"
                                value={item.gst_percentage}
                                options={['0', '5', '12', '18', '28']}
                                onChange={(name, val) => handleItemFieldChange(idx, name, val)}
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                className="form-control text-right font-bold text-slate-800"
                                min="0"
                                step="0.01"
                                value={item.total}
                                onChange={e => handleItemFieldChange(idx, 'total', e.target.value)}
                                required
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Summary & Print Preview */}
              {activeTab === 'tax_logistics' && (
                <div className="animate-fade">
                  <div className="flex justify-between items-center mb-6">
                    <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>Printable Quotation Preview</h4>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        type="button"
                        className="btn btn-secondary font-semibold"
                        onClick={handleExportPDF}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
                      >
                        <Download size={15} /> Download PDF
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary font-semibold"
                        onClick={handleExportExcel}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}
                      >
                        <FileSpreadsheet size={15} /> Export Excel
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary font-semibold"
                        onClick={handlePrint}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <Printer size={15} /> Print Invoice
                      </button>
                    </div>
                  </div>

                  {/* PDF/Print Layout Container */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>

                    {/* Invoice block */}
                    <div ref={printAreaRef} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 30, background: '#fff' }}>
                      <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid #6366f1', paddingBottom: 20, marginBottom: 30 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e1b4b' }}>{formData.company_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>PROCUREMENT & QUOTATION INVOICE</div>
                      </div>

                      <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
                        <div className="details-block" style={{ border: '1px solid #e2e8f0', padding: 15, borderRadius: 8, backgroundColor: '#f8fafc' }}>
                          <div className="details-title" style={{ fontWeight: 'bold', fontSize: 11, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Quotation Details</div>
                          <div style={{ fontSize: 13, color: '#334155', marginBottom: 4 }}><b>Date:</b> {new Date(formData.date).toLocaleDateString('en-IN')}</div>
                          <div style={{ fontSize: 13, color: '#334155' }}><b>Status:</b> Submitted Bid</div>
                        </div>

                        <div className="details-block" style={{ border: '1px solid #e2e8f0', padding: 15, borderRadius: 8, backgroundColor: '#f8fafc' }}>
                          <div className="details-title" style={{ fontWeight: 'bold', fontSize: 11, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Vendor Info</div>
                          <div style={{ fontSize: 13, color: '#334155', fontWeight: 'bold' }}>{selectedVendor?.vendor_name || 'No Vendor Selected'}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{selectedVendor?.contact_info || 'No contact info'}</div>
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#6366f1' }}>
                            <th style={{ color: 'white', padding: 10, fontSize: 12 }}>SNo</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12 }}>Item Details</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12, textAlign: 'right' }}>Qty</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12, textAlign: 'right' }}>Unit Price (₹)</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12, textAlign: 'right' }}>GST %</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12, textAlign: 'right' }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0' }}>{idx + 1}</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{item.item_name || 'Unnamed Item'}</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{item.quantity}</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>₹{item.unit_price.toFixed(2)}</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{item.gst_percentage}%</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>₹{item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Floating summary clear fix */}
                      <div style={{ display: 'flow-root' }}>
                        <div className="summary-box" style={{ float: 'right', width: 300, marginTop: 30, border: '1px solid #e2e8f0', padding: 15, borderRadius: 8, backgroundColor: '#f8fafc' }}>
                          <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                            <span>Taxable Subtotal:</span>
                            <span>₹{subTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                            <span>CGST & SGST / IGST:</span>
                            <span>₹{gstAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="summary-row total-row" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #6366f1', paddingTop: 8, fontWeight: 'bold', fontSize: 15, color: '#6366f1' }}>
                            <span>GRAND TOTAL:</span>
                            <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order summary card matching layout */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 24,
                      alignSelf: 'start'
                    }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Order Summary</h4>
                      <div className="flex flex-col gap-3 text-xs">
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                          <span className="text-slate-500">Taxable Amount</span>
                          <span className="font-bold text-slate-800">₹{subTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                          <span className="text-slate-500">SGST (9%)</span>
                          <span className="font-bold text-slate-800">₹{(gstAmountVal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                          <span className="text-slate-500">CGST (9%)</span>
                          <span className="font-bold text-slate-800">₹{(gstAmountVal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                          <span className="text-slate-500">IGST (18%)</span>
                          <span className="font-bold text-slate-800">₹{gstAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-indigo-600 font-extrabold text-sm uppercase">Grand Total</span>
                          <span className="text-indigo-700 font-extrabold text-base">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: '#f8fafc'
            }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                <X size={16} /> Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitLoading}>
                {submitLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save & Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── REGISTER/EDIT VENDOR MODAL ─── */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
                {editingVendorId ? 'Edit Vendor Registration' : 'Register New Vendor'}
              </h2>
              <button onClick={() => setIsVendorModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleSaveVendor(e);
              setIsVendorModalOpen(false);
              loadData();
            }} style={{ padding: 24 }} className="flex flex-col gap-5">
              <div className="form-group">
                <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Vendor Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Stationery Wholesale Ltd"
                  value={newVendorData.vendor_name}
                  onChange={e => setNewVendorData(prev => ({ ...prev, vendor_name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Contact Info / Email</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Phone, Address or Email"
                  value={newVendorData.contact_info}
                  onChange={e => setNewVendorData(prev => ({ ...prev, contact_info: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary font-semibold" onClick={() => setIsVendorModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary font-semibold">
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
