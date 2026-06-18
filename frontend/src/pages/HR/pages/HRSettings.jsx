import React, { useState } from 'react';
import { Settings, Save, Building2, Calendar, Clock, DollarSign, Shield, Bell, Users, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';

export default function HRSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General
    companyName: 'SF Technologies Pvt Ltd',
    companyCode: 'SFTECH',
    fiscalYearStart: '04',
    weekStart: 'Monday',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    
    // Leave
    leaveYearStart: '01',
    carryForward: true,
    maxCarryForward: 10,
    autoApprove: false,
    leaveTypes: ['Casual', 'Sick', 'Earned', 'Maternity', 'Paternity'],
    
    // Attendance
    halfDayHours: 4,
    fullDayHours: 8,
    allowRemote: true,
    geoFencing: false,
    
    // Payroll
    payrollCycle: 'Monthly',
    payDate: 1,
    pfEnabled: true,
    pfRate: 12,
    esiEnabled: true,
    esiThreshold: 21000,
    tdsEnabled: true,
    
    // Notifications
    emailNotifications: true,
    leaveReminders: true,
    birthdayAlerts: true,
    payslipNotify: true,
    approvalReminders: true,
    
    // Security
    passwordExpiry: 90,
    mfaEnabled: false,
    sessionTimeout: 30,
    ipRestriction: false
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    // Save settings
    setHasChanges(false);
    alert('Settings saved successfully!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'leave', label: 'Leave Policy', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const Toggle = ({ checked, onChange }) => (
    <div
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-indigo-600' : 'bg-slate-300'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Company Information</h3>
        <div className="form-row">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => updateSetting('companyName', e.target.value)}
              className="form-control"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Company Code</label>
            <input
              type="text"
              value={settings.companyCode}
              onChange={(e) => updateSetting('companyCode', e.target.value)}
              className="form-control"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Regional Settings</h3>
        <div className="form-row">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Fiscal Year Start</label>
            <select
              value={settings.fiscalYearStart}
              onChange={(e) => updateSetting('fiscalYearStart', e.target.value)}
              className="form-control"
            >
              <option value="01">January</option>
              <option value="04">April</option>
              <option value="07">July</option>
              <option value="10">October</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Week Starts On</label>
            <select
              value={settings.weekStart}
              onChange={(e) => updateSetting('weekStart', e.target.value)}
              className="form-control"
            >
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
              className="form-control"
            >
              <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">EST (America/New_York)</option>
              <option value="Europe/London">GMT (Europe/London)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => updateSetting('dateFormat', e.target.value)}
              className="form-control"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
              className="form-control"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLeaveSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Leave Year Configuration</h3>
        <div className="form-row">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Leave Year Starts</label>
            <select
              value={settings.leaveYearStart}
              onChange={(e) => updateSetting('leaveYearStart', e.target.value)}
              className="form-control"
            >
              <option value="01">January</option>
              <option value="04">April</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Max Carry Forward Days</label>
            <input
              type="number"
              value={settings.maxCarryForward}
              onChange={(e) => updateSetting('maxCarryForward', parseInt(e.target.value))}
              className="form-control"
              disabled={!settings.carryForward}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Leave Policies</h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-800">Allow Carry Forward</p>
            <p className="text-sm text-slate-500">Enable unused leave carry forward to next year</p>
          </div>
          <Toggle checked={settings.carryForward} onChange={(v) => updateSetting('carryForward', v)} />
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-800">Auto-approve Short Leaves</p>
            <p className="text-sm text-slate-500">Automatically approve leaves under 2 days</p>
          </div>
          <Toggle checked={settings.autoApprove} onChange={(v) => updateSetting('autoApprove', v)} />
        </div>
      </div>
    </div>
  );

  const renderAttendanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Timing Configuration</h3>
        <div className="form-row">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Half Day Hours</label>
            <input
              type="number"
              value={settings.halfDayHours}
              onChange={(e) => updateSetting('halfDayHours', parseInt(e.target.value))}
              className="form-control"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Full Day Hours</label>
            <input
              type="number"
              value={settings.fullDayHours}
              onChange={(e) => updateSetting('fullDayHours', parseInt(e.target.value))}
              className="form-control"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Remote Work</h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-800">Allow Remote Check-in</p>
            <p className="text-sm text-slate-500">Enable employees to mark attendance remotely</p>
          </div>
          <Toggle checked={settings.allowRemote} onChange={(v) => updateSetting('allowRemote', v)} />
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-800">Geo-fencing</p>
            <p className="text-sm text-slate-500">Restrict check-in to office location</p>
          </div>
          <Toggle checked={settings.geoFencing} onChange={(v) => updateSetting('geoFencing', v)} />
        </div>
      </div>
    </div>
  );

  const renderPayrollSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Payroll Cycle</h3>
        <div className="form-row">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Pay Cycle</label>
            <select
              value={settings.payrollCycle}
              onChange={(e) => updateSetting('payrollCycle', e.target.value)}
              className="form-control"
            >
              <option value="Monthly">Monthly</option>
              <option value="Bi-weekly">Bi-weekly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Pay Date (Day of Month)</label>
            <input
              type="number"
              min="1"
              max="28"
              value={settings.payDate}
              onChange={(e) => updateSetting('payDate', parseInt(e.target.value))}
              className="form-control"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Statutory Deductions</h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-800">Provident Fund (PF)</p>
            <p className="text-sm text-slate-500">Employee contribution: {settings.pfRate}%</p>
          </div>
          <Toggle checked={settings.pfEnabled} onChange={(v) => updateSetting('pfEnabled', v)} />
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-800">ESI</p>
            <p className="text-sm text-slate-500">Threshold: ₹{settings.esiThreshold.toLocaleString()}</p>
          </div>
          <Toggle checked={settings.esiEnabled} onChange={(v) => updateSetting('esiEnabled', v)} />
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-800">TDS</p>
            <p className="text-sm text-slate-500">Auto-calculate TDS based on tax slabs</p>
          </div>
          <Toggle checked={settings.tdsEnabled} onChange={(v) => updateSetting('tdsEnabled', v)} />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">Email Notifications</h3>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="font-medium text-slate-800">Enable Email Notifications</p>
          <p className="text-sm text-slate-500">Receive updates via email</p>
        </div>
        <Toggle checked={settings.emailNotifications} onChange={(v) => updateSetting('emailNotifications', v)} />
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="font-medium text-slate-800">Leave Reminders</p>
          <p className="text-sm text-slate-500">Notify about pending leave requests</p>
        </div>
        <Toggle checked={settings.leaveReminders} onChange={(v) => updateSetting('leaveReminders', v)} />
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="font-medium text-slate-800">Birthday Alerts</p>
          <p className="text-sm text-slate-500">Celebrate team birthdays</p>
        </div>
        <Toggle checked={settings.birthdayAlerts} onChange={(v) => updateSetting('birthdayAlerts', v)} />
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="font-medium text-slate-800">Payslip Notifications</p>
          <p className="text-sm text-slate-500">Notify when payslip is generated</p>
        </div>
        <Toggle checked={settings.payslipNotify} onChange={(v) => updateSetting('payslipNotify', v)} />
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <p className="font-medium text-slate-800">Approval Reminders</p>
          <p className="text-sm text-slate-500">Remind managers about pending approvals</p>
        </div>
        <Toggle checked={settings.approvalReminders} onChange={(v) => updateSetting('approvalReminders', v)} />
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Password Policy</h3>
        <div className="form-row">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Password Expiry (days)</label>
            <input
              type="number"
              value={settings.passwordExpiry}
              onChange={(e) => updateSetting('passwordExpiry', parseInt(e.target.value))}
              className="form-control"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Session Timeout (mins)</label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
              className="form-control"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Security Options</h3>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-800">Two-Factor Authentication</p>
            <p className="text-sm text-slate-500">Require MFA for all users</p>
          </div>
          <Toggle checked={settings.mfaEnabled} onChange={(v) => updateSetting('mfaEnabled', v)} />
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-800">IP Restriction</p>
            <p className="text-sm text-slate-500">Restrict access to specific IP addresses</p>
          </div>
          <Toggle checked={settings.ipRestriction} onChange={(v) => updateSetting('ipRestriction', v)} />
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings();
      case 'leave': return renderLeaveSettings();
      case 'attendance': return renderAttendanceSettings();
      case 'payroll': return renderPayrollSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">HR Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure HR module preferences</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs Sidebar */}
        <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
          <div className="flex flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                style={{ 
                  width: 'calc(100% - 16px)', 
                  border: 'none', 
                  background: activeTab === tab.id ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <tab.icon style={{ width: 18, height: 18 }} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          <div className="card shadow-sm border-0 rounded-xl">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
