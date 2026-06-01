import { useEffect, useState } from 'react';
import { Building2, Mail, Phone, MapPin, Upload, Save, CheckCircle, AlertCircle, Trash2, FileText } from 'lucide-react';
import { companySettingAPI } from '../../services/api';

export default function CompanySetting() {
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    logo: '',
    address: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    try {
      const response = await companySettingAPI.get();
      if (response.data) {
        setFormData({
          company_name: response.data.company_name || '',
          description: response.data.description || '',
          logo: response.data.logo || '',
          address: response.data.address || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
        });
      }
    } catch (err) {
      console.error('Error fetching company settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logo: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = async () => {
    const updatedForm = { ...formData, logo: '' };
    setFormData(updatedForm);

    setSaving(true);
    setStatusMessage(null);

    try {
      const response = await companySettingAPI.save(updatedForm);
      if (response.data) {
        setStatusMessage({ type: 'success', text: 'Logo deleted successfully!' });
        window.dispatchEvent(new Event('company-settings-updated'));
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error saving company settings:', err);
      setStatusMessage({ type: 'error', text: 'Failed to delete logo.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.company_name.trim()) {
      setStatusMessage({ type: 'error', text: 'Company Name is required!' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const response = await companySettingAPI.save(formData);
      if (response.data) {
        setStatusMessage({ type: 'success', text: 'Company settings saved successfully!' });
        window.dispatchEvent(new Event('company-settings-updated'));
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error saving company settings:', err);
      setStatusMessage({ type: 'error', text: 'Failed to save company settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>Loading Settings...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Company</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage your organization profile, logo, and core ERP contact details.</p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            fontWeight: 600,
            background: statusMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: statusMessage.type === 'success' ? '#10b981' : '#ef4444',
            border: `1px solid ${statusMessage.type === 'success' ? '#10b981' : '#ef4444'}30`,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28, alignItems: 'start' }}>
        {/* Form Panel */}
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>Organization Details</h3>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Company Name *</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  name="company_name"
                  className="form-control"
                  style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                  placeholder="Enter official company name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Company Subtitle / Description</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  name="description"
                  className="form-control"
                  style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                  placeholder="e.g. THE HOUSE OF FABRICS"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                    placeholder="e.g. contact@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Company Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: 12, top: '14px', color: 'var(--text-muted)' }} />
                <textarea
                  name="address"
                  className="form-control"
                  style={{ paddingLeft: 38, width: '100%', margin: 0, minHeight: 80, resize: 'vertical' }}
                  placeholder="Enter full physical address details"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>Company Logo</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {formData.logo && (
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img src={formData.logo} alt="Current Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1.5px dashed var(--primary)',
                    background: 'rgba(59,130,246,0.05)',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                >
                  <Upload size={16} />
                  <span>Choose Logo File</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>

                {formData.logo && (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: '1px solid #ef4444',
                      background: 'rgba(239,68,68,0.05)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                  >
                    <Trash2 size={16} />
                    <span>Delete Logo</span>
                  </button>
                )}

                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Formats: PNG, JPG (Max 2MB). Ideal for invoices/reports.</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px' }}
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Panel */}
        <div
          className="card"
          style={{
            padding: '30px 24px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: 'white',
            borderRadius: 16,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minHeight: 350,
            justifyContent: 'space-between',
            position: 'sticky',
            top: 24
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7, fontWeight: 700 }}>ERP Profile Preview</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: 20, fontWeight: 800 }}>{formData.company_name || 'Your Company Name'}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: 11, opacity: 0.8, fontWeight: 500 }}>{formData.description || 'THE HOUSE OF FABRICS'}</p>
              </div>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.25)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {formData.logo ? (
                  <img src={formData.logo} alt="Company Logo" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                ) : (
                  <Building2 size={26} style={{ color: 'var(--primary)' }} />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <MapPin size={16} style={{ marginTop: 2, flexShrink: 0, opacity: 0.8 }} />
                <span style={{ opacity: 0.9, lineHeight: 1.4 }}>{formData.address || 'Company official physical address will display here...'}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Mail size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span style={{ opacity: 0.9 }}>{formData.email || 'contact@yourdomain.com'}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Phone size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span style={{ opacity: 0.9 }}>{formData.phone || '+91 00000 00000'}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, opacity: 0.7 }}>
            <span>DINESH EXPORTS ERP Platform</span>
            <span>Profile Status: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
