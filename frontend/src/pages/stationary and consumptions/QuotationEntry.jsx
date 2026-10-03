import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowLeft, Briefcase, Building2, CheckCircle, Clock, Download, Edit2, Eye, FileSpreadsheet, FileText, IndianRupee, Loader2, MapPin, Package, Phone, Plus, Printer, RefreshCw, Save, Search, ShieldCheck, Tag, Trash2, TrendingUp, UploadCloud, User, Users, X, Filter, Globe, Mail, ClipboardList } from 'lucide-react';

import storesService from '../../services/storesService';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import MasterDropdown from '../../components/MasterDropdown';
import ExportButton from '../../components/ExportButton';

/* ─── helpers ─── */
const statusColor = {
  Submitted: 'bg-blue-50 text-blue-600',
  Pending: 'bg-amber-50 text-amber-600',
  Approved: 'bg-emerald-50 text-emerald-600',
  Rejected: 'bg-red-50 text-red-500',
};

import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function QuotationEntry() {
  const [loading, setLoading] = useState(false);

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

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
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '', type: '' });
  const [editingId, setEditingId] = useState(null);

  // New Vendor Form inside modal
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [newVendorData, setNewVendorData] = useState({ vendor_name: '', contact_info: '' });
  const [editingVendorId, setEditingVendorId] = useState(null);

  // Main Form Data matching the requested schema
  const [formData, setFormData] = useState({
    company_name: 'Handloom ERP Private Limited',
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
  const handleDeleteVendor = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name, type: 'vendor' });
  };

  // Delete quotation bid
  const handleEdit = (q) => {
    setFormData({
      id: q.quotation_id,
      company_name: q.company_name || 'Handloom ERPs',
      date: q.date_created ? new Date(q.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      vendor_id: q.vendor_id ? q.vendor_id.toString() : (vendors[0]?.vendor_id.toString() || ''),
      items: q.items || []
    });
    setEditingId(q.quotation_id);
    setIsModalOpen(true);
  };
  const handleDeleteQuotation = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name, type: 'quotation' });
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
      if (editingId) {
        if (storesService.updateProcurementQuotation) {
          await storesService.updateProcurementQuotation(editingId, payload);
          showToast('Quotation updated successfully!');
        } else {
          showToast('Update endpoint missing in storesService.', false);
        }
      } else {
        await storesService.createProcurementQuotation(payload);
        showToast('Quotation saved successfully!');
      }
      setIsModalOpen(false);
      setEditingId(null);
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

  const totalQuotationValue = quotations.reduce((sum, q) => sum + (q.grand_total || 0), 0);

  const stats = [
    {
      label: 'Total Quotations',
      value: quotations.length,
      icon: <FileText size={24} />, color: '#3b82f6'
    },
    {
      label: 'Registered Vendors',
      value: vendors.length,
      icon: <Users size={24} />, color: '#10b981'
    },
    {
      label: 'Total Quotation Value',
      value: `₹${totalQuotationValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      icon: <IndianRupee size={24} />, color: '#8b5cf6'
    },
    {
      label: 'Quoted Items',
      value: quotations.reduce((sum, q) => sum + (q.items?.length || 0), 0),
      icon: <Package size={24} />, color: '#f59e0b'
    }
  ];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="var(--primary)" /> Vendor Quotation Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Track procurement bid proposals, GST values and calculate grand totals.</p>
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
            <div className="flex items-center gap-3">
              <ExportButton
                data={filteredQuotations}
                filename="Quotation_Bids_Report"
                pdfTitle="Quotation Bids Report"
                columns={[
                  { header: 'Quotation ID', key: 'quotation_id', render: (row) => `QTN-${row.quotation_id}` },
                  { header: 'Company Name', key: 'company_name' },
                  { header: 'Vendor', key: 'vendor', render: (row) => row.vendor?.vendor_name || '—' },
                  { header: 'Date Created', key: 'date_created', render: (row) => new Date(row.date_created).toLocaleDateString('en-IN') },
                  { header: 'Grand Total', key: 'grand_total', render: (row) => `₹${(row.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` }
                ]}
              />
              <button
                onClick={() => {
                  setShowAddVendorForm(false);
                  setFormData({
                    company_name: 'Handloom ERP Private Limited',
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
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ExportButton
                data={filteredVendors}
                filename="Registered_Vendors_Report"
                pdfTitle="Registered Vendors Report"
                columns={[
                  { header: 'Vendor ID', key: 'vendor_id', render: (row) => `VEN-${row.vendor_id}` },
                  { header: 'Vendor Name', key: 'vendor_name' },
                  { header: 'Contact Info', key: 'contact_info', render: (row) => row.contact_info || '—' }
                ]}
              />
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
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20, marginBottom: 24 }}>
        {stats.map(stat => (
          <div key={stat.label} className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-details">
              <h3>{stat.label}</h3>
              <div className="value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
        {/* Search Card */}
        <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder={mainView === 'bids' ? "Search Company or Vendor…" : "Search Vendor Name or Contact…"}
              style={{ paddingLeft: 38, width: '100%', margin: 0 }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {loading && <Loader2 className="animate-spin" size={18} style={{ color: 'var(--primary)', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
              <Filter size={16} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
            </div>
            
            <select className="form-control" style={{ width: 150, margin: 0 }}>
              <option>All Types</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
              <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
              <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
            </div>
          </div>
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
              <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quotation ID</th>
                    <th>Company Name</th>
                    <th>Vendor</th>
                    <th>Date Created</th>
                    <th>Grand Total (incl. GST)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map(q => (
                    <tr 
                      key={q.quotation_id}
                      onClick={async () => {
                        const detailedQuote = await storesService.getProcurementQuotation(q.quotation_id);
                        setSelectedViewItem(detailedQuote);
                      }}
                      style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedViewItem?.quotation_id === q.quotation_id ? 'var(--bg-secondary)' : 'transparent' }}
                    >
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>QTN-{q.quotation_id}</td>
                      <td style={{ fontWeight: 600 }}>{q.company_name}</td>
                      <td>{q.vendor?.vendor_name || '—'}</td>
                      <td>{new Date(q.date_created).toLocaleDateString('en-IN')}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        ₹{(q.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleEdit(q)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={async () => {
                              const detailedQuote = await storesService.getProcurementQuotation(q.quotation_id);
                              setSelectedViewItem(detailedQuote);
                            }}
                            title="Preview"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteQuotation(q.quotation_id, `QTN-${q.quotation_id}`, e)}
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete Quotation"
                          >
                            <Trash2 size={16} color="var(--danger, #ef4444)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
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
              <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>Vendor ID</th>
                    <th>Vendor Name</th>
                    <th>Contact Info / Email</th>
                    <th style={{ width: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map(v => (
                    <tr key={v.vendor_id}>
                      <td>VEN-{v.vendor_id}</td>
                      <td>{v.vendor_name}</td>
                      <td>{v.contact_info || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setEditingVendorId(v.vendor_id);
                              setNewVendorData({ vendor_name: v.vendor_name, contact_info: v.contact_info || '' });
                              setIsVendorModalOpen(true);
                            }}
                            className="btn btn-secondary py-1 px-3 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDeleteVendor(v.vendor_id, e)}
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete Vendor"
                          >
                            <Trash2 size={16} color="var(--danger, #ef4444)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
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
                            options={vendors.map(v => ({ ...v, name: v.vendor_name, id: v.vendor_id }))}
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

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Vendor Quotation Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setSelectedViewItem(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              <div ref={printRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>

                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>HANDLOOM ERP</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}></p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>VENDOR QUOTATION</h2>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewItem.status || 'ACTIVE').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Generated On</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                <div style={{ padding: '10px 40px 40px 40px' }}>
                  <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                    <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                      <FileText size={14} /> 1. RECORD DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        {Object.entries(selectedViewItem).slice(0, 10).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                      <div>
                        {Object.entries(selectedViewItem).slice(10, 20).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>Handloom ERP</div>
                      <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@handloomerp.com</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.handloomerp.com</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                      <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Premium React Delete Confirmation Modal Popup */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card animate-scale" style={{
            width: 420,
            padding: 24,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fee2e2'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Confirm Deletion
            </h3>

            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13 }}
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '', type: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={async () => {
                  const { id, type } = deleteConfirm;
                  setDeleteConfirm({ show: false, id: null, name: '', type: '' });
                  try {
                    if (type === 'vendor') {
                      await storesService.deleteVendor(id);
                      setVendors(prev => prev.filter(v => v.vendor_id !== id));
                      if (formData.vendor_id === id.toString() || formData.vendor_id === id) {
                        setFormData(prev => ({ ...prev, vendor_id: '' }));
                      }
                      showToast('Vendor deleted from Vendor Master successfully.');
                    } else if (type === 'quotation') {
                      await storesService.deleteProcurementQuotation(id);
                      showToast('Quotation deleted successfully.');
                      loadData();
                    }
                    if (typeof setSelectedViewItem === 'function' && selectedViewItem?.quotation_id === id) setSelectedViewItem(null);
                  } catch (err) {
                    showToast('Failed to delete record. It may be in use.', false);
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

