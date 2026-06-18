import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, ArrowLeft } from 'lucide-react';

/**
 * FormLayout – modern modal-card form shell for Create / Alter screens.
 * Renders as an overlay modal inside the Layout (not full-screen takeover).
 */
export default function TallyFormLayout({
  title,
  mode = 'create',
  onAccept,
  onQuit,
  isLoading = false,
  accentColor = '#6366f1',
  children,
}) {
  const navigate = useNavigate();
  const handleQuit = () => (onQuit ? onQuit() : navigate(-1));
  const modeLabel = mode === 'create' ? 'Creation' : 'Alteration';

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); handleQuit(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); onAccept?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onAccept]);

  return (
    <div className="w-full space-y-6">
      <div className="card">

        {/* Header */}
        <div className="btn btn-secondary"
          style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: accentColor + '18' }}>
              <Save size={15} style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base leading-tight">
                {title} {modeLabel}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'create' ? 'Fill in the details below' : 'Update the details below'}
              </p>
            </div>
          </div>
          <button onClick={handleQuit}
            className="btn btn-secondary">
            <X size={17} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
          {children}
        </div>

        {/* Footer */}
        <div className="btn btn-secondary">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              <kbd className="card">Ctrl+S</kbd> Save
            </span>
            <span>
              <kbd className="card">Esc</kbd> Cancel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuit}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-all disabled:opacity-60"
              style={{ background: isLoading ? '#94a3b8' : accentColor }}
            >
              {isLoading
                ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><Save size={14} /> {mode === 'create' ? 'Create' : 'Save Changes'}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Labelled field row */
export function FormRow({ label, required, hint, children }) {
  return (
    <div className="btn btn-secondary">
      <label className="col-span-4 text-sm font-semibold text-slate-600 pt-2 leading-tight">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="col-span-8 flex flex-col gap-1">
        {children}
        {hint && <span className="text-[11px] text-slate-400 leading-tight">{hint}</span>}
      </div>
    </div>
  );
}

/** Styled text / number input */
export function FormInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/15 transition-all placeholder:text-slate-300 ${className}`}
    />
  );
}

/** Styled select */
export function FormSelect({ className = '', children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/15 transition-all ${className}`}
    >
      {children}
    </select>
  );
}

/** Section divider */
export function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 pt-4 pb-1 first:pt-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">{title}</span>
      <div className="btn btn-primary" />
    </div>
  );
}
