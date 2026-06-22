import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Search, Box, CheckSquare, Truck, Wrench, ShoppingCart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { companySettingAPI, partyAPI, salesInvoiceAPI, yarnInwardAPI } from '../services/api';
import defaultLogo from '../assets/logo.svg';

const PAGES = [
  { label: 'Dashboard', path: '/' },
  { label: 'Overview', path: '/overview' },
  { label: 'Party Master', path: '/party-master' },
  { label: 'Buyer Order Form', path: '/buyer-order' },
  { label: 'Design Entry', path: '/design-entry' },
  { label: 'Yarn Purchase Order', path: '/yarn/purchase-order' },
  { label: 'Yarn Inward', path: '/yarn/inward' },
  { label: 'Grey Yarn Delivery', path: '/yarn/grey-delivery' },
  { label: 'Dyed Yarn Received', path: '/dyed-yarn/received' },
  { label: 'Dyed Yarn Delivery', path: '/dyed-yarn/delivery' },
  { label: 'Warping Planning', path: '/ppc/planning/availability' },
  { label: 'Weaving Production', path: '/ppc/execution/shift-entry' },
  { label: 'Fabric Inward', path: '/cloth/inward' },
  { label: 'Cloth Checking', path: '/fabric/transaction/checking?tab=cloth_checking' },
  { label: 'Finished Fabric Stock', path: '/finished-fabric' },
  { label: 'Packing Slip', path: '/packing' },
  { label: 'Gate Inward', path: '/gate/inward' },
  { label: 'Gate Outward', path: '/gate/outward' },
  { label: 'Gate Pass Creation', path: '/gate/pass' },
  { label: 'Gate Reports', path: '/gate/reports' },
  { label: 'Goods Release (GRA)', path: '/goods-release' },
  { label: 'Sales Invoice', path: '/sales-invoice' },
  { label: 'E-Way Bill', path: '/eway-bill' },
  { label: 'Despatch', path: '/despatch' },
  { label: 'Reports Dashboard', path: '/reports-dashboard' },
  { label: 'Log Report', path: '/log-report' },
  { label: 'Finance Dashboard', path: '/cubebook/dashboard' },
  { label: 'Finance Masters Create', path: '/cubebook/masters' },
  { label: 'Finance Masters Alter', path: '/cubebook/masters/alter' },
  { label: 'Chart of Accounts', path: '/cubebook/masters/chart' },
  { label: 'Vouchers', path: '/cubebook/vouchers' },
  { label: 'Day Book', path: '/cubebook/day-book' },
  { label: 'Trial Balance', path: '/cubebook/reports/trial-balance' },
  { label: 'Profit & Loss', path: '/cubebook/reports/profit-loss' },
  { label: 'Balance Sheet', path: '/cubebook/reports/balance-sheet' },
  { label: 'Ledger Report', path: '/cubebook/reports/ledger' },
  { label: 'Bank Book', path: '/cubebook/reports/bank-book' },
  { label: 'Outstanding Report', path: '/cubebook/reports/outstanding' },
  { label: 'Sales Register', path: '/cubebook/reports/sales-register' },
  { label: 'Ratio Analysis', path: '/cubebook/reports/ratio-analysis' },
  { label: 'HR Dashboard', path: '/hr' },
  { label: 'Vehicle Management Dashboard', path: '/fleet/dashboard' },
  { label: 'Stores & Consumables Dashboard', path: '/stores-consumables/dashboard' },
  { label: 'Company Settings', path: '/company-settings' },
  { label: 'User Management', path: '/user-management' },
  { label: 'About', path: '/about' }
];

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [companyProfile, setCompanyProfile] = useState({
    company_name: 'DINESH EXPORTS',
    description: 'THE HOUSE OF FABRICS',
    logo: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchData, setSearchData] = useState({ parties: [], invoices: [], inwards: [] });
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Low Yarn Stock Alert',
      message: 'Yarn stock count for 40s Comb Cotton is below the reorder level (120 bags remaining).',
      time: '5 mins ago',
      unread: true,
      category: 'stock',
      link: '/stores-consumables/report-reorder'
    },
    {
      id: 2,
      title: 'Pending PR Approval',
      message: 'Purchase Requisition PR-00004 requires your approval.',
      time: '20 mins ago',
      unread: true,
      category: 'approval',
      link: '/stores-consumables/requisition'
    },
    {
      id: 3,
      title: 'Vehicle Waiting at Gate',
      message: 'Incoming yarn delivery vehicle TN-39-AX-4592 is waiting at Gate 1.',
      time: '1 hour ago',
      unread: true,
      category: 'gate',
      link: '/gate/inward'
    },
    {
      id: 4,
      title: 'Loom Maintenance Overdue',
      message: 'Loom #12 scheduled maintenance is overdue by 2 days.',
      time: '3 hours ago',
      unread: true,
      category: 'maintenance',
      link: '/ppc/problem/breakdown-entry'
    },
    {
      id: 5,
      title: 'New Sales Order Created',
      message: 'Vardhman Yarns placed a new order SO-00089.',
      time: '1 day ago',
      unread: true,
      category: 'sales',
      link: '/buyer-order'
    }
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const response = await companySettingAPI.get();
        if (response.data) {
          setCompanyProfile({
            company_name: response.data.company_name || 'DINESH EXPORTS',
            description: response.data.description || 'THE HOUSE OF FABRICS',
            logo: response.data.logo || ''
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCompany();

    // Fetch search database records once on mount
    const fetchSearchData = async () => {
      try {
        const [partiesRes, invoicesRes, inwardsRes] = await Promise.all([
          partyAPI.list().catch(() => ({ data: [] })),
          salesInvoiceAPI.list().catch(() => ({ data: [] })),
          yarnInwardAPI.list().catch(() => ({ data: [] }))
        ]);
        setSearchData({
          parties: partiesRes.data || [],
          invoices: invoicesRes.data || [],
          inwards: inwardsRes.data || []
        });
      } catch (err) {
        console.error("Failed to load search data:", err);
      }
    };
    fetchSearchData();

    window.addEventListener('company-settings-updated', loadCompany);
    return () => {
      window.removeEventListener('company-settings-updated', loadCompany);
    };
  }, []);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const getNotificationIcon = (category) => {
    switch (category) {
      case 'stock': return <Box size={16} style={{ color: '#e11d48' }} />;
      case 'approval': return <CheckSquare size={16} style={{ color: '#0ea5e9' }} />;
      case 'gate': return <Truck size={16} style={{ color: '#f59e0b' }} />;
      case 'maintenance': return <Wrench size={16} style={{ color: '#ef4444' }} />;
      case 'sales': return <ShoppingCart size={16} style={{ color: '#10b981' }} />;
      default: return <Bell size={16} style={{ color: '#64748b' }} />;
    }
  };

  // Local matching logic
  const filteredPages = searchQuery.trim().length >= 2 ? PAGES.filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) : [];

  const filteredParties = searchQuery.trim().length >= 2 ? searchData.parties.filter(p => 
    (p.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.gst_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) : [];

  const filteredInvoices = searchQuery.trim().length >= 2 ? searchData.invoices.filter(i => 
    (i.invoice_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.party_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) : [];

  const filteredInwards = searchQuery.trim().length >= 2 ? searchData.inwards.filter(iw => 
    (iw.ref_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (iw.received_from || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) : [];

  const showTotalResults = filteredPages.length + filteredParties.length + filteredInvoices.length + filteredInwards.length > 0;
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="header" id="main-header">
      <style>{`
        .search-item:hover {
          background-color: #f8fafc !important;
          color: #0f172a !important;
        }
        .notification-item:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>
      <div style={{ flex: '0 0 260px', overflow: 'hidden', marginRight: '16px' }}>
        <h2 className="header-title" style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '15px' }}>
          <marquee behavior="scroll" direction="left" scrollamount="6">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', verticalAlign: 'middle' }}>
              <img src={companyProfile.logo || defaultLogo} alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontWeight: 600 }}>{companyProfile.company_name} - {companyProfile.description}</span>
            </div>
          </marquee>
        </h2>
      </div>

      {/* Central Global Search Bar */}
      <div style={{ flex: 1, position: 'relative', maxWidth: '380px', margin: '0 16px' }}>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search pages, parties, invoices..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            style={{
              width: '100%',
              padding: '8px 16px 8px 36px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
          />
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && showTotalResults && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '350px',
            overflowY: 'auto',
            marginTop: '6px',
            border: '1px solid #e2e8f0',
            textAlign: 'left'
          }}>
            {/* Pages Category */}
            {filteredPages.length > 0 && (
              <div>
                <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>Pages</div>
                {filteredPages.map(p => (
                  <div 
                    key={p.path} 
                    onMouseDown={() => {
                      setSearchQuery(p.label);
                      navigate(p.path);
                    }} 
                    style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}
                    className="search-item"
                  >
                    <span>{p.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Parties Category */}
            {filteredParties.length > 0 && (
              <div>
                <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>Parties</div>
                {filteredParties.map(p => (
                  <div 
                    key={p.id || p.company_name} 
                    onMouseDown={() => {
                      setSearchQuery(p.company_name);
                      setSelectedRecord({
                        type: 'Party',
                        details: {
                          name: p.company_name,
                          type: p.party_type,
                          gstin: p.gst_no,
                          pan: p.pan_no,
                          address: p.address,
                          city: p.city,
                          state: p.state,
                          phone: p.phone,
                          email: p.email
                        }
                      });
                    }} 
                    style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}
                    className="search-item"
                  >
                    <span>{p.company_name} ({p.party_type})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Invoices Category */}
            {filteredInvoices.length > 0 && (
              <div>
                <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>Sales Invoices</div>
                {filteredInvoices.map(i => (
                  <div 
                    key={i.id || i.invoice_no} 
                    onMouseDown={() => {
                      setSearchQuery(i.invoice_no);
                      setSelectedRecord({
                        type: 'Sales Invoice',
                        details: {
                          invoice_no: i.invoice_no,
                          date: i.invoice_date,
                          party: i.party_name,
                          gross_amount: i.gross_amount,
                          cgst: i.cgst,
                          sgst: i.sgst,
                          igst: i.igst,
                          net_amount: i.net_amount,
                          vehicle_no: i.vehicle_no
                        }
                      });
                    }} 
                    style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}
                    className="search-item"
                  >
                    <span>{i.invoice_no} - {i.party_name} (₹{parseFloat(i.net_amount).toLocaleString()})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Inwards Category */}
            {filteredInwards.length > 0 && (
              <div>
                <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>Yarn Inwards</div>
                {filteredInwards.map(iw => (
                  <div 
                    key={iw.id || iw.ref_no} 
                    onMouseDown={() => {
                      setSearchQuery(iw.ref_no);
                      setSelectedRecord({
                        type: 'Yarn Inward',
                        details: {
                          reference_no: iw.ref_no,
                          inward_date: iw.inward_date,
                          received_from: iw.received_from,
                          gross_amount: iw.gross_amount,
                          net_amount: iw.net_amount,
                          vehicle_no: iw.veh_no,
                          remarks: iw.remarks
                        }
                      });
                    }} 
                    style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}
                    className="search-item"
                  >
                    <span>{iw.ref_no} - {iw.received_from} (₹{parseFloat(iw.net_amount).toLocaleString()})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Dynamic Notification Dropdown */}
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            style={{ padding: '8px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px #ffffff'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              width: '320px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              marginTop: '8px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8fafc'
              }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0ea5e9',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        handleMarkAsRead(n.id);
                        setIsNotificationsOpen(false);
                        if (n.link) navigate(n.link);
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        transition: 'background-color 0.2s',
                        backgroundColor: n.unread ? '#f0f9ff' : '#ffffff'
                      }}
                      className="notification-item"
                    >
                      <div style={{
                        marginTop: '2px',
                        padding: '6px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getNotificationIcon(n.category)}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: n.unread ? 600 : 500, color: '#1e293b' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                          {n.time}
                        </div>
                      </div>
                      {n.unread && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#3b82f6',
                          borderRadius: '50%',
                          marginTop: '6px',
                          flexShrink: 0
                        }} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-user">
          <div className="avatar">{(user.user_name || 'A')[0]}</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{user.user_name || 'Admin'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.user_type || 'Admin'}</div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '8px' }} title="Logout">
          <LogOut size={18} />
        </button>
      </div>

      {/* Details Display Modal Popup */}
      {selectedRecord && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              width: '500px',
              maxWidth: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              textAlign: 'left'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{selectedRecord.type} Details</h3>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                  lineHeight: '1'
                }}
              >
                &times;
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(selectedRecord.details).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', borderBottom: '1px solid #f8fafc', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: 600, width: '150px', textTransform: 'capitalize', color: '#475569', fontSize: '13px' }}>
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span style={{ color: '#0f172a', fontSize: '13px' }}>
                    {val === null || val === undefined ? '—' : String(val)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedRecord(null)}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
