const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export async function exportToPPT({ title, companyName, period, data, reportType }) {
  const pptx = new window.PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  // Title Slide
  let slide = pptx.addSlide();
  slide.background = { color: 'F8F9FA' };
  
  slide.addText(companyName || 'Company Report', {
    x: 1, y: 2, w: '80%', h: 1,
    fontSize: 32, bold: true, color: '1A3B34',
    align: 'center'
  });
  
  slide.addText(title, {
    x: 1, y: 3, w: '80%', h: 0.8,
    fontSize: 24, color: '4B5563',
    align: 'center'
  });

  if (period) {
    slide.addText(period, {
      x: 1, y: 3.8, w: '80%', h: 0.6,
      fontSize: 14, color: '6B7280',
      align: 'center'
    });
  }

  const tableOpts = { 
    x: 0.5, y: 1.0, w: 9, 
    fontSize: 10, 
    border: { type: 'solid', color: 'D1D5DB' },
    autoPage: true,
    autoPageRepeatHeader: true,
    autoPageLineWeight: -0.5
  };

  // Data Slide based on reportType
  if (reportType === 'balance-sheet' || reportType === 'profit-loss') {
    const slide2 = pptx.addSlide();
    slide2.addText(title, { x: 0.5, y: 0.3, w: '90%', fontSize: 18, bold: true, color: '1A3B34' });
    
    const rows = [];
    rows.push([
      { text: reportType === 'balance-sheet' ? 'Liabilities' : 'Expenses', options: { bold: true, fill: 'F3F4F6' } },
      { text: 'Amount (₹)', options: { bold: true, fill: 'F3F4F6', align: 'right' } },
      { text: reportType === 'balance-sheet' ? 'Assets' : 'Income', options: { bold: true, fill: 'F3F4F6' } },
      { text: 'Amount (₹)', options: { bold: true, fill: 'F3F4F6', align: 'right' } }
    ]);
    
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
      
      const row = [];
      if (l) {
        row.push({ text: l.name, options: { bold: l.isGroup } });
        row.push({ text: l.amount ? fmt(l.amount) : '', options: { align: 'right' } });
      } else {
        row.push(''); row.push('');
      }
      
      if (r) {
        row.push({ text: r.name, options: { bold: r.isGroup } });
        row.push({ text: r.amount ? fmt(r.amount) : '', options: { align: 'right' } });
      } else {
        row.push(''); row.push('');
      }
      rows.push(row);
    }
    
    rows.push([
      { text: 'Total', options: { bold: true, fill: 'E5E7EB' } },
      { text: fmt(reportType === 'balance-sheet' ? data.liabilities?.total : data.expenses?.total), options: { bold: true, fill: 'E5E7EB', align: 'right' } },
      { text: 'Total', options: { bold: true, fill: 'E5E7EB' } },
      { text: fmt(reportType === 'balance-sheet' ? data.assets?.total : data.income?.total), options: { bold: true, fill: 'E5E7EB', align: 'right' } }
    ]);
    
    slide2.addTable(rows, tableOpts);
    
  } else if (reportType === 'trial-balance') {
    const slide2 = pptx.addSlide();
    slide2.addText(title, { x: 0.5, y: 0.3, w: '90%', fontSize: 18, bold: true, color: '1A3B34' });
    
    const rows = [
      [
        { text: 'Particulars', options: { bold: true, fill: 'F3F4F6' } },
        { text: 'Closing Dr (₹)', options: { bold: true, fill: 'F3F4F6', align: 'right' } },
        { text: 'Closing Cr (₹)', options: { bold: true, fill: 'F3F4F6', align: 'right' } }
      ]
    ];
    
    Object.entries(data.grouped || {}).forEach(([group, items]) => {
      rows.push([{ text: group, options: { bold: true, fill: 'F9FAFB' } }, '', '']);
      items.forEach(r => {
        rows.push([
          '  ' + r.ledger,
          { text: r.closing_type === 'Dr' ? fmt(r.closing) : '', options: { align: 'right' } },
          { text: r.closing_type === 'Cr' ? fmt(r.closing) : '', options: { align: 'right' } }
        ]);
      });
    });
    
    rows.push([
      { text: 'Grand Total', options: { bold: true, fill: 'E5E7EB' } },
      { text: fmt(data.raw?.total_dr), options: { bold: true, fill: 'E5E7EB', align: 'right' } },
      { text: fmt(data.raw?.total_cr), options: { bold: true, fill: 'E5E7EB', align: 'right' } }
    ]);
    
    slide2.addTable(rows, tableOpts);
  } else if (reportType === 'ledger') {
     const slide2 = pptx.addSlide();
     slide2.addText(`Ledger: ${data.ledger_name}`, { x: 0.5, y: 0.3, w: '90%', fontSize: 18, bold: true, color: '1A3B34' });
     
     const rows = [
       ['Date', 'Voucher No', 'Type', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)']
     ].map(r => r.map(c => ({ text: c, options: { bold: true, fill: 'F3F4F6' } })));
     
     data.transactions?.forEach(row => {
       rows.push([
         row.date,
         row.voucher_number,
         row.voucher_type,
         { text: row.dr_amount > 0 ? fmt(row.dr_amount) : '', options: { align: 'right' } },
         { text: row.cr_amount > 0 ? fmt(row.cr_amount) : '', options: { align: 'right' } },
         { text: `${fmt(row.balance)} ${row.balance_type}`, options: { align: 'right', bold: true } }
       ]);
     });
     
     slide2.addTable(rows, tableOpts);
  } else if (reportType === 'outstanding') {
     const slide2 = pptx.addSlide();
     slide2.addText(title, { x: 0.5, y: 0.3, w: '90%', fontSize: 18, bold: true, color: '1A3B34' });
     
     const rows = [
       ['Party Name', 'Group', 'Outstanding (₹)', 'Type']
     ].map(r => r.map(c => ({ text: c, options: { bold: true, fill: 'F3F4F6' } })));
     
     data.items?.forEach(row => {
       rows.push([
         row.ledger_name,
         row.group,
         { text: fmt(row.outstanding), options: { align: 'right', bold: true } },
         row.balance_type
       ]);
     });
     
     slide2.addTable(rows, tableOpts);
  } else if (reportType === 'register') {
     const slide2 = pptx.addSlide();
     slide2.addText(title, { x: 0.5, y: 0.3, w: '90%', fontSize: 18, bold: true, color: '1A3B34' });
     
     const rows = [
       ['Date', 'Invoice No', 'Party Name', 'Value (₹)', 'GST (₹)', 'Total (₹)']
     ].map(r => r.map(c => ({ text: c, options: { bold: true, fill: 'F3F4F6' } })));
     
     data.rows?.forEach(row => {
       rows.push([
         row.date,
         row.voucher_number,
         row.party,
         { text: fmt(data.mode === 'sales' ? row.sales_amount : row.purchase_amount), options: { align: 'right' } },
         { text: row.gst_amount > 0 ? fmt(row.gst_amount) : '', options: { align: 'right' } },
         { text: fmt(row.total), options: { align: 'right', bold: true } }
       ]);
     });
     
     slide2.addTable(rows, tableOpts);
  } else if (reportType === 'ratio') {
     const slide2 = pptx.addSlide();
     slide2.addText('Ratio Analysis', { x: 0.5, y: 0.3, w: '90%', fontSize: 18, bold: true, color: '1A3B34' });
     
     slide2.addText(`Current Ratio: ${data.current_ratio?.toFixed(2)}:1`, { x: 0.5, y: 1, w: '90%', fontSize: 14 });
     slide2.addText(`Gross Profit Ratio: ${(data.gross_profit_ratio || 0).toFixed(2)}%`, { x: 0.5, y: 1.5, w: '90%', fontSize: 14 });
     slide2.addText(`Net Profit Ratio: ${(data.net_profit_ratio || 0).toFixed(2)}%`, { x: 0.5, y: 2, w: '90%', fontSize: 14 });
     slide2.addText(`Working Capital: ₹${fmt(data.working_capital)}`, { x: 0.5, y: 2.5, w: '90%', fontSize: 14 });
  }

  pptx.writeFile({ fileName: `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pptx` });
}
