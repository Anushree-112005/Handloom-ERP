import { useNavigate } from 'react-router-dom';
import useCompanyStore from '../store/companyStore';
import {
  PlusCircle, Layers, Users, Globe, Receipt,
  Package, Grid, Box, Scale, MapPin,
  FileText, FileSpreadsheet, Key, ArrowRight, DollarSign
} from 'lucide-react';

const masterSections = [
  {
    title: 'Accounting Masters',
    color: '#6366f1',
    gradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    icon: Layers,
    items: [
      { label: 'Group', icon: Layers, description: 'Ledger classification groups.', route: '/cubebook/masters/group', color: '#6366f1' },
      { label: 'Party Master', icon: Users, description: 'Manage customers and suppliers.', route: '/party-master', color: '#10b981' },
      { label: 'Ledger', icon: Users, description: 'Account ledger masters.', route: '/cubebook/masters/ledger', color: '#3b82f6' },
      { label: 'Currency', icon: DollarSign, description: 'Multi-currency setup.', route: '/cubebook/masters/currency', color: '#14b8a6' },
      { label: 'Voucher Type', icon: Receipt, description: 'Numbering and prefixes.', route: '/cubebook/masters/voucher-type/create', color: '#f59e0b' },
    ],
  },

  {
    title: 'Statutory Masters',
    color: '#f59e0b',
    gradient: 'linear-gradient(90deg, #f59e0b, #f97316)',
    icon: FileText,
    items: [
      { label: 'GST Registration', icon: FileSpreadsheet, description: 'State-wise registration.', route: '/cubebook/masters/gst-registration', color: '#f59e0b' },
      { label: 'GST Classification', icon: FileText, description: 'Custom HSN/SAC groups.', route: '/cubebook/masters/gst-classification', color: '#ea580c' },
    ],
  },
  {
    title: 'Statutory Details',
    color: '#ef4444',
    gradient: 'linear-gradient(90deg, #ef4444, #ec4899)',
    icon: Key,
    items: [
      { label: 'Company GST', icon: FileText, description: 'Active company GSTIN.', route: '/cubebook/masters/gst-details', color: '#ef4444' },
      { label: 'PAN/CIN', icon: Key, description: 'Corporate identification.', route: '/cubebook/masters/pan-cin-details', color: '#ec4899' },
    ],
  },
];

export default function MasterCreation() {
  const navigate = useNavigate();
  const { activeCompany, clearCompany } = useCompanyStore();

  const handleChangeCompany = () => {
    navigate('/cubebook/company-setup');
  };

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <PlusCircle size={32} style={{ color: 'var(--primary)' }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company to access master creation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <PlusCircle size={24} color="var(--primary)" />
            Master Creation
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Create and manage accounting, inventory, and statutory registers
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12 }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            Active Company: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{activeCompany.name}</span>
          </div>
          <button
            type="button"
            onClick={handleChangeCompany}
            style={{ color: 'var(--primary)', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0 }}
          >
            Change Company
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        {masterSections.map((section) => (
          <div key={section.title} className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ height: 3, width: '100%', background: section.gradient, position: 'absolute', top: 0, left: 0 }}></div>
            
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-secondary)' }}>
              <div style={{ padding: 8, borderRadius: 8, background: `${section.color}15`, color: section.color }}>
                <section.icon size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{section.title}</h2>
            </div>
            
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-secondary)', flex: 1 }}>
              {section.items.map((item) => {
                const isDisabled = item.route === '#';
                return (
                  <button
                    key={item.label}
                    onClick={() => !isDisabled && navigate(item.route)}
                    disabled={isDisabled}
                    style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      transition: 'all 0.2s ease-in-out',
                      background: isDisabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      boxShadow: isDisabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.04)',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.background = 'var(--bg-primary)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = `0 6px 16px ${item.color}15`;
                        e.currentTarget.style.borderColor = item.color;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDisabled) {
                        e.currentTarget.style.background = 'var(--bg-primary)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <item.icon size={20} />
                      </div>
                      {!isDisabled && (
                        <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDisabled ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {item.label}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: 11, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
