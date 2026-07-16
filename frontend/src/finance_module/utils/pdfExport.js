const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportToPDF({ title, companyName, period, data, reportType }) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(26, 59, 52);
  doc.text(companyName || 'Company Report', 14, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(75, 85, 99);
  doc.text(title, 14, 32);
  
  if (period) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(period, 14, 40);
  }

  let yPos = 50;
  
  const commonStyles = {
    theme: 'grid',
    headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    startY: yPos
  };

  if (reportType === 'balance-sheet' || reportType === 'profit-loss') {
    const head = [[
      reportType === 'balance-sheet' ? 'Liabilities' : 'Expenses',
      'Amount (₹)',
      reportType === 'balance-sheet' ? 'Assets' : 'Income',
      'Amount (₹)'
    ]];
    
    const body = [];
    const leftData = reportType === 'balance-sheet' ? data.liabilities?.groups : data.expenses?.groups;
    const rightData = reportType === 'balance-sheet' ? data.assets?.groups : data.income?.groups;
    
    const leftItems = [];
    Object.entries(leftData || {}).forEach(([g, items]) => {
      leftItems.push({ name: g, isGroup: true });
      items.forEach(i => leftItems.push({ name: '  ' + i.ledger, amount: i.amount }));
    });
    
    const rightItems = [];
    Object.entries(rightData || {}).forEach(([g, items]) => {
      rightItems.push({ name: g, isGroup: true });
      items.forEach(i => rightItems.push({ name: '  ' + i.ledger, amount: i.amount }));
    });
    
    const maxLen = Math.max(leftItems.length, rightItems.length);
    for (let i=0; i<maxLen; i++) {
      const l = leftItems[i];
      const r = rightItems[i];
      
      body.push([
        l ? l.name : '',
        l && l.amount ? fmt(l.amount) : '',
        r ? r.name : '',
        r && r.amount ? fmt(r.amount) : ''
      ]);
    }
    
    body.push([
      'Total',
      fmt(reportType === 'balance-sheet' ? data.liabilities?.total : data.expenses?.total),
      'Total',
      fmt(reportType === 'balance-sheet' ? data.assets?.total : data.income?.total)
    ]);

    autoTable(doc, {
      ...commonStyles,
      head,
      body,
      columnStyles: {
        1: { halign: 'right' },
        3: { halign: 'right' }
      },
      willDrawCell: function(data) {
        if (data.row.index === body.length - 1) {
          doc.setFont(undefined, 'bold');
          doc.setFillColor(229, 231, 235);
        }
      }
    });

  } else if (reportType === 'trial-balance') {
    const head = [['Particulars', 'Closing Dr (₹)', 'Closing Cr (₹)']];
    const body = [];
    
    Object.entries(data.grouped || {}).forEach(([group, items]) => {
      body.push([group, '', '']);
      items.forEach(r => {
        body.push([
          '  ' + r.ledger,
          r.closing_type === 'Dr' ? fmt(r.closing) : '',
          r.closing_type === 'Cr' ? fmt(r.closing) : ''
        ]);
      });
    });
    
    body.push(['Grand Total', fmt(data.raw?.total_dr), fmt(data.raw?.total_cr)]);
    
    autoTable(doc, {
      ...commonStyles,
      head,
      body,
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
    });

  } else if (reportType === 'ledger') {
    doc.setFontSize(12);
    doc.text(`Ledger: ${data.ledger_name}`, 14, 48);
    commonStyles.startY = 55;
    
    const head = [['Date', 'Voucher No', 'Type', 'Narration', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)']];
    const body = [];
    
    data.transactions?.forEach(row => {
      body.push([
        row.date,
        row.voucher_number,
        row.voucher_type,
        row.narration || '',
        row.dr_amount > 0 ? fmt(row.dr_amount) : '',
        row.cr_amount > 0 ? fmt(row.cr_amount) : '',
        `${fmt(row.balance)} ${row.balance_type}`
      ]);
    });
    
    autoTable(doc, {
      ...commonStyles,
      head,
      body,
      columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } }
    });

  } else if (reportType === 'outstanding') {
    const head = [['Party Name', 'Group', 'Outstanding (₹)', 'Type']];
    const body = [];
    
    data.items?.forEach(row => {
      body.push([
        row.ledger_name,
        row.group,
        fmt(row.outstanding),
        row.balance_type
      ]);
    });
    
    autoTable(doc, {
      ...commonStyles,
      head,
      body,
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'center' } }
    });

  } else if (reportType === 'register') {
    const head = [['Date', 'Invoice No', 'Party Name', 'Value (₹)', 'GST (₹)', 'Total (₹)']];
    const body = [];
    
    data.rows?.forEach(row => {
      body.push([
        row.date,
        row.voucher_number,
        row.party,
        fmt(data.mode === 'sales' ? row.sales_amount : row.purchase_amount),
        row.gst_amount > 0 ? fmt(row.gst_amount) : '',
        fmt(row.total)
      ]);
    });
    
    autoTable(doc, {
      ...commonStyles,
      head,
      body,
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
    });

  } else if (reportType === 'ratio') {
    doc.setFontSize(12);
    doc.text(`Current Ratio: ${data.current_ratio?.toFixed(2)}:1`, 14, 55);
    doc.text(`Gross Profit Ratio: ${(data.gross_profit_ratio || 0).toFixed(2)}%`, 14, 65);
    doc.text(`Net Profit Ratio: ${(data.net_profit_ratio || 0).toFixed(2)}%`, 14, 75);
    doc.text(`Working Capital: Rs.${fmt(data.working_capital)}`, 14, 85);

  } else if (reportType === 'gst-summary') {
    // KPI summary rows
    const head = [['Description', 'CGST (Rs.)', 'SGST (Rs.)', 'IGST (Rs.)', 'Total (Rs.)']];
    const out = data.breakdown?.output || {};
    const inp = data.breakdown?.input  || {};
    const outputTotal = (out.cgst||0) + (out.sgst||0) + (out.igst||0);
    const inputTotal  = (inp.cgst||0) + (inp.sgst||0) + (inp.igst||0);
    const netPayable  = data.net_payable || 0;
    const body = [
      ['Output Tax (Sales)',   fmt(out.cgst), fmt(out.sgst), fmt(out.igst), fmt(outputTotal)],
      ['Input Tax (Purchase)', fmt(inp.cgst), fmt(inp.sgst), fmt(inp.igst), fmt(inputTotal)],
      [netPayable >= 0 ? 'Net Tax Payable' : 'Net Tax Refundable',
       '', '', '', fmt(Math.abs(netPayable))],
    ];
    autoTable(doc, {
      ...commonStyles,
      head,
      body,
      columnStyles: { 1:{halign:'right'}, 2:{halign:'right'}, 3:{halign:'right'}, 4:{halign:'right'} },
    });

  } else if (reportType === 'gstr1') {
    const head = [['Date','Invoice No.','Customer','GSTIN','State','Taxable Val (Rs.)','CGST (Rs.)','SGST (Rs.)','IGST (Rs.)','Invoice Value (Rs.)']];
    const body = (data.rows || []).map(r => [
      r.date, r.voucher_number, r.customer_name, r.customer_gstin || '-',
      r.state_code || '-',
      fmt(r.taxable_value), fmt(r.cgst), fmt(r.sgst), fmt(r.igst), fmt(r.invoice_value)
    ]);
    const s = data.summary || {};
    body.push(['Grand Total','','','','',
      fmt(s.total_taxable_value), fmt(s.total_cgst), fmt(s.total_sgst),
      fmt(s.total_igst), fmt(s.total_invoice_value)
    ]);
    autoTable(doc, {
      ...commonStyles,
      head, body,
      columnStyles: { 5:{halign:'right'}, 6:{halign:'right'}, 7:{halign:'right'}, 8:{halign:'right'}, 9:{halign:'right'} },
    });

  } else if (reportType === 'gstr3b') {
    // Table 3.1
    autoTable(doc, {
      ...commonStyles,
      head: [['Nature of Supplies','IGST (Rs.)','CGST (Rs.)','SGST (Rs.)','Total Tax (Rs.)']],
      body: [[
        '(a) Outward taxable supplies',
        fmt(data.breakdown?.output?.igst), fmt(data.breakdown?.output?.cgst),
        fmt(data.breakdown?.output?.sgst), fmt(data.output_tax)
      ]],
      columnStyles: { 1:{halign:'right'}, 2:{halign:'right'}, 3:{halign:'right'}, 4:{halign:'right'} },
    });
    // Table 4
    const y2 = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10); doc.setTextColor(55,65,81);
    doc.text('Table 4: Eligible Input Tax Credit', 14, y2);
    autoTable(doc, {
      ...commonStyles, startY: y2 + 4,
      head: [['ITC Details','IGST (Rs.)','CGST (Rs.)','SGST (Rs.)','Total ITC (Rs.)']],
      body: [[
        '(A) All other ITC',
        fmt(data.breakdown?.input?.igst), fmt(data.breakdown?.input?.cgst),
        fmt(data.breakdown?.input?.sgst), fmt(data.input_tax)
      ]],
      columnStyles: { 1:{halign:'right'}, 2:{halign:'right'}, 3:{halign:'right'}, 4:{halign:'right'} },
    });
    // Net payable
    const y3 = doc.lastAutoTable.finalY + 8;
    doc.text('Table 6.1: Net Tax Payable', 14, y3);
    const np = data.net_payable || 0;
    autoTable(doc, {
      ...commonStyles, startY: y3 + 4,
      head: [['Tax','Output Tax (Rs.)','ITC (Rs.)','Net Payable (Rs.)']],
      body: [
        ['IGST', fmt(data.breakdown?.output?.igst), fmt(data.breakdown?.input?.igst),
          fmt((data.breakdown?.output?.igst||0)-(data.breakdown?.input?.igst||0))],
        ['CGST', fmt(data.breakdown?.output?.cgst), fmt(data.breakdown?.input?.cgst),
          fmt((data.breakdown?.output?.cgst||0)-(data.breakdown?.input?.cgst||0))],
        ['SGST', fmt(data.breakdown?.output?.sgst), fmt(data.breakdown?.input?.sgst),
          fmt((data.breakdown?.output?.sgst||0)-(data.breakdown?.input?.sgst||0))],
        ['Total', fmt(data.output_tax), fmt(data.input_tax),
          `${fmt(Math.abs(np))} ${np >= 0 ? 'Payable' : 'Refundable'}`],
      ],
      columnStyles: { 1:{halign:'right'}, 2:{halign:'right'}, 3:{halign:'right'} },
    });

  } else if (reportType === 'itc') {
    const head = [['Date','Bill No.','Supplier','GSTIN','State','Taxable Val (Rs.)','CGST (Rs.)','SGST (Rs.)','IGST (Rs.)','Total ITC (Rs.)']];
    const body = (data.rows || []).map(r => [
      r.date, r.voucher_number, r.supplier_name, r.supplier_gstin || '-',
      r.state_code || '-',
      fmt(r.taxable_value), fmt(r.cgst), fmt(r.sgst), fmt(r.igst), fmt(r.total_tax)
    ]);
    const s = data.summary || {};
    body.push(['Grand Total','','','','',
      fmt(s.total_taxable_value), fmt(s.total_cgst), fmt(s.total_sgst),
      fmt(s.total_igst), fmt(s.total_tax)
    ]);
    autoTable(doc, {
      ...commonStyles,
      head, body,
      columnStyles: { 5:{halign:'right'}, 6:{halign:'right'}, 7:{halign:'right'}, 8:{halign:'right'}, 9:{halign:'right'} },
    });

  } else if (reportType === 'inventory') {
    const { tab, rows: invRows = [] } = data;
    let head, body;
    if (tab === 'items') {
      head = [['Item Name','HSN Code','Unit','GST Rate','Purchase Rate (Rs.)','Selling Rate (Rs.)']];
      body = invRows.map(r => [
        r.name, r.hsn_code || '-', r.unit || '-',
        r.gst_rate > 0 ? `${r.gst_rate}%` : 'Nil',
        fmt(r.purchase_rate), fmt(r.selling_rate)
      ]);
    } else if (tab === 'units') {
      head = [['Symbol','Formal Name','Decimal Places']];
      body = invRows.map(r => [r.symbol, r.formal_name || '-', r.number_of_decimal_places ?? 2]);
    } else {
      // groups, categories, locations
      head = [['Name','Under']];
      body = invRows.map(r => [r.name, r.parent_name || 'Primary']);
    }
    autoTable(doc, { ...commonStyles, head, body });
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
}
