import React from 'react';

export default function BankLedgerModal({ 
  isOpen, 
  onClose, 
  companyName, 
  modalType = 'ledger' 
}) {
  if (!isOpen) return null;

  let topBarTitle = 'Select Bank';
  let headerText = 'Name of Bank';
  let listTitle = 'List of Banks';
  let showColumns = false;
  let hasAllItems = true;
  let listItems = ['SBI Account'];

  switch (modalType) {
    case 'ledger':
      headerText = 'Name of Bank Ledger';
      listTitle = 'List of Bank Ledgers';
      showColumns = true;
      break;
    case 'bank':
      headerText = 'Name of Bank';
      listTitle = 'List of Banks';
      break;
    case 'all-ledgers':
      topBarTitle = 'Select Item';
      headerText = 'Name of Ledger';
      listTitle = 'List of Ledgers';
      listItems = ['Capital', 'Customer A', 'Purchase', 'Rent', 'Sales', 'Supplier A'];
      break;
    case 'bank-only':
      headerText = 'Name of Bank';
      listTitle = 'List of Banks';
      hasAllItems = false;
      break;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col pointer-events-auto">
      {/* Top Bar for Modal - covers the Gateway blue bar */}
      <div className="absolute top-[40px] left-0 right-0 h-6 bg-[#005e6a] flex items-center justify-between px-2 text-white text-[11px] font-bold shadow-sm">
         <div className="w-1/3 text-left">{topBarTitle}</div>
         <div className="w-1/3 text-center">{companyName}</div>
         <div className="w-1/3 text-right">
           <button onClick={onClose} className="hover:text-red-500 font-bold">X</button>
         </div>
      </div>
      
      {/* Modal Content - Absolute positioned */}
      <div className="absolute top-[64px] left-1/2 -translate-x-1/2 flex flex-col items-center">
        
        {/* Floating Input area */}
        <div className="bg-white shadow-md flex flex-col w-[200px] relative z-10">
           <div className="text-center text-[12px] font-bold py-1 bg-white">{headerText}</div>
           <div className="p-1 pb-2 bg-white flex justify-center">
             <div className="bg-[#ffecb3] border border-[#c4a045] w-[180px] h-[22px] flex items-center px-1 shadow-inner">
               {hasAllItems ? (
                 <>
                   <span className="text-[10px] mr-1">♦</span> <span className="text-[12px] font-bold">All Items</span>
                 </>
               ) : (
                 <span className="w-[1px] h-[14px] bg-black ml-1 animate-pulse"></span>
               )}
             </div>
           </div>
        </div>
        
        {/* List Box */}
        <div className="bg-[#e8f0fb] border border-[#2860a1] w-[400px] h-[350px] shadow-2xl flex flex-col mt-[-1px]">
           <div className="bg-[#2860a1] text-white text-[12px] font-semibold px-2 py-0.5 flex justify-between">
             <span>{listTitle}</span>
           </div>
           
           {showColumns && (
             <div className="bg-[#e8f0fb] text-[#102648] text-[11px] px-2 py-1 flex justify-between border-b border-white/50">
               <span>Ledger Name</span>
               <span>Account No.</span>
             </div>
           )}
           
           <div className="text-right px-2 py-1 text-[11px] text-[#102648] cursor-pointer hover:bg-white/50 transition-colors">
             Create
           </div>
           
           <div className="flex-1 bg-white flex flex-col overflow-y-auto text-[12px] font-medium text-[#102648]">
             {hasAllItems && (
               <div className="bg-[#ffbc40] flex items-center px-2 py-0.5 cursor-pointer">
                 <span className="text-[10px] mr-1">♦</span> All Items
               </div>
             )}
             
             {listItems.map((item, idx) => (
               <div key={idx} className={`px-2 py-0.5 cursor-pointer transition-colors ${!hasAllItems && idx === 0 ? 'bg-[#ffbc40]' : 'hover:bg-[#ffbc40]'}`}>
                 {item}
               </div>
             ))}
           </div>
        </div>
      </div>
      
      {/* Bottom Action Bar overlay */}
      <footer className="absolute bottom-0 left-0 right-0 h-9 bg-[#1a3b34] text-white flex items-center px-4 text-[11px] font-medium uppercase z-50">
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
