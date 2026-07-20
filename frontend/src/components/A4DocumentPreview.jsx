import React from 'react';
import { Download, X, Box, User, Phone, MapPin, IndianRupee, Briefcase, FileText, Mail, Globe } from 'lucide-react';
import logoImg from '../assets/logo.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBackendURL } from '../services/api';

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

const getIcon = (iconName) => {
  switch (iconName) {
    case 'User': return <User size={14} />;
    case 'Phone': return <Phone size={14} />;
    case 'MapPin': return <MapPin size={14} />;
    case 'IndianRupee': return <IndianRupee size={14} />;
    case 'Briefcase': return <Briefcase size={14} />;
    case 'FileText': return <FileText size={14} />;
    default: return <Box size={14} />;
  }
};

const A4DocumentPreview = ({ 
  isOpen, 
  onClose, 
  title = "DOCUMENT PROFILE", 
  documentNumber = "", 
  status = "ACTIVE",
  sections = [],
  onDownloadPdf
}) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: '#4f46e5' }} /> 
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{title} Preview</h3>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={onDownloadPdf} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
              <Download size={14} /> Download PDF
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
          
          {/* A4 Paper */}
          <div style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>
            
            {/* Top Header Section */}
            <div style={{ padding: '32px 40px 20px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div>
                    <img src={logoImg} alt="Dinesh Exports" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                    <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                  </div>
                </div>
                <div style={{ textAlign: 'left', width: 300 }}>
                  <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>{title}</h2>
                  
                  <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                    <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Document No</div>
                    <div style={{ width: 20, textAlign: 'center' }}>:</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{documentNumber || '-'}</div>
                  </div>
                  <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                    <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                    <div style={{ width: 20, textAlign: 'center' }}>:</div>
                    <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(status || 'ACTIVE').toUpperCase()}</span></div>
                  </div>
                  <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                    <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Generated On</div>
                    <div style={{ width: 20, textAlign: 'center' }}>:</div>
                    <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thick Line */}
            <div style={{ borderBottom: '3px solid #0f172a' }}></div>

            {/* Body Content */}
            <div style={{ padding: '10px 40px 40px 40px' }}>
              
              {sections.map((section, index) => (
                <div key={index} style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                  <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                    {getIcon(section.icon)} {index + 1}. {section.title.toUpperCase()}
                  </div>
                  
                  {section.type === 'grid' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        {section.data.slice(0, Math.ceil(section.data.length / 2)).map((item, i) => (
                          <InfoRow key={i} label={item.label} value={item.value} />
                        ))}
                      </div>
                      <div>
                        {section.data.slice(Math.ceil(section.data.length / 2)).map((item, i) => (
                          <InfoRow key={i} label={item.label} value={item.value} />
                        ))}
                      </div>
                    </div>
                  )}

                  {section.type === 'list' && (
                    <div>
                      {section.data.map((item, i) => (
                        <InfoRow key={i} label={item.label} value={item.value} />
                      ))}
                    </div>
                  )}

                  {section.type === 'table' && (
                    <div style={{ borderRadius: 6, overflow: 'hidden', marginTop: 8 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                            {section.headers.map((h, i) => (
                              <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              {row.map((cell, j) => (
                                <td key={j} style={{ padding: '8px 12px', color: '#334155' }}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {section.type === 'image' && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 8, padding: '10px 0' }}>
                      <img 
                        src={getBackendURL(section.imageUrl)} 
                        alt={section.title} 
                        style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 6 }} 
                      />
                    </div>
                  )}

                  {section.type === 'split' && (
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: 8 }}>
                      {/* Left Side: Terms */}
                      <div style={{ flex: 1 }}>
                        {(section.leftData || []).map((item, i) => (
                          <div key={i} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
                            <div style={{ width: 60, color: '#0f172a', fontWeight: 600 }}>{item.label}</div>
                            <div style={{ width: 15, color: '#0f172a', textAlign: 'center' }}>:</div>
                            <div style={{ flex: 1, color: '#0f172a', fontWeight: 500, lineHeight: 1.4 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Right Side: Summary Box */}
                      <div style={{ flex: '0 0 280px', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ background: '#0f172a', color: '#ffffff', padding: '8px 14px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {section.rightTitle || 'ORDER SUMMARY'}
                        </div>
                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(section.rightData || []).map((item, i) => (
                            <div key={i} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              fontSize: item.isTotal ? 12 : 11, 
                              borderTop: item.isTotal ? '2px solid #0f172a' : 'none',
                              borderBottom: !item.isTotal && i < (section.rightData.length - 1) ? '1px dashed #e2e8f0' : 'none',
                              paddingTop: item.isTotal ? 10 : 2, 
                              paddingBottom: !item.isTotal ? 6 : 0 
                            }}>
                              <span style={{ color: item.isTotal ? '#0f172a' : '#64748b', fontWeight: item.isTotal ? 800 : 500, textTransform: item.isTotal ? 'uppercase' : 'none' }}>
                                {item.label}
                              </span>
                              <span style={{ fontWeight: item.isTotal ? 900 : 700, color: item.isTotal ? '#4f46e5' : '#0f172a', fontSize: item.isTotal ? 14 : 11 }}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {section.type === 'design_images' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
                      {section.images.map((imgData, i) => (
                        <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, textAlign: 'center', background: '#fafafa', flex: '1 1 200px', maxWidth: '300px' }}>
                          <img 
                            src={getBackendURL(imgData.url)} 
                            alt={imgData.label} 
                            style={{ width: '100%', height: '150px', objectFit: 'contain', borderRadius: 4, cursor: 'pointer' }} 
                            onClick={() => window.open(getBackendURL(imgData.url), '_blank')}
                          />
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', marginTop: 8 }}>{imgData.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Signatures */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '32px 40px 16px 40px', marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, textAlign: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#0f172a', fontWeight: 800, fontSize: 11, marginBottom: 40 }}>
                        <User size={14} /> PREPARED BY
                    </div>
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 12, color: '#0f172a', fontSize: 11, fontWeight: 700 }}>
                      Administrator
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#0f172a', fontWeight: 800, fontSize: 11, marginBottom: 40 }}>
                        <User size={14} /> AUTHORIZED BY
                    </div>
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 12, color: '#0f172a', fontSize: 11, fontWeight: 700 }}>
                      Authorised Signatory
                    </div>
                  </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 2 }}>Dinesh Exports</div>
                  <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@dineshexports.com</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.dineshexports.com</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                  <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default A4DocumentPreview;
