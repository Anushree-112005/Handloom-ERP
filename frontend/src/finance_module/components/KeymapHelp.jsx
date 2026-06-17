import { useEffect, useRef } from 'react';

export default function KeymapHelp({ onClose }) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const previousActive = document.activeElement;
    // focus the close button
    closeBtnRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        // simple focus trap
        const focusable = dialogRef.current.querySelectorAll('button,a,input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previousActive?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div ref={dialogRef} className="card">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts (Tally style)</h2>
          <button ref={closeBtnRef} onClick={onClose} className="text-slate-500 hover:text-slate-800">Close</button>
        </div>
        <div className="form-row">
          <div>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">F2</kbd> Date</p>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">F3</kbd> Change Company</p>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">F4</kbd> Contra Voucher</p>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">F5</kbd> Payment Voucher</p>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">F6</kbd> Receipt Voucher</p>
          </div>
          <div>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">F7</kbd> Journal Voucher</p>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">F8</kbd> Sales Voucher</p>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">F9</kbd> Purchase Voucher</p>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">F10</kbd> Other Masters</p>
            <p><kbd className="bg-slate-100 px-2 py-0.5 rounded mr-2">Alt+G</kbd> Create Group</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">Click function keys listed on the right panel or press keys to open forms quickly. Shortcuts are disabled while typing in inputs.</p>
      </div>
    </div>
  );
}
