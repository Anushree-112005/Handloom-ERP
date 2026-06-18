import { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { companies } from "../api";
import { Plus, Building2, ChevronRight, Bell, LogOut, Search, Calendar } from "lucide-react";
import ImportMastersModal from "../components/ImportMastersModal";

const INDIAN_STATES = [
  ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"],
  ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"],
  ["23", "Madhya Pradesh"], ["24", "Gujarat"], ["27", "Maharashtra"],
  ["29", "Karnataka"], ["32", "Kerala"], ["33", "Tamil Nadu"], ["36", "Telangana"],
  ["37", "Andhra Pradesh"], ["19", "West Bengal"],
];

const SAVED_VIEWS = [
  { name: "Bills Payable - GST", scope: "Predefined", target: "Bills Payable (All Companies)", path: "/reports" },
  { name: "Bills Payable - GST - Sundry Creditors", scope: "Predefined", target: "Bills Payable (All Companies)", path: "/reports" },
  { name: "Bills Payable - GST - Sundry Debtors", scope: "Predefined", target: "Bills Payable (All Companies)", path: "/reports" },
  { name: "Bills Receivable - GST", scope: "Predefined", target: "Bills Receivable (All Companies)", path: "/reports" },
  { name: "Bills Receivable - GST - Sundry Creditors", scope: "Predefined", target: "Bills Receivable (All Companies)", path: "/reports" },
  { name: "Bills Receivable - GST - Sundry Debtors", scope: "Predefined", target: "Bills Receivable (All Companies)", path: "/reports" },
  { name: "Purchase Dashboard", scope: "Predefined", target: "Dashboard (All Companies)", path: "/dashboard" },
  { name: "Sales Dashboard", scope: "Predefined", target: "Dashboard (All Companies)", path: "/dashboard" },
  { name: "IMS Inward Supplies - Filed Invoices", scope: "Predefined", target: "IMS Inward Supplies (All Companies)", path: "/reports" },
  { name: "Ledger Vouchers - GST Details", scope: "Predefined", target: "Ledger Vouchers (All Companies)", path: "/ledgers" },
  { name: "Outstanding MSME Bills", scope: "Predefined", target: "Bills Payable - Micro & Small (All Companies)", path: "/reports" }
];

const COMMON_REPORTS = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Balance Sheet", path: "/reports" },
  { name: "Profit & Loss A/c", path: "/reports" },
  { name: "Cash/Bank Book", path: "/reports" },
  { name: "Day Book", path: "/day-book" },
  { name: "Ledger Vouchers", path: "/ledgers" },
  { name: "Ledger Vouchers - GST", path: "/ledgers" },
  { name: "Stock Summary", path: "/stock" },
  { name: "Trial Balance", path: "/reports" }
];

const GO_TO_ACTIONS = [
  { name: "Create Voucher", path: "/vouchers" },
  { name: "Create Master", path: "/masters" },
  { name: "Alter Master", path: "/masters/alter" },
  { name: "Expand All", action: "expand" },
  { name: "Show More", action: "show_more" }
];

export default function Gateway() {
  const navigate = useNavigate();
  const { activeCompany, setCompany } = useCompanyStore();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'company' | 'data' | 'exchange' | 'goto' | 'import' | 'export' | 'share' | 'print' | 'help' | 'date_modal' | 'company_modal' | null
  const [activeSubmenu, setActiveSubmenu] = useState(null);   // 'manage' | null
  const [showImportModal, setShowImportModal] = useState(false);
  const [gotoSearch, setGotoSearch] = useState("");
  const [selectedGoToIndex, setSelectedGoToIndex] = useState(0);
  const dropdownRef = useRef(null);
  const gotoInputRef = useRef(null);

  const [currentDateState, setCurrentDateState] = useState("Wednesday, 1-Apr-2026");
  const [dateInputVal, setDateInputVal] = useState("");
  const dateInputRef = useRef(null);

  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompIndex, setSelectedCompIndex] = useState(0);
  const companyInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.isContentEditable) {
        // Except for Go To, Date, or Company modal search/inputs themselves when Escape is pressed
        if ((activeDropdown === 'goto' || activeDropdown === 'date_modal' || activeDropdown === 'company_modal') && e.key === 'Escape') {
          setActiveDropdown(null);
          setActiveSubmenu(null);
        }
        return;
      }

      // Close open dropdowns with Escape
      if (e.key === 'Escape') {
        if (activeDropdown) {
          e.preventDefault();
          setActiveDropdown(null);
          setActiveSubmenu(null);
        }
        return;
      }

      // Direct F1, F2, F3 keys (without Alt)
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveDropdown(prev => prev === 'help' ? null : 'help');
        setActiveSubmenu(null);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveDropdown(prev => prev === 'date_modal' ? null : 'date_modal');
        setActiveSubmenu(null);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveDropdown(prev => prev === 'company_modal' ? null : 'company_modal');
        setActiveSubmenu(null);
      }

      // Alt shortcuts
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'k') {
          e.preventDefault();
          setActiveDropdown(prev => prev === 'company' ? null : 'company');
          setActiveSubmenu(null);
        } else if (key === 'y') {
          e.preventDefault();
          setActiveDropdown(prev => prev === 'data' ? null : 'data');
          setActiveSubmenu(null);
        } else if (key === 'z') {
          e.preventDefault();
          setActiveDropdown(prev => prev === 'exchange' ? null : 'exchange');
          setActiveSubmenu(null);
        } else if (key === 'g') {
          e.preventDefault();
          setActiveDropdown(prev => prev === 'goto' ? null : 'goto');
          setActiveSubmenu(null);
        } else if (key === 'o') {
          e.preventDefault();
          setActiveDropdown(prev => prev === 'import' ? null : 'import');
          setActiveSubmenu(null);
        } else if (key === 'e') {
          e.preventDefault();
          setActiveDropdown(prev => prev === 'export' ? null : 'export');
          setActiveSubmenu(null);
        } else if (key === 'm') {
          e.preventDefault();
          setActiveDropdown(prev => prev === 'share' ? null : 'share');
          setActiveSubmenu(null);
        } else if (key === 'p') {
          e.preventDefault();
          setActiveDropdown(prev => prev === 'print' ? null : 'print');
          setActiveSubmenu(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDropdown]);

  useEffect(() => {
    if (activeDropdown === 'date_modal') {
      setDateInputVal(currentDateState);
      setTimeout(() => {
        dateInputRef.current?.focus();
      }, 50);
    }
  }, [activeDropdown, currentDateState]);

  useEffect(() => {
    if (activeDropdown === 'company_modal') {
      setCompanySearch("");
      setSelectedCompIndex(0);
      setTimeout(() => {
        companyInputRef.current?.focus();
      }, 50);
    }
  }, [activeDropdown]);

  useEffect(() => {
    if (activeDropdown === 'goto') {
      setTimeout(() => {
        gotoInputRef.current?.focus();
      }, 50);
      setSelectedGoToIndex(0);
      setGotoSearch("");
    }
  }, [activeDropdown]);
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    gstin: "",
    pan: "",
    state_code: "27",
    address: "",
    city: "",
    pincode: "",
    phone: "",
    email: "",
    maintain_inventory: false,
    fy_start: new Date(new Date().getFullYear() - (new Date().getMonth() < 4 ? 1 : 0), 3, 1)
      .toISOString().split('T')[0],
  });

  // List companies
  const { data: companyList = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => companies.list(),
  });

  // Create company mutation
  const createMutation = useMutation({
    mutationFn: (data) => companies.create(data),
    onSuccess: (newCompany) => {
      localStorage.setItem("cb_company_id", newCompany.id);
      localStorage.setItem("cb_company_name", newCompany.name);
      setCompany(newCompany);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      navigate("/cubebook/");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createMutation.mutate(formData);
  };

  const storedCompanyId = localStorage.getItem("cb_company_id");

  const { isLoading: storedCompanyLoading } = useQuery({
    queryKey: ["company", storedCompanyId],
    queryFn: () => companies.get(storedCompanyId),
    enabled: !activeCompany && !!storedCompanyId,
    onSuccess: (company) => setCompany(company),
    staleTime: 300000,
  });

  const handleSelectCompany = (company) => {
    localStorage.setItem("cb_company_id", company.id);
    localStorage.setItem("cb_company_name", company.name);
    setCompany(company);
    navigate("/cubebook/");
  };

  if (!activeCompany && storedCompanyId && storedCompanyLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="text-center">
          <div className="btn btn-primary">
            <Building2 size={22} className="text-white" />
          </div>
          <div className="text-slate-700 font-semibold animate-pulse">Loading company...</div>
          <p className="text-slate-400 text-sm mt-1">Please wait while your data is restored.</p>
        </div>
      </div>
    );
  }

  if (!activeCompany && companyList.length === 0) {
    return <Navigate to="/company/create" replace />;
  }

  if (!activeCompany && companyList.length > 0) {
    // Company selection screen — matches app UI format
    const AVATAR_COLORS = [
      'bg-purple-600', 'bg-blue-600', 'bg-teal-600',
      'bg-pink-600', 'bg-amber-600', 'bg-indigo-600',
    ];
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col font-sans">

        {/* Top Bar */}
        <header className="btn btn-secondary">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex gap-1 items-center justify-center">
              <div className="flex flex-col gap-0.5">
                <div className="w-2.5 h-2.5 bg-pink-500 rounded-sm" />
                <div className="btn btn-primary" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="w-2.5 h-2.5 bg-teal-500 rounded-sm" />
                <div className="btn btn-primary" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-none text-sm">CubeBook</h1>
              <p className="text-[10px] text-slate-500">Accounting Software</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary">
              <Bell size={18} />
            </button>
            <div className="btn btn-secondary">
              <div className="btn btn-primary">A</div>
              <div className="hidden sm:block text-sm">
                <p className="font-semibold text-slate-800 leading-tight">Administrator</p>
                <p className="text-xs text-slate-500">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 flex flex-col items-center justify-start py-12 px-4">
          <div className="w-full max-w-3xl">

            {/* Page Title */}
            <div className="card-header">
              <div className="flex items-center gap-4">
                <div className="btn btn-primary">
                  <Building2 size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Select Company</h2>
                  <p className="text-sm text-slate-400">Choose a company to continue or create a new one</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/cubebook/company/create')}
                className="btn btn-primary"
              >
                <Plus size={16} />
                New Company
              </button>
            </div>

            {/* Stats bar */}
            <div className="card">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{companyList.length}</p>
                <p className="text-xs text-slate-400 font-medium">Total Companies</p>
              </div>
              <div className="h-10 w-px bg-slate-100" />
              <p className="text-xs text-slate-500">Click on any company card below to open it</p>
            </div>

            {/* Company Cards */}
            <div className="form-row">
              {companyList.map((company, idx) => (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className="btn btn-secondary"
                >
                  <div className={`w-12 h-12 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm`}>
                    {company.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 group-hover:text-purple-600 transition-colors truncate">{company.name}</h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{company.legal_name || company.name}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                      <Calendar size={11} />
                      <span>FY: {company.current_fy?.label || 'Not set'}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-purple-500 transition-colors shrink-0 mt-1" />
                </button>
              ))}

              {/* New Company Card */}
              <button
                onClick={() => navigate('/cubebook/company/create')}
                className="btn btn-secondary"
              >
                <div className="btn btn-primary">
                  <Plus size={20} />
                </div>
                <span className="font-semibold text-sm">Create New Company</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const companyDisplay = activeCompany;
  const currentDate = currentDateState;
  const currentPeriod = companyDisplay?.current_fy
    ? `${new Date(companyDisplay.current_fy.start_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} to ${new Date(companyDisplay.current_fy.end_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`
    : "1-Apr-2025 to 31-Mar-2026";

  const renderMenuItem = (label, highlightChar, onClick, isActive = false) => {
    const charIndex = label.indexOf(highlightChar);
    if (charIndex === -1) {
      return (
        <button onClick={onClick} className={`w-full text-left px-4 py-0.5 transition-colors ${isActive ? 'bg-[#ffbc40] text-black font-semibold' : 'hover:bg-[#ffbc40] text-black'}`}>
          {label}
        </button>
      );
    }
    
    return (
      <button onClick={onClick} className={`w-full text-left px-4 py-0.5 transition-colors ${isActive ? 'bg-[#ffbc40] text-black font-semibold' : 'hover:bg-[#ffbc40] text-black'}`}>
        {label.substring(0, charIndex)}
        <span className={`font-bold ${isActive ? 'text-black' : 'text-[#1d4ed8]'}`}>{label[charIndex]}</span>
        {label.substring(charIndex + 1)}
      </button>
    );
  };

  const renderDropdownItem = (label, highlightChar, onClick, shortcut = "", disabled = false, hasSubmenu = false) => {
    if (disabled) {
      return (
        <div className="form-control">
          <span>{label}</span>
          {shortcut && <span className="text-[10px] text-slate-400">{shortcut}</span>}
        </div>
      );
    }

    const charIndex = label.indexOf(highlightChar);
    const content = charIndex === -1 ? (
      <span>{label}</span>
    ) : (
      <span>
        {label.substring(0, charIndex)}
        <span className="font-bold text-[#1d4ed8] group-hover:text-black">{label[charIndex]}</span>
        {label.substring(charIndex + 1)}
      </span>
    );

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick();
        }}
        className="form-control"
      >
        {content}
        <div className="flex items-center gap-1">
          {shortcut && <span className="text-[10px] text-slate-500 group-hover:text-black">{shortcut}</span>}
          {hasSubmenu && <span className="text-[10px] text-slate-400 group-hover:text-black">▶</span>}
        </div>
      </button>
    );
  };

  const renderCompanyDropdown = () => {
    return (
      <div className="absolute top-[42px] left-0 w-[240px] bg-[#e2f1fc] border border-[#a2c8e6] shadow-2xl rounded z-50 text-[12px] text-black py-1">
        {renderDropdownItem("Create", "C", () => { navigate('/cubebook/company/create'); setActiveDropdown(null); })}
        {renderDropdownItem("Alter", "A", () => { navigate('/cubebook/company/alter'); setActiveDropdown(null); })}
        {renderDropdownItem("ChanGe", "G", () => { setActiveDropdown(null); }, "F3")}
        {renderDropdownItem("Select", "S", () => { setActiveDropdown(null); }, "Alt+F3")}
        {renderDropdownItem("SHut", "H", () => { setActiveDropdown(null); }, "Ctrl+F3")}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Online Access</div>
        {renderDropdownItem("COnnect", "O", () => { setActiveDropdown(null); })}
        {renderDropdownItem("Disconnect", "D", null, "", true)}
        {renderDropdownItem("Connectivity Status", "V", null, "", true)}
        {renderDropdownItem("ReMote Access", "M", () => { setActiveDropdown(null); })}
        {renderDropdownItem("Browser Access", "B", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Configure</div>
        {renderDropdownItem("Features", "F", () => { navigate('/cubebook/masters/company-features'); setActiveDropdown(null); }, "F11")}
        {renderDropdownItem("SEcurity", "E", () => { setActiveDropdown(null); })}
        {renderDropdownItem("TallyVault", "T", () => { setActiveDropdown(null); })}
        {renderDropdownItem("ONline Access", "N", () => { setActiveDropdown(null); })}
      </div>
    );
  };

  const renderDataDropdown = () => {
    return (
      <div className="absolute top-[42px] left-0 w-[220px] bg-[#e2f1fc] border border-[#a2c8e6] shadow-2xl rounded z-50 text-[12px] text-black py-1">
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Company Data</div>
        {renderDropdownItem("Backup & Restore", "B", () => { setActiveDropdown(null); }, "", false, true)}
        {renderDropdownItem("Split", "S", () => { setActiveDropdown(null); }, "", false, true)}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Troubleshooting</div>
        {renderDropdownItem("RepAir", "A", () => { setActiveDropdown(null); })}
        {renderDropdownItem("Migrate", "M", () => { setActiveDropdown(null); })}
        {renderDropdownItem("All Exceptions", "E", null, "", true)}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Configure</div>
        {renderDropdownItem("Configuration", "C", () => { setActiveDropdown(null); })}
      </div>
    );
  };

  const renderExchangeDropdown = () => {
    return (
      <div className="absolute top-[42px] left-0 w-[220px] bg-[#e2f1fc] border border-[#a2c8e6] shadow-2xl rounded z-50 text-[12px] text-black py-1">
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">GST</div>
        {renderDropdownItem("Send for e-Way Bill", "S", () => { setActiveDropdown(null); })}
        {renderDropdownItem("All GST Options", "G", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Banking</div>
        {renderDropdownItem("Send Payments", "P", null, "", true)}
        {renderDropdownItem("Get BAlance", "A", null, "", true)}
        {renderDropdownItem("All Banking Options", "B", () => { setActiveDropdown(null); }, "", false, true)}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        {renderDropdownItem("Configure", "C", () => { setActiveDropdown(null); })}
      </div>
    );
  };

  const renderImportDropdown = () => {
    return (
      <div className="absolute top-[42px] left-0 w-[220px] bg-[#e2f1fc] border border-[#a2c8e6] shadow-2xl rounded z-50 text-[12px] text-black py-1" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Company Data</div>
        {renderDropdownItem("Masters", "M", () => { setShowImportModal(true); setActiveDropdown(null); })}
        {renderDropdownItem("Transactions", "T", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Exceptions</div>
        {renderDropdownItem("Bank Details", "B", () => { setActiveDropdown(null); })}
        {renderDropdownItem("BanK Statement", "K", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        {renderDropdownItem("GST Returns", "G", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="relative">
          {renderDropdownItem("MAnage", "A", () => { setActiveSubmenu(activeSubmenu === 'manage' ? null : 'manage'); }, "", false, true)}
          {activeSubmenu === 'manage' && (
            <div className="absolute top-0 left-full w-[200px] bg-[#e2f1fc] border border-[#a2c8e6] shadow-2xl rounded py-1 z-[60]">
              <div className="px-3 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Excel</div>
              {renderDropdownItem("Mapping Templates", "M", () => { setActiveDropdown(null); })}
              {renderDropdownItem("Sample Excel File", "S", () => { setActiveDropdown(null); })}
            </div>
          )}
        </div>
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        {renderDropdownItem("CoNfiguration", "N", () => { setActiveDropdown(null); })}
      </div>
    );
  };

  const renderExportDropdown = () => {
    return (
      <div className="absolute top-[42px] left-0 w-[220px] bg-[#e2f1fc] border border-[#a2c8e6] shadow-2xl rounded z-50 text-[12px] text-black py-1">
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Reports</div>
        {renderDropdownItem("CuRrent", "R", () => { setActiveDropdown(null); }, "Ctrl+E")}
        {renderDropdownItem("Others", "O", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        {renderDropdownItem("GST Returns", "G", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Company Data</div>
        {renderDropdownItem("Masters", "M", () => { setActiveDropdown(null); })}
        {renderDropdownItem("Transactions", "T", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        {renderDropdownItem("CoNfiguration", "N", () => { setActiveDropdown(null); })}
      </div>
    );
  };

  const renderShareDropdown = () => {
    return (
      <div className="absolute top-[42px] left-0 w-[220px] bg-[#e2f1fc] border border-[#a2c8e6] shadow-2xl rounded z-50 text-[12px] text-black py-1">
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">E-mail</div>
        {renderDropdownItem("CuRrent", "R", () => { setActiveDropdown(null); }, "Ctrl+M")}
        {renderDropdownItem("Others", "O", () => { setActiveDropdown(null); })}
        {renderDropdownItem("CoNfiguration", "N", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">WhatsApp</div>
        {renderDropdownItem("Current", "C", () => { setActiveDropdown(null); }, "Ctrl+Alt+W")}
        {renderDropdownItem("OThers", "T", () => { setActiveDropdown(null); })}
        {renderDropdownItem("Manage", "M", () => { setActiveDropdown(null); }, "", false, true)}
        {renderDropdownItem("Inbox", "I", () => { setActiveDropdown(null); })}
        {renderDropdownItem("ConFiguration", "F", () => { setActiveDropdown(null); })}
      </div>
    );
  };

  const renderPrintDropdown = () => {
    return (
      <div className="absolute top-[42px] left-0 w-[220px] bg-[#e2f1fc] border border-[#a2c8e6] shadow-2xl rounded z-50 text-[12px] text-black py-1">
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Reports</div>
        {renderDropdownItem("CuRrent", "R", () => { setActiveDropdown(null); }, "Ctrl+P")}
        {renderDropdownItem("Others", "O", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        {renderDropdownItem("CoNfiguration", "N", () => { setActiveDropdown(null); })}
      </div>
    );
  };

  const renderHelpDropdown = () => {
    return (
      <div className="absolute top-[42px] right-0 w-[240px] bg-[#e2f1fc] border border-[#a2c8e6] shadow-2xl rounded z-50 text-[12px] text-black py-1">
        {renderDropdownItem("TallyHelp", "T", () => { setActiveDropdown(null); }, "Ctrl+F1")}
        {renderDropdownItem("What's New", "N", () => { setActiveDropdown(null); })}
        {renderDropdownItem("Upgrade", "U", () => { setActiveDropdown(null); })}
        {renderDropdownItem("TallyShop", "S", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        {renderDropdownItem("TRoubleshooting", "R", () => { setActiveDropdown(null); }, "", false, true)}
        {renderDropdownItem("Settings", "S", () => { setActiveDropdown(null); }, "", false, true)}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        {renderDropdownItem("TDLs & AddOns", "D", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Profile</div>
        {renderDropdownItem("ABout", "B", () => { setActiveDropdown(null); })}
        
        <div className="mx-2 border-t border-[#b6d5ee] my-1" />
        <div className="px-4 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 font-bold">Explore More Products</div>
        {renderDropdownItem("TallyPrime Cloud Access", "T", () => { setActiveDropdown(null); })}
      </div>
    );
  };

  const handleDateSubmit = (e) => {
    e.preventDefault();
    if (dateInputVal.trim()) {
      setCurrentDateState(dateInputVal.trim());
    }
    setActiveDropdown(null);
  };

  const renderDateModal = () => {
    if (activeDropdown !== 'date_modal') return null;

    return (
      <div 
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 font-sans text-black"
        onClick={() => setActiveDropdown(null)}
      >
        <div 
          className="w-[320px] bg-[#edf5fa] border border-[#2860a1] shadow-2xl flex flex-col overflow-hidden rounded"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-[#2860a1] text-white px-4 py-1 text-[13px] font-bold text-center">
            <span>Change Date</span>
          </div>

          {/* Form */}
          <form onSubmit={handleDateSubmit} className="px-6 py-4 flex flex-col gap-2">
            <div className="text-[12px] font-semibold text-slate-700">Current Date:</div>
            <input
              ref={dateInputRef}
              type="text"
              value={dateInputVal}
              onChange={(e) => setDateInputVal(e.target.value)}
              className="form-control"
            />
            <button type="submit" className="hidden" />
          </form>

          {/* Footer Bar */}
          <div className="bg-[#edf5fa] border-t border-[#a2c8e6] px-4 py-1 text-[11px] text-slate-600 flex justify-between items-center">
            <button 
              type="button"
              onClick={() => setActiveDropdown(null)}
              className="hover:text-black font-semibold flex items-center gap-1"
            >
              <span className="font-bold text-[#1d4ed8]">Q</span>: Quit
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredCompanies = companyList.filter(comp =>
    comp.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleCompanyKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedCompIndex(prev => (prev + 1) % filteredCompanies.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedCompIndex(prev => (prev - 1 + filteredCompanies.length) % filteredCompanies.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCompanies[selectedCompIndex]) {
        handleSelectCompany(filteredCompanies[selectedCompIndex]);
        setActiveDropdown(null);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setActiveDropdown(null);
    }
  };

  const renderCompanyModal = () => {
    if (activeDropdown !== 'company_modal') return null;

    return (
      <div 
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 font-sans text-black"
        onClick={() => setActiveDropdown(null)}
      >
        <div 
          className="w-[600px] bg-[#edf5fa] border border-[#2860a1] shadow-2xl flex flex-col overflow-hidden rounded"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-[#2860a1] text-white px-4 py-1 text-[13px] font-bold text-center">
            <span>Change Company</span>
          </div>

          {/* Search Section */}
          <div className="px-6 py-3 flex flex-col gap-1 border-b border-[#a2c8e6]">
            <div className="text-[12px] font-bold text-[#1d2129]">Change Company</div>
            <input
              ref={companyInputRef}
              type="text"
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value);
                setSelectedCompIndex(0);
              }}
              onKeyDown={handleCompanyKeyDown}
              placeholder="Select company..."
              className="form-control"
            />
          </div>

          {/* Main Area */}
          <div className="flex-1 flex min-h-[250px] max-h-[350px]">
            {/* Left Column: Companies List */}
            <div className="w-[70%] border-r border-[#a2c8e6] overflow-y-auto py-2 text-[12px]">
              <div className="px-4 py-1 font-bold text-[#3b82f6] text-[10px] uppercase tracking-wider">List of Companies</div>
              {filteredCompanies.map((comp, idx) => {
                const isSelected = idx === selectedCompIndex;
                const companyCode = 100000 + idx;
                return (
                  <button
                    key={comp.id}
                    onClick={() => { handleSelectCompany(comp); setActiveDropdown(null); }}
                    className={`w-full text-left px-6 py-1.5 flex justify-between items-center ${isSelected ? 'bg-[#ffbc40] text-black font-semibold' : 'hover:bg-[#ffbc40] text-slate-800'}`}
                  >
                    <span>{comp.name}</span>
                    <span className={`text-[10px] italic ${isSelected ? 'text-black' : 'text-slate-500'}`}>({companyCode})</span>
                  </button>
                );
              })}
              {filteredCompanies.length === 0 && (
                <div className="px-6 py-4 text-slate-500 italic">No companies match your search.</div>
              )}
            </div>

            {/* Right Column: Actions */}
            <div className="w-[30%] bg-white/50 overflow-y-auto py-2 text-[12px] flex flex-col">
              <button onClick={() => { navigate('/cubebook/company/create'); setActiveDropdown(null); }} className="form-control">Create Company</button>
              <button onClick={() => { navigate('/cubebook/company/alter'); setActiveDropdown(null); }} className="form-control">Alter Company</button>
              <button onClick={() => { setActiveDropdown(null); }} className="form-control">Select Company</button>
              <button onClick={() => { setActiveDropdown(null); }} className="form-control">Shut Company</button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-[#edf5fa] border-t border-[#a2c8e6] px-4 py-1 text-[11px] text-slate-600 flex justify-between items-center">
            <button 
              onClick={() => setActiveDropdown(null)}
              className="hover:text-black font-semibold flex items-center gap-1"
            >
              <span className="font-bold text-[#1d4ed8]">Q</span>: Quit
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredSavedViews = SAVED_VIEWS.filter(item => 
    item.name.toLowerCase().includes(gotoSearch.toLowerCase())
  );
  
  const filteredCommonReports = COMMON_REPORTS.filter(item => 
    item.name.toLowerCase().includes(gotoSearch.toLowerCase())
  );

  const flatList = [...filteredSavedViews, ...filteredCommonReports];

  const handleGotoKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedGoToIndex(prev => (prev + 1) % flatList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedGoToIndex(prev => (prev - 1 + flatList.length) % flatList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatList[selectedGoToIndex]) {
        navigate(flatList[selectedGoToIndex].path);
        setActiveDropdown(null);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setActiveDropdown(null);
    }
  };

  const renderGoToModal = () => {
    if (activeDropdown !== 'goto') return null;

    return (
      <div 
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 font-sans text-black"
        onClick={() => setActiveDropdown(null)}
      >
        <div 
          className="w-[700px] bg-[#edf5fa] border border-[#2860a1] shadow-2xl flex flex-col overflow-hidden rounded"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-[#2860a1] text-white px-4 py-1 text-[13px] font-bold text-center relative">
            <span>{companyDisplay?.name || "ABC"}</span>
          </div>

          {/* Search Section */}
          <div className="px-6 py-3 flex flex-col gap-1 border-b border-[#a2c8e6]">
            <div className="text-[12px] font-bold text-[#1d2129]">Go To</div>
            <input
              ref={gotoInputRef}
              type="text"
              value={gotoSearch}
              onChange={(e) => {
                setGotoSearch(e.target.value);
                setSelectedGoToIndex(0);
              }}
              onKeyDown={handleGotoKeyDown}
              placeholder="Type to find reports or features..."
              className="form-control"
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex min-h-[300px] max-h-[400px]">
            {/* Left Side: Reports List */}
            <div className="w-[70%] border-r border-[#a2c8e6] overflow-y-auto py-2 text-[12px]">
              <div className="px-4 py-1 font-bold text-[#3b82f6] text-[10px] uppercase tracking-wider">List of Reports</div>
              
              {/* Saved Views */}
              {filteredSavedViews.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-0.5 font-semibold text-slate-500 text-[10px] uppercase">Saved Views</div>
                  {filteredSavedViews.map((item, idx) => {
                    const globalIdx = idx;
                    const isSelected = globalIdx === selectedGoToIndex;
                    return (
                      <button
                        key={item.name}
                        onClick={() => { navigate(item.path); setActiveDropdown(null); }}
                        className={`w-full text-left px-6 py-1 flex justify-between items-center ${isSelected ? 'bg-[#ffbc40] text-black font-semibold' : 'hover:bg-[#ffbc40] text-slate-800'}`}
                      >
                        <span className="truncate">{item.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className={`${isSelected ? 'text-black' : 'text-amber-600'} italic font-medium`}>({item.scope})</span>
                          <span className={`${isSelected ? 'text-black' : 'text-slate-500'} italic truncate max-w-[150px]`}>{item.target}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Common Reports */}
              {filteredCommonReports.length > 0 && (
                <div>
                  <div className="px-4 py-0.5 font-semibold text-slate-500 text-[10px] uppercase">Common Reports</div>
                  {filteredCommonReports.map((item, idx) => {
                    const globalIdx = filteredSavedViews.length + idx;
                    const isSelected = globalIdx === selectedGoToIndex;
                    return (
                      <button
                        key={item.name}
                        onClick={() => { navigate(item.path); setActiveDropdown(null); }}
                        className={`w-full text-left px-6 py-1 flex justify-between items-center ${isSelected ? 'bg-[#ffbc40] text-black font-semibold' : 'hover:bg-[#ffbc40] text-slate-800'}`}
                      >
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {flatList.length === 0 && (
                <div className="px-6 py-4 text-slate-500 italic">No reports match your search.</div>
              )}
            </div>

            {/* Right Side: Actions List */}
            <div className="w-[30%] bg-white/50 overflow-y-auto py-2 text-[12px]">
              {GO_TO_ACTIONS.map(action => (
                <button
                  key={action.name}
                  onClick={() => {
                    if (action.path) {
                      navigate(action.path);
                    }
                    setActiveDropdown(null);
                  }}
                  className="form-control"
                >
                  {action.name}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-[#edf5fa] border-t border-[#a2c8e6] px-4 py-1 text-[11px] text-slate-600 flex justify-between items-center">
            <button 
              onClick={() => setActiveDropdown(null)}
              className="hover:text-black font-semibold flex items-center gap-1"
            >
              <span className="font-bold text-[#1d4ed8]">Q</span>: Quit
            </button>
            {flatList.length > 0 && (
              <span className="text-[10px] font-mono text-slate-500">{flatList.length} reports</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white font-sans text-[#1d2129] select-none overflow-hidden" onClick={() => { setActiveDropdown(null); setActiveSubmenu(null); }}>
      {/* Top Navigation Bar - Dark Green/Cyan */}
      <header className="h-[42px] bg-[#1a3b34] text-white flex items-center border-b border-[#0d211d] z-40" onClick={e => e.stopPropagation()}>

        {/* ── Left: Brand ── */}
        <div className="flex-shrink-0 px-3 flex items-center">
          <span className="italic font-serif text-[17px] font-bold">Cube</span>
          <span className="text-yellow-400 text-[9px] uppercase ml-1 tracking-wider font-bold self-start mt-1">Tally</span>
        </div>

        {/* ── Center: Nav + Search bar ── */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Row 1 – nav items */}
          <nav className="flex items-center text-[11px] font-medium h-[42px]">
            {/* K: Company */}
            <div className="relative h-full flex items-center">
              <button
                className={`px-2 h-full flex items-center whitespace-nowrap ${activeDropdown === 'company' ? 'bg-white text-black font-semibold' : 'hover:bg-[#254f46]'}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'company' ? null : 'company'); setActiveSubmenu(null); }}
              >
                <span className={activeDropdown === 'company' ? 'text-blue-700 font-bold' : 'text-yellow-400 underline font-bold'}>K</span>: Company
              </button>
              {activeDropdown === 'company' && renderCompanyDropdown()}
            </div>

            {/* Y: Data */}
            <div className="relative h-full flex items-center">
              <button
                className={`px-2 h-full flex items-center whitespace-nowrap ${activeDropdown === 'data' ? 'bg-white text-black font-semibold' : 'hover:bg-[#254f46]'}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'data' ? null : 'data'); setActiveSubmenu(null); }}
              >
                <span className={activeDropdown === 'data' ? 'text-blue-700 font-bold' : 'text-yellow-400 underline font-bold'}>Y</span>: Data
              </button>
              {activeDropdown === 'data' && renderDataDropdown()}
            </div>

            {/* Z: Exchange */}
            <div className="relative h-full flex items-center">
              <button
                className={`px-2 h-full flex items-center whitespace-nowrap ${activeDropdown === 'exchange' ? 'bg-white text-black font-semibold' : 'hover:bg-[#254f46]'}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'exchange' ? null : 'exchange'); setActiveSubmenu(null); }}
              >
                <span className={activeDropdown === 'exchange' ? 'text-blue-700 font-bold' : 'text-yellow-400 underline font-bold'}>Z</span>: Exchange
              </button>
              {activeDropdown === 'exchange' && renderExchangeDropdown()}
            </div>

            {/* G: Go To */}
            <div className="relative h-full flex items-center">
              <button
                className={`px-3 mx-1 h-[28px] text-[11px] font-medium flex items-center whitespace-nowrap rounded-sm ${activeDropdown === 'goto' ? 'bg-yellow-400 text-black font-bold' : 'bg-white text-black font-medium'}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'goto' ? null : 'goto'); setActiveSubmenu(null); }}
              >
                <span className="text-blue-700 font-bold">G</span>: Go To
              </button>
            </div>

            {/* O: Import */}
            <div className="relative h-full flex items-center">
              <button
                className={`px-2 h-full flex items-center whitespace-nowrap ${activeDropdown === 'import' ? 'bg-white text-black font-semibold' : 'hover:bg-[#254f46]'}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'import' ? null : 'import'); setActiveSubmenu(null); }}
              >
                <span className={activeDropdown === 'import' ? 'text-blue-700 font-bold' : 'text-yellow-400 underline font-bold'}>O</span>: Import
              </button>
              {activeDropdown === 'import' && renderImportDropdown()}
            </div>

            {/* E: Export */}
            <div className="relative h-full flex items-center">
              <button
                className={`px-2 h-full flex items-center whitespace-nowrap ${activeDropdown === 'export' ? 'bg-white text-black font-semibold' : 'hover:bg-[#254f46]'}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'export' ? null : 'export'); setActiveSubmenu(null); }}
              >
                <span className={activeDropdown === 'export' ? 'text-blue-700 font-bold' : 'text-yellow-400 underline font-bold'}>E</span>: Export
              </button>
              {activeDropdown === 'export' && renderExportDropdown()}
            </div>

            {/* M: Share */}
            <div className="relative h-full flex items-center">
              <button
                className={`px-2 h-full flex items-center whitespace-nowrap ${activeDropdown === 'share' ? 'bg-white text-black font-semibold' : 'hover:bg-[#254f46]'}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'share' ? null : 'share'); setActiveSubmenu(null); }}
              >
                <span className={activeDropdown === 'share' ? 'text-blue-700 font-bold' : 'text-yellow-400 underline font-bold'}>M</span>: Share
              </button>
              {activeDropdown === 'share' && renderShareDropdown()}
            </div>

            {/* P: Print */}
            <div className="relative h-full flex items-center">
              <button
                className={`px-2 h-full flex items-center whitespace-nowrap ${activeDropdown === 'print' ? 'bg-white text-black font-semibold' : 'hover:bg-[#254f46]'}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'print' ? null : 'print'); setActiveSubmenu(null); }}
              >
                <span className={activeDropdown === 'print' ? 'text-blue-700 font-bold' : 'text-yellow-400 underline font-bold'}>P</span>: Print
              </button>
              {activeDropdown === 'print' && renderPrintDropdown()}
            </div>

            {/* Search bar — inline after Print */}
            <div className="mx-3 flex items-center bg-[#0f2e28] border border-white/20 px-2 h-[26px] w-[260px] gap-1.5 flex-shrink-0">
              <svg className="w-3 h-3 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <span className="text-white/40 text-[10px] truncate">Find details entered in masters and transactions. (Alt+F)</span>
            </div>

            {/* F1: Help */}
            <div className="relative h-full flex items-center">
              <button
                className={`px-2 h-full flex items-center whitespace-nowrap ${activeDropdown === 'help' ? 'bg-white text-black font-semibold' : 'hover:bg-[#254f46]'}`}
                onClick={() => { setActiveDropdown(activeDropdown === 'help' ? null : 'help'); setActiveSubmenu(null); }}
              >
                <span className={activeDropdown === 'help' ? 'text-blue-700 font-bold' : 'text-yellow-400 font-bold'}>F1</span>: Help
              </button>
              {activeDropdown === 'help' && renderHelpDropdown()}
            </div>
          </nav>
        </div>

        {/* ── Right: Window controls ── */}
        <div className="flex-shrink-0 flex items-center gap-1 px-2">
          <button className="text-white/50 hover:text-white w-7 h-7 flex items-center justify-center text-[14px]">🔔</button>
          <button className="text-white/50 hover:text-white w-7 h-7 flex items-center justify-center text-[13px]">─</button>
          <button className="text-white/50 hover:text-white w-7 h-7 flex items-center justify-center text-[13px]">□</button>
          <button className="text-white/50 hover:text-red-400 w-7 h-7 flex items-center justify-center text-[13px]">✕</button>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-[#bce6f9] text-[#102648] flex items-center justify-between px-2 py-0.5 text-[11px] font-bold shadow-sm border-b border-[#a0cde0]">
         <div className="w-1/3 text-left">Gateway of Cube Tally</div>
         <div className="w-1/3 text-center"></div>
         <div className="w-1/3 text-right">
           <button className="hover:text-red-500 font-bold text-[14px] leading-none">X</button>
         </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Side */}
        <div className="w-1/2 border-r border-[#a0cde0] bg-white flex flex-col">
          <div className="px-8 py-6">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[11px] tracking-wider text-[#3b82f6]">CURRENT PERIOD</div>
                <div className="mt-1 text-[13px] font-bold text-slate-900">{currentPeriod}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] tracking-wider text-[#3b82f6]">CURRENT DATE</div>
                <div className="mt-1 text-[13px] font-bold text-slate-900">{currentDate}</div>
              </div>
            </div>
          </div>
          <div className="px-8">
            <div className="w-full h-[1px] bg-[#a0cde0]"></div>
          </div>
          <div className="px-8 py-4 flex-1">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[11px] tracking-wider text-[#3b82f6]">NAME OF COMPANY</div>
                <div className="mt-4 text-[14px] font-bold text-slate-900">{companyDisplay?.name}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] tracking-wider text-[#3b82f6]">DATE OF LAST ENTRY</div>
                <div className="mt-4 text-[13px] font-bold text-slate-900">1-Apr-26</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 bg-[#e4eff9] flex justify-end pr-12 py-[4%]">
          {/* Menu Box */}
          <div className="w-[320px] bg-white border border-[#2860a1] shadow-xl flex flex-col self-start h-[80%]">
            <div className="bg-[#2860a1] text-white text-center py-1.5 text-sm font-medium">Gateway of Cube Tally</div>
            
            <div className="flex-1 py-4 text-[13px] overflow-y-auto flex flex-col items-center">
              <div className="w-[200px]">
                {/* Masters */}
                <div className="text-[10px] uppercase text-[#3b82f6] tracking-[0.1em] text-center mb-1 mt-2">Masters</div>
                {renderMenuItem("Create", "C", () => navigate('/cubebook/masters'))}
                {renderMenuItem("Alter", "A", () => navigate('/cubebook/masters/alter'))}
                {renderMenuItem("CHart of Accounts", "H", () => navigate('/cubebook/masters/chart'))}
                
                {/* Transactions */}
                <div className="text-[10px] uppercase text-[#3b82f6] tracking-[0.1em] text-center mb-1 mt-5">Transactions</div>
                {renderMenuItem("Vouchers", "V", () => navigate('/cubebook/vouchers'))}
                {renderMenuItem("Day BooK", "K", () => navigate('/cubebook/day-book'))}
                
                {/* Utilities */}
                <div className="text-[10px] uppercase text-[#3b82f6] tracking-[0.1em] text-center mb-1 mt-5">Utilities</div>
                {renderMenuItem("BaNking", "N", () => navigate('/cubebook/banking'))}
                
                {/* Reports */}
                <div className="text-[10px] uppercase text-[#3b82f6] tracking-[0.1em] text-center mb-1 mt-5">Reports</div>
                {renderMenuItem("Balance Sheet", "B", () => navigate('/cubebook/reports'))}
                {renderMenuItem("Profit & Loss A/c", "P", () => navigate('/cubebook/reports'))}
                {renderMenuItem("Stock Summary", "S", () => navigate('/cubebook/stock'))}
                {renderMenuItem("Ratio Analysis", "R", () => {})}
                
                <div className="mt-5">
                  {renderMenuItem("Display More Reports", "D", () => navigate('/cubebook/gst'))}
                  {renderMenuItem("DashbOard", "O", () => navigate('/cubebook/dashboard'))}
                </div>
                
                <div className="mt-8 mb-4">
                  {renderMenuItem("Quit", "Q", () => {})}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rightmost Shortcuts */}
        <div className="w-24 bg-[#e5eef9] border-l border-[#c5d3e6] flex flex-col p-[2px] gap-[1px]">
          <FunctionKey code="F2" label="Date" active onClick={() => setActiveDropdown(prev => prev === 'date_modal' ? null : 'date_modal')} />
          <FunctionKey code="F3" label="Company" active onClick={() => setActiveDropdown(prev => prev === 'company_modal' ? null : 'company_modal')} />
        </div>
      </div>

      {/* Import Masters Modal */}
      <ImportMastersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        companyName={companyDisplay?.name || "ABC"}
      />
      {renderGoToModal()}
      {renderDateModal()}
      {renderCompanyModal()}
    </div>
  );
}

function FunctionKey({ code, label, active = false, underline = 'none', onClick }) {
  const isGrey = !active && !label;
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left px-1.5 py-1 flex justify-between items-center bg-white ${isGrey ? '' : 'hover:bg-[#d4e1f3] cursor-pointer shadow-sm border border-transparent hover:border-[#a0cde0]'}`}
      disabled={isGrey}
    >
      <div className="flex items-center">
        <div className="flex flex-col items-center">
          <span className={`text-[11px] font-bold leading-none ${isGrey ? 'text-gray-400' : 'text-[#3b82f6]'}`}>{code}</span>
          {underline === 'single' && <div className={`h-[1px] w-full mt-[1px] ${isGrey ? 'bg-gray-400' : 'bg-[#3b82f6]'}`} />}
          {underline === 'double' && (
            <div className="w-full flex flex-col gap-[1px] mt-[1px]">
              <div className={`h-[1px] w-full ${isGrey ? 'bg-gray-400' : 'bg-[#3b82f6]'}`} />
              <div className={`h-[1px] w-full ${isGrey ? 'bg-gray-400' : 'bg-[#3b82f6]'}`} />
            </div>
          )}
        </div>
        {label && <span className={`text-[11px] font-bold ${isGrey ? 'text-gray-400' : 'text-[#3b82f6]'}`}>:</span>}
        <span className={`text-[11px] ml-0.5 ${isGrey ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
      </div>
      <span className={`text-[10px] ${isGrey ? 'text-gray-300' : 'text-[#3b82f6]'}`}>&lt;</span>
    </button>
  );
}
