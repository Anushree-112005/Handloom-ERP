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
  FileSpreadsheet, Box, ArrowLeft
} from 'lucide-react';

export default function PurchaseOrder() {
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [procurementQuotations, setProcurementQuotations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Modal toggle state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('order_info'); // order_info, item_details, tax_logistics

  const [formData, setFormData] = useState({
    quotation_id: '',
    vendor_id: '',
    expected_delivery_date: '',
    delivery_warehouse_id: '',
    payment_terms: '30 Days Credit',
    delivery_instructions: '',
    discount_amount: 0,
    items: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });
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
      const [poData, vens, quotes, whs] = await Promise.all([
        storesService.getPurchaseOrders(),
        storesService.getProcurementVendors(),
        storesService.getProcurementQuotations(),
        storesService.getWarehouses()
      ]);
      setPOs(poData || []);
      setVendors(vens || []);
      setProcurementQuotations(quotes || []);
      setWarehouses(whs || []);

      // Select default warehouse if available
      if (whs && whs.length > 0 && !formData.delivery_warehouse_id) {
        setFormData(prev => ({ ...prev, delivery_warehouse_id: whs[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // When quotation is linked, pull all items with prices, quantities, and GST
  const handleQuotationChange = (qId) => {
    if (!qId) {
      setFormData(prev => ({
        ...prev,
        quotation_id: '',
        items: []
      }));
      return;
    }
    const selectedQ = procurementQuotations.find(q => q.quotation_id === parseInt(qId));
    if (selectedQ) {
      const formattedItems = selectedQ.items.map(i => ({
        item_name: i.item_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount_percentage: 0,
        discount_amount: 0,
        gst: i.gst_percentage || 18,
        remarks: '',
        total: i.total
      }));
      setFormData(prev => ({
        ...prev,
        quotation_id: qId,
        vendor_id: selectedQ.vendor_id.toString(),
        items: formattedItems
      }));
    }
  };

  // Add manually typed item
  const handleAddManualItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { item_name: '', quantity: 1, unit_price: 0, discount_percentage: 0, discount_amount: 0, gst: 18, remarks: '', total: 0 }
      ]
    }));
  };

  // Remove item
  const handleRemoveItem = (index) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, items: updated }));
  };

  // Item field editing handler
  const handleItemFieldChange = (index, field, value) => {
    const updated = [...formData.items];

    if (field === 'quantity' || field === 'unit_price' || field === 'gst' || field === 'discount_percentage') {
      const numVal = value === '' ? '' : (parseFloat(value) || 0);
      updated[index][field] = numVal;

      const qty = field === 'quantity' ? numVal : updated[index].quantity;
      const price = field === 'unit_price' ? numVal : updated[index].unit_price;
      const discountPct = field === 'discount_percentage' ? numVal : updated[index].discount_percentage;
      const gstVal = field === 'gst' ? numVal : updated[index].gst;

      const subtotal = (qty || 0) * (price || 0);
      const discAmt = subtotal * ((discountPct || 0) / 100);
      const taxable = subtotal - discAmt;
      const total = taxable * (1 + ((gstVal || 0) / 100));

      updated[index].discount_amount = value === '' ? '' : (Math.round(discAmt * 100) / 100);
      updated[index].total = value === '' ? '' : (Math.round(total * 100) / 100);
    } else if (field === 'total') {
      const numVal = value === '' ? '' : (parseFloat(value) || 0);
      updated[index].total = numVal;

      // Back calculate price
      const qty = updated[index].quantity || 1;
      const gst = updated[index].gst || 0;
      const discountPct = updated[index].discount_percentage || 0;

      // total = qty * price * (1 - disc/100) * (1 + gst/100)
      // price = total / [qty * (1 - disc/100) * (1 + gst/100)]
      const factor = (1 - (discountPct / 100)) * (1 + (gst / 100));
      if (qty > 0 && factor > 0) {
        updated[index].unit_price = value === '' ? '' : Math.round(((numVal || 0) / (qty * factor)) * 100) / 100;
      }
    } else {
      updated[index][field] = value;
    }

    setFormData(prev => ({ ...prev, items: updated }));
  };

  // Math totals
  const subTotalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const itemsDiscountAmount = formData.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);

  // Use either line item discounts or overall override discount
  const finalDiscount = parseFloat(formData.discount_amount) > 0 ? parseFloat(formData.discount_amount) : itemsDiscountAmount;

  // Allow manual override for taxable subtotal
  const finalTaxableSubtotal = formData.taxable_subtotal_override !== undefined ? formData.taxable_subtotal_override : subTotalAmount;

  // Calculate taxable amount after discounts
  const totalTaxable = Math.max(0, finalTaxableSubtotal - finalDiscount);

  // Calculate GST amount
  const calculatedGst = formData.items.reduce((sum, item) => {
    const itemSub = item.quantity * item.unit_price;
    const itemDisc = item.discount_amount || 0;
    const itemTaxable = Math.max(0, itemSub - itemDisc);
    return sum + (itemTaxable * (item.gst / 100));
  }, 0);

  const gstAmountVal = formData.gst_amount_override !== undefined ? formData.gst_amount_override : calculatedGst;

  const grandTotal = formData.grand_total_override !== undefined ? formData.grand_total_override : Math.round((totalTaxable + gstAmountVal) * 100) / 100;

  // Submit PO
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.vendor_id) {
      showToast('Please select a vendor.', false);
      return;
    }
    if (!formData.delivery_warehouse_id) {
      showToast('Please select a delivery warehouse.', false);
      return;
    }
    if (formData.items.length === 0) {
      showToast('Purchase Order must contain at least one item.', false);
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        quotation_id: formData.quotation_id ? parseInt(formData.quotation_id) : null,
        vendor_id: parseInt(formData.vendor_id),
        expected_delivery_date: formData.expected_delivery_date ? new Date(formData.expected_delivery_date).toISOString() : null,
        delivery_warehouse_id: parseInt(formData.delivery_warehouse_id),
        payment_terms: formData.payment_terms || "",
        delivery_instructions: formData.delivery_instructions || "",
        discount_amount: parseFloat(formData.discount_amount) || 0,
        total_amount_override: (formData.taxable_subtotal_override !== undefined && formData.taxable_subtotal_override !== "") ? parseFloat(formData.taxable_subtotal_override) : null,
        tax_amount_override: (formData.gst_amount_override !== undefined && formData.gst_amount_override !== "") ? parseFloat(formData.gst_amount_override) : null,
        grand_total_override: (formData.grand_total_override !== undefined && formData.grand_total_override !== "") ? parseFloat(formData.grand_total_override) : null,
        items: formData.items.map(item => ({
          item_name: item.item_name,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          discount_percentage: parseFloat(item.discount_percentage) || 0,
          discount_amount: parseFloat(item.discount_amount) || 0,
          gst: parseFloat(item.gst) || 0,
          remarks: item.remarks || ""
        }))
      };

      await storesService.createPurchaseOrder(payload);
      showToast('Purchase Order placed successfully!');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to place Purchase Order.', false);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await storesService.deletePurchaseOrder(id);
      showToast('PO deleted successfully.');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Browser Print Window
  const handlePrint = () => {
    const printContent = printAreaRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order Print</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
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
      const selectedVen = vendors.find(v => v.vendor_id === parseInt(formData.vendor_id));
      const selectedWh = warehouses.find(w => w.id === parseInt(formData.delivery_warehouse_id));

      // Header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(30, 27, 75);
      doc.text("Dinesh Exports Private Limited", 14, 20);

      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("OFFICIAL PURCHASE ORDER (PO)", 14, 26);

      // Divider
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(1);
      doc.line(14, 30, 196, 30);

      // Info Details
      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("PO COORDINATES", 14, 40);
      doc.text("VENDOR DETAILS", 110, 40);

      doc.setFont("Helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`Warehouse: ${selectedWh ? selectedWh.warehouse_name : 'Default Main Store'}`, 14, 46);
      doc.text(`Expected Delivery: ${formData.expected_delivery_date || 'Immediate'}`, 14, 52);
      doc.text(`Payment Terms: ${formData.payment_terms}`, 14, 58);

      doc.text(selectedVen ? selectedVen.vendor_name : 'No Vendor Selected', 110, 46);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(selectedVen?.contact_info || 'No contact details', 110, 52);

      // Items Table
      const tableRows = formData.items.map((item, idx) => {
        const sub = item.quantity * item.unit_price;
        return [
          idx + 1,
          item.item_name || 'Custom Product',
          item.quantity,
          `INR ${item.unit_price.toFixed(2)}`,
          `${item.discount_percentage}%`,
          `${item.gst}%`,
          `INR ${item.total.toFixed(2)}`
        ];
      });

      autoTable(doc, {
        startY: 68,
        head: [['SNo', 'Item Description', 'Qty', 'Unit Price', 'Disc %', 'GST %', 'Total']],
        body: tableRows,
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 60 },
          2: { cellWidth: 15, halign: 'right' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 25, halign: 'right' }
        }
      });

      // Totals Summary block
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(71, 85, 105);

      doc.text("Taxable Subtotal:", 130, finalY);
      doc.setFont("Helvetica", "normal");
      doc.text(`INR ${subTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 196, finalY, { align: 'right' });

      doc.setFont("Helvetica", "bold");
      doc.text("Discount Applied:", 130, finalY + 6);
      doc.setFont("Helvetica", "normal");
      doc.text(`INR ${finalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 196, finalY + 6, { align: 'right' });

      doc.setFont("Helvetica", "bold");
      doc.text("Total GST Value:", 130, finalY + 12);
      doc.setFont("Helvetica", "normal");
      doc.text(`INR ${gstAmountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 196, finalY + 12, { align: 'right' });

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(99, 102, 241);
      doc.text("GRAND TOTAL:", 130, finalY + 18);
      doc.text(`INR ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 196, finalY + 18, { align: 'right' });

      doc.save(`PO_${selectedVen?.vendor_name.replace(/\s+/g, '_') || 'Vendor'}.pdf`);
      showToast('PDF PO downloaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to export PDF.', false);
    }
  };

  const handleExportExcel = () => {
    try {
      const dataRows = formData.items.map((item, idx) => ({
        "SNo": idx + 1,
        "Item Name": item.item_name,
        "Qty": item.quantity,
        "Unit Price": item.unit_price,
        "Discount %": item.discount_percentage,
        "GST %": item.gst,
        "Subtotal": item.total
      }));

      dataRows.push({});
      dataRows.push({ "Item Name": "Taxable Subtotal", "Subtotal": subTotalAmount });
      dataRows.push({ "Item Name": "Discount Amount", "Subtotal": finalDiscount });
      dataRows.push({ "Item Name": "GST Amount", "Subtotal": gstAmountVal });
      dataRows.push({ "Item Name": "GRAND TOTAL", "Subtotal": grandTotal });

      const ws = XLSX.utils.json_to_sheet(dataRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Purchase Order");

      ws["!cols"] = [
        { wch: 6 },
        { wch: 30 },
        { wch: 10 },
        { wch: 15 },
        { wch: 12 },
        { wch: 10 },
        { wch: 18 }
      ];

      XLSX.writeFile(wb, `PO_${formData.quotation_id || 'PO'}.xlsx`);
      showToast('Excel PO exported successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to export Excel.', false);
    }
  };

  const filteredPOs = pos.filter(po =>
    po.po_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (po.vendor_name && po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedVendorObj = vendors.find(v => v.vendor_id === parseInt(formData.vendor_id));
  const selectedWarehouseObj = warehouses.find(w => w.id === parseInt(formData.delivery_warehouse_id));

  // Tabs for PO modal
  const tabs = [
    { id: 'order_info', label: 'Order Info', icon: Building2 },
    { id: 'item_details', label: 'Indent / Design', icon: Package },
    { id: 'tax_logistics', label: 'Tax & Logistics', icon: IndianRupee }
  ];

  return (
    <div className="animate-fade flex flex-col gap-6 h-full p-4" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
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
            <Box size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Purchase Orders (PO)</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Track purchase order requests, discounts, and dispatch orders to suppliers.</p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({
              quotation_id: '',
              vendor_id: vendors[0]?.vendor_id || '',
              expected_delivery_date: '',
              delivery_warehouse_id: warehouses[0]?.id.toString() || '',
              payment_terms: '30 Days Credit',
              delivery_instructions: '',
              discount_amount: 0,
              items: []
            });
            setActiveTab('order_info');
            setIsModalOpen(true);
          }}
          className="btn btn-primary font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
        >
          <Plus size={16} /> Create PO
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total POs Generated', value: pos.length, icon: <Box size={24} />, color: '#3b82f6' },
          { label: 'Active Suppliers', value: vendors.length, icon: <Users size={24} />, color: '#8b5cf6' },
          { label: 'Total Ordered Value', value: `₹${pos.reduce((s, p) => s + (p.grand_total || 0), 0).toLocaleString('en-IN')}`, icon: <TrendingUp size={24} />, color: '#10b981' }
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

      {/* PO Table */}
      <div className="card overflow-hidden flex-1 flex flex-col mt-4">
        <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center gap-4 bg-slate-50/40">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search PO No or Vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-blue-400" />
              <span className="text-xs">Loading purchase orders…</span>
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="p-5 bg-blue-50 rounded-2xl mb-1"><Box size={36} className="text-blue-300" /></div>
              <span className="text-sm font-bold text-slate-600">No purchase orders created yet.</span>
              <span className="text-xs text-slate-400">Click "Create PO" to raise the first purchase order.</span>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-100">
                  <th className="px-5 py-4">PO Number</th>
                  <th className="px-5 py-4">PO Date</th>
                  <th className="px-5 py-4">Vendor</th>
                  <th className="px-5 py-4">Delivery Warehouse</th>
                  <th className="px-5 py-4 text-right">Grand Total (incl. GST &amp; Disc)</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredPOs.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-800 font-mono text-sm">{po.po_no}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(po.po_date).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{po.vendor_name}</td>
                    <td className="px-5 py-4 text-slate-600">{po.delivery_warehouse_name}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-800">
                      ₹{(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold text-xs">
                        {po.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={async () => {
                          const detailedPO = await storesService.getPurchaseOrder(po.id);
                          setFormData({
                            quotation_id: detailedPO.quotation_id ? detailedPO.quotation_id.toString() : '',
                            vendor_id: detailedPO.vendor_id.toString(),
                            expected_delivery_date: detailedPO.expected_delivery_date ? detailedPO.expected_delivery_date.split('T')[0] : '',
                            delivery_warehouse_id: detailedPO.delivery_warehouse_id.toString(),
                            payment_terms: detailedPO.payment_terms,
                            delivery_instructions: detailedPO.delivery_instructions,
                            discount_amount: detailedPO.discount_amount,
                            items: detailedPO.items.map(item => ({
                              item_name: item.item_name,
                              quantity: item.quantity,
                              unit_price: item.unit_price,
                              discount_percentage: item.discount_percentage,
                              discount_amount: item.discount_amount,
                              gst: item.gst,
                              remarks: item.remarks || '',
                              total: item.total_with_gst || (item.quantity * item.unit_price)
                            }))
                          });
                          setActiveTab('tax_logistics');
                          setIsModalOpen(true);
                        }}
                        className="btn btn-secondary py-1.5 px-4 text-sm font-semibold mr-2"
                      >
                        Print Preview
                      </button>
                      <button onClick={() => handleDelete(po.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── STYLISH PO MODAL OVERLAY (Same UI as screenshot) ─── */}
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
                  New Purchase Order
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
                    <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Order Info</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>

                      <div className="form-group">
                        <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Link Vendor Quotation</label>
                        <select
                          value={formData.quotation_id}
                          onChange={(e) => handleQuotationChange(e.target.value)}
                          className="form-control"
                        >
                          <option value="">-- Select Quotation --</option>
                          {procurementQuotations.map(q => (
                            <option key={q.quotation_id} value={q.quotation_id}>QTN-{q.quotation_id} ({q.vendor?.vendor_name})</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Supplier Name *</label>
                        <select
                          value={formData.vendor_id}
                          onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                          required
                          className="form-control"
                        >
                          <option value="">Select Supplier...</option>
                          {vendors.map(v => (
                            <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Expected Delivery Date</label>
                        <input
                          type="date"
                          value={formData.expected_delivery_date}
                          onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                          className="form-control"
                        />
                      </div>

                      <div className="form-group">
                        <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Delivery At *</label>
                        <select
                          value={formData.delivery_warehouse_id}
                          onChange={(e) => setFormData({ ...formData, delivery_warehouse_id: e.target.value })}
                          required
                          className="form-control"
                        >
                          <option value="">Select Delivery Location...</option>
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.warehouse_name}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                      <div className="form-group">
                        <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Payment Terms</label>
                        <input
                          type="text"
                          value={formData.payment_terms}
                          onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Delivery Instructions</label>
                        <input
                          type="text"
                          value={formData.delivery_instructions}
                          onChange={(e) => setFormData({ ...formData, delivery_instructions: e.target.value })}
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Indent / Design (Items Table) */}
              {activeTab === 'item_details' && (
                <div className="animate-fade">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>Ordered Quantities & Rates</h4>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddManualItem}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}
                    >
                      <Plus size={14} /> Add Indent Row
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-bold tracking-wider border-b border-slate-100">
                          <th className="px-4 py-3" style={{ width: 60 }}>SNo</th>
                          <th className="px-4 py-3">Item Details</th>
                          <th className="px-4 py-3" style={{ width: 100 }}>Order Qty</th>
                          <th className="px-4 py-3" style={{ width: 120 }}>Unit Price (₹)</th>
                          <th className="px-4 py-3" style={{ width: 100 }}>GST %</th>
                          <th className="px-4 py-3" style={{ width: 100 }}>Discount %</th>
                          <th className="px-4 py-3 text-right" style={{ width: 160 }}>Subtotal (incl. GST & Disc)</th>
                          <th className="px-4 py-3 text-center" style={{ width: 60 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                        {formData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                className="form-control font-semibold"
                                placeholder="Enter Product Name..."
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
                              <select
                                className="form-control"
                                value={item.gst}
                                onChange={e => handleItemFieldChange(idx, 'gst', e.target.value)}
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                className="form-control"
                                min="0"
                                max="100"
                                value={item.discount_percentage}
                                onChange={e => handleItemFieldChange(idx, 'discount_percentage', e.target.value)}
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

              {/* Tab 3: Tax & Logistics (Print & Summary) */}
              {activeTab === 'tax_logistics' && (
                <div className="animate-fade">
                  <div className="flex justify-between items-center mb-6">
                    <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>Printable Purchase Order Preview</h4>
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
                        <Printer size={15} /> Print PO
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>

                    {/* Invoice block */}
                    <div ref={printAreaRef} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 30, background: '#fff' }}>
                      <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid #6366f1', paddingBottom: 20, marginBottom: 30 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e1b4b' }}>Dinesh Exports Private Limited</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>OFFICIAL PURCHASE ORDER</div>
                      </div>

                      <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
                        <div className="details-block" style={{ border: '1px solid #e2e8f0', padding: 15, borderRadius: 8, backgroundColor: '#f8fafc' }}>
                          <div className="details-title" style={{ fontWeight: 'bold', fontSize: 11, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>PO Details</div>
                          <div style={{ fontSize: 13, color: '#334155', marginBottom: 4 }}><b>Warehouse:</b> {selectedWarehouseObj?.warehouse_name || 'Main Warehouse'}</div>
                          <div style={{ fontSize: 13, color: '#334155', marginBottom: 4 }}><b>Delivery Instructions:</b> {formData.delivery_instructions || 'None'}</div>
                          <div style={{ fontSize: 13, color: '#334155' }}><b>Payment Terms:</b> {formData.payment_terms}</div>
                        </div>

                        <div className="details-block" style={{ border: '1px solid #e2e8f0', padding: 15, borderRadius: 8, backgroundColor: '#f8fafc' }}>
                          <div className="details-title" style={{ fontWeight: 'bold', fontSize: 11, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Vendor Info</div>
                          <div style={{ fontSize: 13, color: '#334155', fontWeight: 'bold' }}>{selectedVendorObj?.vendor_name || 'No Vendor Selected'}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{selectedVendorObj?.contact_info || 'No contact details'}</div>
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#6366f1' }}>
                            <th style={{ color: 'white', padding: 10, fontSize: 12 }}>SNo</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12 }}>Item Details</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12, textAlign: 'right' }}>Qty</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12, textAlign: 'right' }}>Unit Price (₹)</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12, textAlign: 'right' }}>Disc %</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12, textAlign: 'right' }}>GST %</th>
                            <th style={{ color: 'white', padding: 10, fontSize: 12, textAlign: 'right' }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0' }}>{idx + 1}</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{item.item_name || 'Custom Product'}</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{item.quantity}</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>₹{item.unit_price.toFixed(2)}</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{item.discount_percentage}%</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{item.gst}%</td>
                              <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>₹{item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{ display: 'flow-root' }}>
                        <div className="summary-box" style={{ float: 'right', width: 300, marginTop: 30, border: '1px solid #e2e8f0', padding: 15, borderRadius: 8, backgroundColor: '#f8fafc' }}>
                          <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                            <span>Taxable Subtotal:</span>
                            <span>₹{finalTaxableSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                            <span>Discount Allowed:</span>
                            <span>₹{finalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                            <span>Total GST Value:</span>
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
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 items-center">
                          <span className="text-slate-500">Taxable Subtotal</span>
                          <input
                            type="number"
                            className="form-control text-right font-bold"
                            style={{ width: 110, padding: '4px 8px' }}
                            value={formData.taxable_subtotal_override !== undefined ? formData.taxable_subtotal_override : subTotalAmount}
                            onChange={e => setFormData(prev => ({ ...prev, taxable_subtotal_override: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 items-center">
                          <span className="text-red-500">Override Discount</span>
                          <input
                            type="number"
                            className="form-control text-right text-red-500 font-bold"
                            style={{ width: 110, padding: '4px 8px' }}
                            value={formData.discount_amount}
                            onChange={e => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 items-center">
                          <span className="text-slate-500">Discount Amount</span>
                          <span className="font-bold text-slate-800">- ₹{finalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 items-center">
                          <span className="text-slate-500">GST Value (18%)</span>
                          <input
                            type="number"
                            className="form-control text-right font-bold"
                            style={{ width: 110, padding: '4px 8px' }}
                            value={formData.gst_amount_override !== undefined ? formData.gst_amount_override : gstAmountVal}
                            onChange={e => setFormData(prev => ({ ...prev, gst_amount_override: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="flex justify-between pt-2 items-center">
                          <span className="text-indigo-600 font-extrabold text-sm uppercase">Grand Total</span>
                          <input
                            type="number"
                            className="form-control text-right font-bold text-indigo-700"
                            style={{ width: 110, padding: '4px 8px' }}
                            value={formData.grand_total_override !== undefined ? formData.grand_total_override : grandTotal}
                            onChange={e => setFormData(prev => ({ ...prev, grand_total_override: parseFloat(e.target.value) || 0 }))}
                          />
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

    </div>
  );
}
