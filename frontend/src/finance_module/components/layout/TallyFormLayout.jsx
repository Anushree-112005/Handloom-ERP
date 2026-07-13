import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, Save } from 'lucide-react';

/**
 * TallyFormLayout – Inline page layout matching standard Accounting modules
 * like GroupCreate.jsx. Used for Stock Groups, Items, Units, Locations, etc.
 */
export default function TallyFormLayout({
  title,
  mode = 'create',
  onAccept,
  onQuit,
  isLoading = false,
  accentColor = 'var(--primary)',
  children,
}) {
  const navigate = useNavigate();
  const handleQuit = () => (onQuit ? onQuit() : navigate(-1));
  
  // Clean titles
  const pageTitle = title.includes('Creation') || title.includes('Alteration') ? title.split(' ')[0] + ' ' + title.split(' ')[1] : title;
  const cardTitle = mode === 'create' ? `New ${pageTitle}` : `Alter ${pageTitle}`;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); handleQuit(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); onAccept?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onAccept]);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      
      {/* Page Header & Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={24} color="var(--primary)" />
            {pageTitle}s
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage {pageTitle.toLowerCase()} classification categories
          </p>
        </div>
        <button 
          className="cb-btn-secondary" 
          onClick={handleQuit}
          type="button"
        >
          <ArrowLeft size={16} /> Back to List
        </button>
      </div>

      {/* Inline Form Card */}
      <div className="cb-card animate-fade" style={{ padding: 0 }}>
        
        {/* Card Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, background: 'rgba(79, 70, 229, 0.1)', borderRadius: 10, color: 'var(--primary)' }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{cardTitle}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                {pageTitle} Details
              </p>
            </div>
          </div>
        </div>

        {/* Card Body (Form) */}
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {children}
          </div>

          {/* Card Footer (Buttons) */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 24 }}>
            <button type="button" className="cb-btn-secondary" onClick={handleQuit}>Cancel</button>
            <button type="button" className="cb-btn-primary" onClick={onAccept} disabled={isLoading}>
              <Save size={16} /> {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 
 * Matches the layout in GroupCreate: label block + input full width
 */
export function FormRow({ label, required, hint, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

/** 
 * Standard cb-input style
 */
export function FormInput({ className = '', style, ...props }) {
  return (
    <input
      {...props}
      style={{ ...style }}
      className={`cb-input ${className}`}
    />
  );
}

/** 
 * Standard cb-input for selects
 */
export function FormSelect({ className = '', style, children, ...props }) {
  return (
    <select
      {...props}
      style={{ ...style }}
      className={`cb-input cursor-pointer ${className}`}
    >
      {children}
    </select>
  );
}

/** 
 * Optional divider for sections
 */
export function SectionHeader({ title }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: 8, marginTop: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{title}</span>
    </div>
  );
}
