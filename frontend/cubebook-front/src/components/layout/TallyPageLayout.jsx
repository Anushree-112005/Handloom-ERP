import React from 'react';
import { useNavigate } from 'react-router-dom';
import useCompanyStore from '../../store/companyStore';
import RightShortcuts from '../RightShortcuts';

export default function TallyPageLayout({ 
  title, 
  subtitle, 
  onClose,
  bottomShortcuts = [], 
  children,
  footerLeftText = ""
}) {
  const navigate = useNavigate();
  const { activeCompany } = useCompanyStore();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1); // fallback
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col font-sans text-[#1d2129] select-none overflow-hidden bg-white z-[60]">
      {/* Top Navigation Bar */}
      <header className="h-10 bg-[#1a3b34] text-white flex items-center px-4 justify-between border-b border-[#0d211d] shrink-0">
        <div className="flex items-center gap-6">
          <div className="font-bold text-sm tracking-tight text-white/90">CubeBook Prime</div>
          <nav className="flex items-center gap-4 text-[11px] font-medium">
            <button className="hover:bg-[#254f46] px-2 py-1"><span className="text-yellow-400">K</span>: Company</button>
            <button className="hover:bg-[#254f46] px-2 py-1"><span className="text-yellow-400">Y</span>: Data</button>
            <button className="hover:bg-[#254f46] px-2 py-1"><span className="text-yellow-400">Z</span>: Exchange</button>
            <button className="bg-[#2860a1] px-3 py-1 rounded-sm"><span className="text-yellow-400">G</span>: Go To</button>
            <button className="hover:bg-[#254f46] px-2 py-1"><span className="text-yellow-400">O</span>: Import</button>
            <button className="hover:bg-[#254f46] px-2 py-1"><span className="text-yellow-400">E</span>: Export</button>
            <button className="hover:bg-[#254f46] px-2 py-1"><span className="text-yellow-400">M</span>: Share</button>
            <button className="hover:bg-[#254f46] px-2 py-1"><span className="text-yellow-400">P</span>: Print</button>
            <button className="hover:bg-[#254f46] px-2 py-1"><span className="text-yellow-400">F1</span>: Help</button>
          </nav>
        </div>
      </header>
      
      {/* Page Header */}
      <div className="bg-[#005e6a] text-white flex items-center justify-between px-2 py-[2px] text-[12px] font-bold shadow-sm shrink-0">
         <div className="w-1/3 text-left">{title}</div>
         <div className="w-1/3 text-center">{activeCompany?.name || 'ABC'}</div>
         <div className="w-1/3 text-right">
           <button onClick={handleClose} className="hover:text-red-400 font-bold px-2 py-0.5" title="Close (Esc)">X</button>
         </div>
      </div>

      {/* Main Area: Content + Right Sidebar */}
      <div className="flex-1 flex min-h-0">
        
        {/* Left Side: Content Wrapper */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative border-r border-[#c8dff8]">
          
          {/* Subheader if provided */}
          {subtitle && (
            <div className="bg-[#e4eff8] border-b border-[#c8dff8] px-4 py-1.5 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-[14px] text-slate-900">{subtitle}</h2>
              <div className="text-[12px] font-bold text-slate-900">
                For 1-Apr-26
              </div>
            </div>
          )}

          {/* Actual Content */}
          <div className="flex-1 overflow-auto outline-none bg-white relative" tabIndex={0}>
            {children}
          </div>

          {/* Status Bar */}
          {footerLeftText && (
             <div className="h-6 bg-[#e4eff8] border-t border-[#c8dff8] flex items-center px-2 text-[11px] font-bold shrink-0">
                {footerLeftText}
             </div>
          )}

          {/* Bottom Action Bar */}
          <footer className="h-8 bg-[#e4eff8] border-t border-[#c8dff8] flex items-center px-2 text-[11px] font-medium shrink-0">
            <div className="flex items-center gap-6 w-full">
              {bottomShortcuts.map((sc, idx) => (
                <button 
                  key={idx} 
                  onClick={sc.onClick} 
                  className="flex items-center gap-1 hover:bg-[#c8dff8] px-1 py-0.5 transition-colors border border-transparent hover:border-[#a0c4e8]"
                >
                  <span className="text-[#1d4ed8] font-bold">{sc.key}</span><span className="text-slate-600">:</span> <span className="text-slate-800">{sc.label}</span>
                </button>
              ))}
            </div>
          </footer>
        </div>

        {/* Right Shortcuts */}
        <RightShortcuts />
      </div>
    </div>
  );
}
