import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * A reusable Export button that matches the Party Master export dropdown UI.
 * It provides "PDF Report" and "Excel Sheet" options.
 *
 * @param {Array} data - The array of objects to export (should be the currently filtered/sorted data)
 * @param {String} filename - The base filename for exported files (e.g., 'Vehicle_List_Report')
 * @param {Array} columns - Array of column definitions: { header: 'Column Name', key: 'dataKey', render: (row) => value }
 * @param {String} pdfTitle - The title to display inside the PDF document
 */
export default function ExportButton({ data, filename, columns, pdfTitle }) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      setShowExportMenu(false);
      return;
    }
    
    const doc = new jsPDF();
    doc.text(pdfTitle || filename, 14, 15);
    
    const tableColumn = columns.map(col => col.header);
    const tableRows = data.map(row => {
      return columns.map(col => {
        let val = row[col.key];
        if (typeof col.render === 'function') {
          val = col.render(row);
        }
        return (val !== null && val !== undefined && val !== '') ? val : '-';
      });
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      didDrawPage: function (dataInfo) {
        // Page numbering
        let str = 'Page ' + doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        let pageSize = doc.internal.pageSize;
        let pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, dataInfo.settings.margin.left, pageHeight - 10);
        
        // Export date and time
        const exportDate = new Date().toLocaleString();
        doc.text(`Exported on: ${exportDate}`, pageSize.width - dataInfo.settings.margin.right - 60, pageHeight - 10);
      }
    });
    
    const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${safeFilename}_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      setShowExportMenu(false);
      return;
    }

    const wsData = data.map(row => {
      const rowData = {};
      columns.forEach(col => {
        let val = row[col.key];
        if (typeof col.render === 'function') {
          val = col.render(row);
        }
        rowData[col.header] = (val !== null && val !== undefined && val !== '') ? val : '-';
      });
      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    
    // Auto-fit column widths
    const colWidths = columns.map(col => {
      const headerLength = col.header ? col.header.length : 10;
      const maxContentLength = wsData.reduce((max, row) => {
        const val = row[col.header] ? row[col.header].toString() : '';
        return Math.max(max, val.length);
      }, headerLength);
      return { wch: maxContentLength + 2 }; 
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    
    const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(wb, `${safeFilename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        className="btn btn-secondary"
        onClick={() => setShowExportMenu(!showExportMenu)}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <Download size={16} /> Export
      </button>

      {showExportMenu && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 140, overflow: 'hidden' }}>
          <button
            onClick={handleExportPDF}
            style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <FileText size={16} color="#ef4444" /> PDF Report
          </button>
          <button
            onClick={handleExportExcel}
            style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <Download size={16} color="#10b981" /> Excel Sheet
          </button>
        </div>
      )}
    </div>
  );
}
