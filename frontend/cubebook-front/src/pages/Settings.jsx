import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useCompanyStore from "../store/companyStore";
import { companies, users as usersApi } from "../api";
import {
  Settings as SettingsIcon,
  Users,
  ShieldCheck,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  UserPlus,
  Lock,
  Save,
} from "lucide-react";

const INDIAN_STATES = [
  ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"],
  ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"],
  ["23", "Madhya Pradesh"], ["24", "Gujarat"], ["27", "Maharashtra"],
  ["29", "Karnataka"], ["32", "Kerala"], ["33", "Tamil Nadu"], ["36", "Telangana"],
  ["37", "Andhra Pradesh"], ["19", "West Bengal"],
];

const MOCK_PERMISSIONS_KEY = "cb_mock_permissions";

const DEFAULT_PERMISSIONS = {
  Administrator: { masters: { read: true, write: true }, transactions: { read: true, write: true }, reports: { read: true, write: true }, settings: { read: true, write: true } },
  Accountant: { masters: { read: true, write: true }, transactions: { read: true, write: true }, reports: { read: true, write: false }, settings: { read: false, write: false } },
  "Sales Manager": { masters: { read: true, write: false }, transactions: { read: true, write: true }, reports: { read: false, write: false }, settings: { read: false, write: false } },
  Auditor: { masters: { read: true, write: false }, transactions: { read: true, write: false }, reports: { read: true, write: false }, settings: { read: false, write: false } },
};

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeCompany, setCompany } = useCompanyStore();

  // Determine active tab by checking current path
  const currentPath = location.pathname;
  const activeTab = currentPath === "/admin/users" 
    ? "users" 
    : currentPath === "/admin/roles" 
      ? "roles" 
      : "company";

  // State for tabs
  const handleTabChange = (tab) => {
    if (tab === "users") navigate("/admin/users");
    else if (tab === "roles") navigate("/admin/roles");
    else navigate("/settings");
  };

  // ── Tab 1: Company Settings State & Logic ──
  const [companyForm, setCompanyForm] = useState({
    name: "",
    legal_name: "",
    address: "",
    state_code: "",
    pincode: "",
    telephone: "",
    mobile: "",
    email: "",
    website: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (activeCompany) {
      setCompanyForm({
        name: activeCompany.name || "",
        legal_name: activeCompany.legal_name || "",
        address: activeCompany.address || "",
        state_code: activeCompany.state_code || "",
        pincode: activeCompany.pincode || "",
        telephone: activeCompany.telephone || "",
        mobile: activeCompany.mobile || "",
        email: activeCompany.email || "",
        website: activeCompany.website || "",
      });
    }
  }, [activeCompany]);

  const companyMutation = useMutation({
    mutationFn: (payload) => companies.update(activeCompany.id, payload),
    onSuccess: (data) => {
      setCompany(data);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleCompanySave = (e) => {
    e.preventDefault();
    companyMutation.mutate(companyForm);
  };

  // ── Tab 2: User Management State & Logic ── (API-backed)
  const { data: usersList = [], refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ full_name: "", username: "", email: "", role: "Accountant", password: "" });

  const createUserMutation = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => { refetchUsers(); setUserForm({ full_name: "", username: "", email: "", role: "Accountant", password: "" }); setShowAddUserModal(false); },
  });
  const deleteUserMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => refetchUsers(),
  });
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) => usersApi.update(id, { is_active }),
    onSuccess: () => refetchUsers(),
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!userForm.full_name || !userForm.email || !userForm.username || !userForm.password) return;
    createUserMutation.mutate({ ...userForm });
  };

  const toggleUserStatus = (user) => {
    toggleStatusMutation.mutate({ id: user.id, is_active: !user.is_active });
  };

  const deleteUser = (id) => {
    if (confirm("Are you sure you want to remove this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  // ── Tab 3: Roles & Permissions Logic ──
  const [permissionsMatrix, setPermissionsMatrix] = useState(() => {
    const saved = localStorage.getItem(MOCK_PERMISSIONS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
  });

  useEffect(() => {
    localStorage.setItem(MOCK_PERMISSIONS_KEY, JSON.stringify(permissionsMatrix));
  }, [permissionsMatrix]);

  const togglePermission = (role, module, action) => {
    setPermissionsMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: {
          ...prev[role][module],
          [action]: !prev[role][module][action],
        },
      },
    }));
  };

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Building2 size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company to configure settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="btn btn-primary">
            <SettingsIcon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Administration Portal</h1>
            <p className="cb-page-subtitle">Configure company settings, users, and module access permissions</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="btn btn-secondary">
        <button
          onClick={() => handleTabChange("company")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === "company"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <Building2 size={16} />
          Company Settings
        </button>
        <button
          onClick={() => handleTabChange("users")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === "users"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <Users size={16} />
          User Management
        </button>
        <button
          onClick={() => handleTabChange("roles")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === "roles"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
          }`}
        >
          <ShieldCheck size={16} />
          Roles & Permissions
        </button>
      </div>

      {/* ── Content View ── */}
      <div className="space-y-6">
        
        {/* COMPANY SETTINGS TAB */}
        {activeTab === "company" && (
          <form onSubmit={handleCompanySave} className="cb-card p-6 space-y-6">
            <div className="btn btn-secondary">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Edit Company Information</span>
              </div>
              {saveSuccess && (
                <span className="btn btn-success">
                  <Check size={14} /> Saved successfully!
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Company Name *</span>
                <input
                  required
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="cb-input"
                  placeholder="e.g. Acme Corp"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Legal/Mailing Name</span>
                <input
                  type="text"
                  value={companyForm.legal_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, legal_name: e.target.value })}
                  className="cb-input"
                  placeholder="e.g. Acme Corporation Private Limited"
                />
              </label>

              <label className="sm:col-span-2 flex flex-col gap-1.5">
                <span className="cb-label">Address</span>
                <textarea
                  rows={2}
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="cb-input resize-none"
                  placeholder="Street address, building, suite"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">State / Region</span>
                <select
                  value={companyForm.state_code}
                  onChange={(e) => setCompanyForm({ ...companyForm, state_code: e.target.value })}
                  className="cb-input"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name} ({code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Pincode</span>
                <input
                  type="text"
                  value={companyForm.pincode}
                  onChange={(e) => setCompanyForm({ ...companyForm, pincode: e.target.value })}
                  className="cb-input"
                  placeholder="600001"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Telephone</span>
                <input
                  type="text"
                  value={companyForm.telephone}
                  onChange={(e) => setCompanyForm({ ...companyForm, telephone: e.target.value })}
                  className="cb-input"
                  placeholder="044 - 123456"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Mobile Number</span>
                <input
                  type="text"
                  value={companyForm.mobile}
                  onChange={(e) => setCompanyForm({ ...companyForm, mobile: e.target.value })}
                  className="cb-input"
                  placeholder="+91 - 9876543210"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">E-mail address</span>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="cb-input"
                  placeholder="finance@company.com"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="cb-label">Website URL</span>
                <input
                  type="text"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  className="cb-input"
                  placeholder="www.company.com"
                />
              </label>
            </div>

            <div className="btn btn-secondary">
              <button
                type="submit"
                disabled={companyMutation.isPending}
                className="cb-btn-primary"
              >
                <Save size={15} />
                {companyMutation.isPending ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}

        {/* USER MANAGEMENT TAB */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 cb-card">
              <div className="relative w-72">
                <input
                  type="text"
                  disabled
                  placeholder="Search user accounts..."
                  className="form-control"
                />
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="cb-btn-primary text-xs py-1.5 px-3 rounded-lg"
              >
                <Plus size={14} /> Add User
              </button>
            </div>

            <div className="cb-card">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead className="btn btn-secondary">
                    <tr>
                      <th className="px-6 py-3 cb-th">User Name</th>
                      <th className="px-6 py-3 cb-th">Email</th>
                      <th className="px-6 py-3 cb-th">Role</th>
                      <th className="px-6 py-3 cb-th">Status</th>
                      <th className="px-6 py-3 cb-th">Created Date</th>
                      <th className="px-6 py-3 cb-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((user) => (
                      <tr key={user.id} className="btn btn-secondary">
                        <td className="px-6 py-3 cb-td font-semibold text-slate-800">
                          <div>{user.full_name}</div>
                          <div className="text-xs font-mono text-slate-400">@{user.username}</div>
                        </td>
                        <td className="px-6 py-3 cb-td text-slate-500 font-mono text-[12px]">{user.email}</td>
                        <td className="px-6 py-3 cb-td">
                          <span className="btn btn-primary">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-3 cb-td">
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              user.is_active
                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-6 py-3 cb-td text-slate-400">{user.created_at?.split('T')[0]}</td>
                        <td className="px-6 py-3 cb-td text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleUserStatus(user)}
                              className="btn btn-primary"
                              title="Toggle Status"
                            >
                              <Lock size={14} />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="btn btn-danger"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add User Modal */}
            {showAddUserModal && (
              <div
                className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                onClick={() => setShowAddUserModal(false)}
              >
                <form
                  onSubmit={handleAddUser}
                  className="card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="btn btn-secondary">
                    <span className="text-sm font-semibold text-slate-800">Add New User</span>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Full Name *</span>
                      <input
                        required
                        type="text"
                        value={userForm.full_name}
                        onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                        placeholder="John Doe"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Username *</span>
                      <input
                        required
                        type="text"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3 font-mono"
                        placeholder="jdoe"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Email Address *</span>
                      <input
                        required
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                        placeholder="john@company.com"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Password *</span>
                      <input
                        required
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                        placeholder="Minimum 6 characters"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="cb-label">Role Selection</span>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                        className="cb-input text-xs py-1.5 px-3"
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Sales Manager">Sales Manager</option>
                        <option value="Auditor">Auditor</option>
                      </select>
                    </label>
                  </div>

                  <div className="btn btn-secondary">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="cb-btn-secondary text-xs py-1.5 px-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createUserMutation.isPending}
                      className="cb-btn-primary text-xs py-1.5 px-3"
                    >
                      {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ROLES & PERMISSIONS TAB */}
        {activeTab === "roles" && (
          <div className="space-y-4">
            <div className="cb-card p-6 bg-slate-50 border-purple-100">
              <div className="flex gap-3 items-start">
                <div className="btn btn-primary">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 text-sm block">System Security Policy</span>
                  <span className="text-[12px] text-slate-500 mt-1 block">
                    Manage permission levels across the 4 key roles. Tick modules to grant view/read access, and toggles to control modify/write access.
                  </span>
                </div>
              </div>
            </div>

            <div className="cb-card">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead className="btn btn-secondary">
                    <tr>
                      <th className="px-6 py-4 cb-th w-1/4">System Module</th>
                      {Object.keys(permissionsMatrix).map((role) => (
                        <th key={role} className="px-6 py-4 cb-th text-center">{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ["masters", "Masters (Parties, Stock, Accounts)"],
                      ["transactions", "Transactions (Voucher Entry, Day Book)"],
                      ["reports", "Financial Reports (Trial Balance, P&L)"],
                      ["settings", "System Administration Settings"],
                    ].map(([moduleKey, label]) => (
                      <tr key={moduleKey} className="btn btn-secondary">
                        <td className="px-6 py-4 cb-td font-semibold text-slate-700">{label}</td>
                        {Object.keys(permissionsMatrix).map((role) => {
                          const perms = permissionsMatrix[role][moduleKey];
                          return (
                            <td key={role} className="px-6 py-4 cb-td text-center">
                              <div className="flex items-center justify-center gap-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={perms.read}
                                    onChange={() => togglePermission(role, moduleKey, "read")}
                                    className="btn btn-secondary"
                                  />
                                  <span className="text-[11px] text-slate-400 uppercase font-semibold">View</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={perms.write}
                                    onChange={() => togglePermission(role, moduleKey, "write")}
                                    className="btn btn-secondary"
                                  />
                                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Modify</span>
                                </label>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
