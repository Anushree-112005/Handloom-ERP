import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowLeft, Box, Briefcase, Building2, CheckCircle, Clock, Download, Edit2, Eye, FileSpreadsheet, FileText, IndianRupee, Loader2, MapPin, Package, Phone, Plus, Printer, RefreshCw, Save, Search, ShieldCheck, Tag, Trash2, TrendingUp, UploadCloud, User, Users, X, Filter, Globe, Mail, ClipboardList } from 'lucide-react';

import storesService from '../../services/storesService';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import MasterDropdown from '../../components/MasterDropdown';
import ExportButton from '../../components/ExportButton';

import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function PurchaseOrder() {
  const [view, setView] = useState('list');

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [procurementQuotations, setProcurementQuotations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Modal toggle state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('order_info'); // order_info, item_details, tax_logistics
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [editingId, setEditingId] = useState(null);

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
    const selectedQ = procurementQuotations.find(q => q.quotation_id === parseInt(qId) || q.quotation_id.toString() === qId.toString());
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
    } else {
      setFormData(prev => ({
        ...prev,
        quotation_id: qId
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

      if (editingId) {
        if (storesService.updatePurchaseOrder) {
          await storesService.updatePurchaseOrder(editingId, payload);
          showToast('Purchase Order updated successfully!');
        } else {
          showToast('Update endpoint missing in storesService.', false);
        }
      } else {
        await storesService.createPurchaseOrder(payload);
        showToast('Purchase Order placed successfully!');
      }
      setIsModalOpen(false);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to place Purchase Order.', false);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (po) => {
    const detailedPO = await storesService.getPurchaseOrder(po.id);
    setFormData({
      quotation_id: detailedPO.quotation_id || '',
      vendor_id: detailedPO.vendor_id ? detailedPO.vendor_id.toString() : '',
      expected_delivery_date: detailedPO.expected_delivery_date ? new Date(detailedPO.expected_delivery_date).toISOString().slice(0, 10) : '',
      delivery_warehouse_id: detailedPO.delivery_warehouse_id ? detailedPO.delivery_warehouse_id.toString() : '',
      payment_terms: detailedPO.payment_terms || '30 Days Credit',
      delivery_instructions: detailedPO.delivery_instructions || '',
      discount_amount: detailedPO.discount_amount || 0,
      taxable_subtotal_override: detailedPO.total_amount_override,
      gst_amount_override: detailedPO.tax_amount_override,
      grand_total_override: detailedPO.grand_total_override,
      items: detailedPO.items || []
    });
    setEditingId(po.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name });
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
      doc.text("Handloom ERP Private Limited", 14, 20);

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

  const totalPOValue = pos.reduce((sum, po) => sum + (parseFloat(po.grand_total) || 0), 0);
  const pendingPOsCount = pos.filter(po => po.status?.toLowerCase() === 'pending').length;
  const approvedPOsCount = pos.filter(po => po.status?.toLowerCase() === 'approved').length;
  const uniqueVendors = new Set(pos.map(po => po.vendor_id)).size;

  const stats = [
    {
      label: 'Total Purchase Orders', value: pos.length,
      icon: <FileSpreadsheet size={24} />, color: '#3b82f6'
    },
    {
      label: 'Pending Orders', value: pendingPOsCount,
      icon: <Clock size={24} />, color: '#f59e0b'
    },
    {
      label: 'Approved Orders', value: approvedPOsCount,
      icon: <CheckCircle size={24} />, color: '#10b981'
    },
    {
      label: 'Vendors in Use', value: uniqueVendors,
      icon: <Briefcase size={24} />, color: '#8b5cf6'
    }
  ];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box size={24} color="var(--primary)" /> Purchase Orders (PO)
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Track purchase order requests, discounts, and dispatch orders to suppliers.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExportButton
            data={filteredPOs}
            filename="Purchase_Order_Report"
            pdfTitle="Purchase Order Report"
            columns={[
              { header: 'PO Number', key: 'po_no' },
              { header: 'Date', key: 'po_date', render: (row) => new Date(row.po_date).toLocaleDateString() },
              { header: 'Vendor', key: 'vendor_name' },
              { header: 'Warehouse', key: 'delivery_warehouse_name' },
              { header: 'Grand Total', key: 'grand_total', render: (row) => `₹${(row.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
              { header: 'Status', key: 'status' }
            ]}
          />
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
              placeholder="Search PO No or Vendor..."
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
              <option>All Statuses</option>
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
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>PO Date</th>
                  <th>Vendor</th>
                  <th>Delivery Warehouse</th>
                  <th style={{ textAlign: 'right' }}>Grand Total (incl. GST & Disc)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredPOs.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No purchase orders created yet.</td></tr>
                ) : (
                  filteredPOs.map(po => (
                    <tr 
                      key={po.id}
                      onClick={async () => {
                        const detailedPO = await storesService.getPurchaseOrder(po.id);
                        setSelectedViewItem(detailedPO);
                      }}
                      style={{ cursor: 'pointer', transition: 'background 0.2s', background: selectedViewItem?.id === po.id ? 'var(--bg-secondary)' : 'transparent' }}
                    >
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 700 }}>{po.po_no}</td>
                      <td>{new Date(po.po_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{po.vendor_name}</td>
                      <td>{po.delivery_warehouse_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${po.status.toLowerCase().replace(' ', '-')}`}>
                          {po.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleEdit(po)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={async () => {
                              const detailedPO = await storesService.getPurchaseOrder(po.id);
                              setSelectedViewItem(detailedPO);
                            }}
                            title="Preview"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(po.id, `PO-${po.id}`, e)}
                            className="btn btn-secondary"
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete PO"
                          >
                            <Trash2 size={16} color="var(--danger, #ef4444)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                          <MasterDropdown
                            label=""
                            name="quotation_id"
                            value={formData.quotation_id}
                            options={procurementQuotations.map(q => ({ ...q, name: `QTN-${q.quotation_id} (${q.vendor?.vendor_name})`, id: q.quotation_id.toString() }))}
                            onChange={(name, val) => handleQuotationChange(val)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="font-semibold text-slate-700 text-xs mb-1.5 block">Supplier Name *</label>
                          <MasterDropdown
                            label=""
                            name="vendor_id"
                            value={formData.vendor_id}
                            options={vendors.map(v => ({ ...v, name: v.vendor_name, id: v.vendor_id }))}
                            required={true}
                            onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                          />
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
                          <MasterDropdown
                            label=""
                            name="delivery_warehouse_id"
                            value={formData.delivery_warehouse_id}
                            options={warehouses.map(w => ({ ...w, name: w.warehouse_name }))}
                            required={true}
                            onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                          />
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
                                <MasterDropdown
                                  label=""
                                  name="gst"
                                  value={item.gst}
                                  options={['0', '5', '12', '18', '28']}
                                  onChange={(name, val) => handleItemFieldChange(idx, name, val)}
                                />
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
                          <div style={{ fontSize: 24, fontWeight: 800, color: '#1e1b4b' }}>Handloom ERP Private Limited</div>
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

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Purchase Order Preview</h3>
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
                      <div><img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} /></div>
                      <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>HANDLOOM ERP</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}></p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>PURCHASE ORDER</h2>
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
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={async () => {
                  const { id } = deleteConfirm;
                  setDeleteConfirm({ show: false, id: null, name: '' });
                  try {
                    await storesService.deletePurchaseOrder(id);
                    showToast("PO deleted successfully.");
                    loadData();
                    if (typeof setSelectedViewItem === 'function' && selectedViewItem?.id === id) setSelectedViewItem(null);
                  } catch (err) {
                    showToast("Error deleting PO. It may be in use.", 'error');
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
    </div>
  );
}

