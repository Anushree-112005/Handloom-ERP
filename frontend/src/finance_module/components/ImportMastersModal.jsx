import React, { useState } from 'react';

export default function ImportMastersModal({ isOpen, onClose, companyName }) {
  const [showFormats, setShowFormats] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('Excel (Spreadsheet)');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col pointer-events-auto">
      {/* Top Bar for Modal */}
      <div className="absolute top-[42px] left-0 right-0 h-6 bg-[#005e6a] flex items-center justify-between px-2 text-white text-[11px] font-bold shadow-sm">
         <div className="w-1/3 text-left">Import Data</div>
         <div className="w-1/3 text-center">{companyName}</div>
         <div className="w-1/3 text-right">
           <button onClick={onClose} className="hover:text-red-500 font-bold">X</button>
         </div>
      </div>
      
      {/* Modal Content - Absolute positioned */}
      <div className="btn btn-secondary">
        
        {/* Header */}
        <div className="btn btn-secondary">
          Import Masters
        </div>
        
        {/* Form Fields */}
        <div className="px-4 py-4 text-[12px] font-medium text-black">
           <div className="flex mb-1 relative">
             <div className="w-64">File Format</div>
             <div className="w-4">:</div>
             <div className="flex-1">
               <div 
                 className="bg-[#ffecb3] border border-[#c4a045] h-[20px] px-1 cursor-pointer w-[250px]"
                 onClick={() => setShowFormats(!showFormats)}
               >
                 {selectedFormat}
               </div>
               
               {/* Overlay Dropdown */}
               {showFormats && (
                 <div className="absolute top-[20px] left-[272px] bg-[#e8f0fb] border border-[#2860a1] w-[200px] shadow-2xl z-20">
                   <div className="bg-[#2860a1] text-white text-[11px] font-semibold px-2 py-0.5">
                     List of File Formats
                   </div>
                   <div className="bg-white flex flex-col text-[11px] font-medium text-[#102648]">
                     <div 
                       className={`px-2 py-1 cursor-pointer hover:bg-[#ffbc40] ${selectedFormat === 'Excel (Spreadsheet)' ? 'bg-[#ffbc40]' : ''}`}
                       onClick={() => { setSelectedFormat('Excel (Spreadsheet)'); setShowFormats(false); }}
                     >
                       Excel (Spreadsheet)
                     </div>
                     <div 
                       className={`px-2 py-1 cursor-pointer hover:bg-[#ffbc40] ${selectedFormat === 'JSON (Data Exchange)' ? 'bg-[#ffbc40]' : ''}`}
                       onClick={() => { setSelectedFormat('JSON (Data Exchange)'); setShowFormats(false); }}
                     >
                       JSON (Data Exchange)
                     </div>
                     <div 
                       className={`px-2 py-1 cursor-pointer hover:bg-[#ffbc40] ${selectedFormat === 'XML (Data Interchange)' ? 'bg-[#ffbc40]' : ''}`}
                       onClick={() => { setSelectedFormat('XML (Data Interchange)'); setShowFormats(false); }}
                     >
                       XML (Data Interchange)
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </div>
           
           <div className="flex mb-1">
             <div className="w-64">File Path</div>
             <div className="w-4">:</div>
             <div className="flex-1 font-bold">C:\Program Files\TallyPrime</div>
           </div>
           
           <div className="flex mb-1">
             <div className="w-64">File to Import</div>
             <div className="w-4">:</div>
             <div className="flex-1"></div>
           </div>
           
           <div className="flex mb-1">
             <div className="w-64">Backup Company Data before Import</div>
             <div className="w-4">:</div>
             <div className="flex-1 font-bold">Yes</div>
           </div>
           
           <div className="flex mb-1 ml-4">
             <div className="w-60">Backup Data Path</div>
             <div className="w-4">:</div>
             <div className="flex-1 font-bold">TallyDrive</div>
           </div>
           
           <div className="flex mb-1 ml-4">
             <div className="w-60">Set Backup Password</div>
             <div className="w-4">:</div>
             <div className="flex-1 font-bold">No</div>
           </div>
           
        </div>
        
        {/* Placeholder for spacing to match screenshot height */}
        <div className="h-[150px]"></div>
        
      </div>
      
      {/* Right Action Bar overlay */}
      <div className="absolute top-[42px] right-0 bottom-9 w-24 bg-[#e5eef9] border-l border-[#c5d3e6] flex flex-col p-[2px] gap-[1px] z-40">
        <div className="flex-1" />
        <button className="form-control">
          <div className="flex items-center">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold leading-none text-[#3b82f6]">L</span>
              <div className="h-[1px] w-full mt-[1px] bg-[#3b82f6]"></div>
            </div>
            <span className="text-[11px] font-bold text-[#3b82f6]">:</span>
            <span className="text-[11px] ml-0.5 text-gray-700 whitespace-nowrap overflow-hidden">Sample Excel<br/>File</span>
          </div>
        </button>
        <div className="flex-1" />
      </div>

      {/* Bottom Action Bar overlay */}
      <footer className="absolute bottom-0 left-0 right-0 h-9 bg-[#1a3b34] text-white flex items-center px-4 text-[11px] font-medium uppercase z-50 border-t border-[#0d211d]">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
            <span className="text-yellow-400 font-bold">Q</span>: Quit
          </button>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <button onClick={onClose} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-4 py-1 rounded transition-all">
            <span className="text-yellow-400 font-bold">A</span>: Accept
          </button>
        </div>
      </footer>
    </div>
  );
}
