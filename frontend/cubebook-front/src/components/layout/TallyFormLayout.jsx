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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) handleQuit(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
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
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">Ctrl+S</kbd> Save
            </span>
            <span>
              <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">Esc</kbd> Cancel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuit}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
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
    <div className="grid grid-cols-12 items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
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
      <div className="flex-1 h-px bg-purple-100" />
    </div>
  );
}
