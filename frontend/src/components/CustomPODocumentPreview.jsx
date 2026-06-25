import React from 'react';
import { Printer, X } from 'lucide-react';
import defaultLogo from '../assets/logo.png';

// Function to convert numbers to Indian Rupees in words
const toIndianRupeesWords = (amount) => {
  if (!amount) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = ('000000000' + amount).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
  return str;
};

const CustomPODocumentPreview = ({
  isOpen,
  onClose,
  title = "PURCHASE ORDER FORM",
  companyProfile = { company_name: 'DINESH EXPORTS', description: 'THE HOUSE OF FABRICS', logo: defaultLogo },
  poNumber = "-",
  poDate = "-",
  deliveryAt = "1-6-A, Aiyndhupanal post, Kadachanallur post, Komarapalayam TK, Tiruchengodu, Namakkal-638008.",
  agentName = "",
  supplierName = "",
  designNo = "-",
  commission = "0.00",
  tableHeaders = [],
  tableRows = [], // Array of objects with rowData and optional rowNote
  terms = [],
  taxes = { cgst_pct: 0, cgst_amt: 0, sgst_pct: 0, sgst_amt: 0, igst_pct: 0, igst_amt: 0 },
  freightChg = 0,
  insuranceChg = 0,
  netAmount = 0,
  logistics = { freight_type: "-", transport: "-", delivery_date: "-", payment_terms: "-" },
  designWiseDetails = "",
  colorWiseDetails = ""
}) => {
  if (!isOpen) return null;

  return (
    <div className="animate-fade" style={{ background: '#f8fafc', padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-custom-po, #printable-custom-po * { visibility: visible !important; }
          #printable-custom-po {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important; margin: 0 !important; padding: 0 !important;
            box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header Actions */}
      <div className="no-print" style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, background: '#fff', padding: '16px 24px', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title} Document Preview</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} /> Print / Export PDF
          </button>
          <button className="btn btn-secondary" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <X size={16} /> Close
          </button>
        </div>
      </div>

      {/* Printable Form */}
      <div id="printable-custom-po" style={{ backgroundColor: '#fff', width: '100%', maxWidth: '1000px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', position: 'relative', marginBottom: '20px' }}>
          <h3 style={{ textDecoration: 'underline', fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title} Form</h3>
          <span style={{ position: 'absolute', right: '0', bottom: '0', fontSize: '11px', fontWeight: '600', color: '#475569' }}>Original / Duplicate / Extra</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '13px', color: '#000' }}>
          <tbody>
            <tr>
              <td style={{ width: '55%', border: '1px solid #000', padding: '12px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <img src={companyProfile.logo || defaultLogo} alt="Logo" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>{companyProfile.company_name}</div>
                    <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#1e293b', whiteSpace: 'pre-line' }}>{companyProfile.description}</div>
                    <div style={{ fontSize: '11px', marginTop: '4px', color: '#1e293b' }}><strong>E-Mail:</strong> palanivel@dineshexports.net</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>GST : 33AAACD0905A1ZG</div>
                  </div>
                </div>
              </td>
              <td style={{ width: '45%', border: '1px solid #000', padding: 0, verticalAlign: 'top' }}>
                <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px', borderBottom: '1px solid #000', fontSize: '14px' }}>
                        <strong>P.O.No. :</strong> <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{poNumber}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <strong>P.O. Date :</strong> <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>{poDate}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td style={{ width: '55%', border: '1px solid #000', padding: '12px', verticalAlign: 'top' }}>
                <div style={{ textAlign: 'center', textDecoration: 'underline', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Delivery At</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>DINESH EXPORTS PRIVATE LIMITED</div>
                <div style={{ fontSize: '11px', lineHeight: '1.4', margin: '4px 0', color: '#1e293b' }}>{deliveryAt}</div>
                <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '4px' }}>GST : 33AAACD0905A1ZG</div>
              </td>
              <td style={{ width: '45%', border: '1px solid #000', padding: '12px', verticalAlign: 'top' }}>
                <div style={{ textAlign: 'center', textDecoration: 'underline', fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Agent / Mill Name and Address</div>
                <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#1e293b', whiteSpace: 'pre-line' }}>
                  {agentName && (<div><strong>Agent:</strong> {agentName}</div>)}
                  {supplierName ? (
                    <div style={{ marginTop: agentName ? '6px' : '0' }}><strong>Supplier:</strong> {supplierName}</div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b', marginTop: '10px' }}>-</div>
                  )}
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan="2" style={{ border: '1px solid #000', padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                  <span>Design No. : <span style={{ fontWeight: 'normal', marginLeft: '6px' }}>{designNo}</span></span>
                  <span>Commission % : <span style={{ fontWeight: 'normal', marginLeft: '6px' }}>{commission}</span></span>
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan="2" style={{ border: '1px solid #000', padding: 0, verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #000' }}>
                      {tableHeaders.map((col, idx) => (
                        <th key={idx} style={{ borderRight: idx !== tableHeaders.length - 1 ? '1px solid #000' : 'none', padding: '8px 10px', textAlign: col.align || 'left', fontSize: '12px', fontWeight: 'bold', width: col.width || 'auto' }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((rowObj, idx) => (
                      <React.Fragment key={idx}>
                        <tr style={{ borderBottom: '1px solid #000' }}>
                          {rowObj.rowData.map((cellValue, cellIdx) => (
                            <td key={cellIdx} style={{ borderRight: cellIdx !== tableHeaders.length - 1 ? '1px solid #000' : 'none', padding: '10px', textAlign: tableHeaders[cellIdx].align || 'left', fontSize: '12px', fontWeight: cellIdx === rowObj.rowData.length - 1 ? 'bold' : 'normal' }}>
                              {cellValue}
                            </td>
                          ))}
                        </tr>
                        {rowObj.rowNote && (
                          <tr style={{ borderBottom: '1px solid #000' }}>
                            <td colSpan={tableHeaders.length} style={{ padding: '8px 12px', fontSize: '11px', color: '#1e293b', backgroundColor: '#f8fafc', fontStyle: 'italic' }}>
                              {rowObj.rowNote}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>

            {(designWiseDetails || colorWiseDetails) && (
              <tr>
                <td colSpan="2" style={{ border: '1px solid #000', padding: '12px', fontSize: '12px' }}>
                  {designWiseDetails && (
                    <div style={{ marginBottom: colorWiseDetails ? '12px' : '0' }}>
                      <strong style={{ fontStyle: 'italic' }}>Design wise Details:</strong>
                      <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px', color: '#1e293b' }}>{designWiseDetails}</div>
                    </div>
                  )}
                  {colorWiseDetails && (
                    <div>
                      <strong style={{ fontStyle: 'italic' }}>Color wise Details:</strong>
                      <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px', color: '#1e293b' }}>{colorWiseDetails}</div>
                    </div>
                  )}
                </td>
              </tr>
            )}

            <tr>
              <td style={{ width: '55%', border: '1px solid #000', padding: '12px', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '8px', fontSize: '12px' }}>Terms and Conditions:</div>
                <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', lineHeight: '1.6', color: '#1e293b' }}>
                  {terms.map((term, tIdx) => (
                    <li key={tIdx} style={{ marginBottom: '4px' }}>{term}</li>
                  ))}
                </ol>
              </td>
              <td style={{ width: '45%', border: '1px solid #000', padding: 0, verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '12px' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right', width: '60%' }}>CGST: {parseFloat(taxes.cgst_pct || 0).toFixed(2)} %</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', width: '40%' }}>{taxes.cgst_amt > 0 ? parseFloat(taxes.cgst_amt).toFixed(2) : '0.00'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right' }}>SGST: {parseFloat(taxes.sgst_pct || 0).toFixed(2)} %</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{taxes.sgst_amt > 0 ? parseFloat(taxes.sgst_amt).toFixed(2) : '0.00'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right' }}>IGST: {parseFloat(taxes.igst_pct || 0).toFixed(2)} %</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{taxes.igst_amt > 0 ? parseFloat(taxes.igst_amt).toFixed(2) : '0.00'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right' }}>Freight Chg:</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{freightChg ? parseFloat(freightChg).toFixed(2) : '0.00'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 'bold', textAlign: 'right' }}>Insurance Chg:</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{insuranceChg ? parseFloat(insuranceChg).toFixed(2) : '0.00'}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f8fafc', borderTop: '1.5px solid #000' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold', textAlign: 'right', fontSize: '13px' }}>Net Amount :</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{parseFloat(netAmount || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td colSpan="2" style={{ border: '1px solid #000', padding: '12px', fontSize: '13px' }}>
                <strong>Rupees :</strong> <span style={{ fontStyle: 'italic', marginLeft: '8px', fontWeight: 'bold' }}>{toIndianRupeesWords(netAmount || 0)}</span>
              </td>
            </tr>

            <tr>
              <td colSpan="2" style={{ border: '1px solid #000', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '12px' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ width: '20%', padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Freight</td>
                      <td style={{ width: '30%', padding: '8px 10px', borderRight: '1px solid #000' }}>{logistics.freight_type || '-'}</td>
                      <td style={{ width: '20%', padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Transport</td>
                      <td style={{ width: '30%', padding: '8px 10px' }}>{logistics.transport || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '20%', padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Delivery Date</td>
                      <td style={{ width: '30%', padding: '8px 10px', borderRight: '1px solid #000' }}>{logistics.delivery_date || '-'}</td>
                      <td style={{ width: '20%', padding: '8px 10px', fontWeight: 'bold', borderRight: '1px solid #000', backgroundColor: '#f8fafc' }}>Payment terms</td>
                      <td style={{ width: '30%', padding: '8px 10px' }}>{logistics.payment_terms || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td colSpan="2" style={{ border: '1px solid #000', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', padding: '24px 12px 12px 12px', textAlign: 'left', verticalAlign: 'bottom', borderRight: '1px solid #000' }}>
                        <div style={{ marginTop: '40px', fontWeight: 'bold', fontSize: '12px' }}>Supplier's Signature</div>
                      </td>
                      <td style={{ width: '50%', padding: '12px', textAlign: 'right', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>For DINESH EXPORTS PRIVATE LIMITED</div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Authorised Signatory</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomPODocumentPreview;
