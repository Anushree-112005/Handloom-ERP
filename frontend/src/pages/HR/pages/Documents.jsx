import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download, Eye, Upload, X, Save, Edit2, Trash2, Folder, File, Calendar, User, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { fetchDocuments, createDocument, updateDocument, deleteDocument, fetchEmployees } from '../../../services/hrService';

const documentCategories = [
  'Identity Documents', 'Education Certificates', 'Employment Letters',
  'Tax Documents', 'Insurance Documents', 'Contracts', 'Performance Reviews',
  'Training Certificates', 'Medical Records', 'Other'
];

const statusColors = {
  'Active': 'bg-green-100 text-green-700',
  'Expired': 'bg-red-100 text-red-700',
  'Pending Verification': 'bg-yellow-100 text-yellow-700',
  'Archived': 'bg-slate-100 text-slate-600'
};

const fileIcons = {
  pdf: 'text-red-500',
  doc: 'text-blue-500',
  docx: 'text-blue-500',
  xls: 'text-green-500',
  xlsx: 'text-green-500',
  jpg: 'text-purple-500',
  png: 'text-purple-500',
  default: 'text-slate-500'
};

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const initialForm = {
    employee_id: '',
    employee_name: '',
    document_type: '',
    document_name: '',
    category: '',
    file_name: '',
    file_url: '',
    expiry_date: '',
    notes: ''
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docData, empData] = await Promise.all([
        fetchDocuments(),
        fetchEmployees()
      ]);
      setDocuments(docData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.document_name || !form.category) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        ...form,
        employee_id: parseInt(form.employee_id)
      };

      if (editingId) {
        await updateDocument(editingId, payload);
      } else {
        await createDocument(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleEdit = (doc) => {
    setForm({
      employee_id: doc.employee_id,
      employee_name: doc.employee_name,
      document_type: doc.document_type || '',
      document_name: doc.document_name,
      category: doc.category,
      file_name: doc.file_name || '',
      file_url: doc.file_url || '',
      expiry_date: doc.expiry_date?.split('T')[0] || '',
      notes: doc.notes || ''
    });
    setEditingId(doc.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await deleteDocument(id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find(e => e.id === parseInt(empId));
    setForm({
      ...form,
      employee_id: empId,
      employee_name: emp?.name || ''
    });
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return 'default';
    const ext = fileName.split('.').pop()?.toLowerCase();
    return fileIcons[ext] ? ext : 'default';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    return matchesCategory;
  });

  // Group by category for sidebar
  const categoryCount = documentCategories.map(cat => ({
    name: cat,
    count: documents.filter(d => d.category === cat).length
  }));

  const stats = {
    total: documents.length,
    active: documents.filter(d => d.status === 'Active').length,
    expiringSoon: documents.filter(d => {
      if (!d.expiry_date) return false;
      const expiry = new Date(d.expiry_date);
      const now = new Date();
      const diff = (expiry - now) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 30;
    }).length,
    expired: documents.filter(d => d.status === 'Expired').length
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Documents</h1>
          <span className="badge badge-active" style={{ padding: '4px 10px', fontSize: 12 }}>
            {filteredDocuments.length} Records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary"
          >
            <Plus size={14} /> Upload Document
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

        {/* Stats */}
        <div className="form-row">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="btn btn-primary">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Documents</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="btn btn-success">
                <File className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.expiringSoon}</p>
                <p className="text-xs text-slate-500">Expiring Soon</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="btn btn-danger">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.expired}</p>
                <p className="text-xs text-slate-500">Expired</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Documents Content */}
          <div className="flex-1 space-y-4">
            {viewMode === 'grid' ? (
              <div className="form-row">
                {filteredDocuments.map(doc => (
                  <div key={doc.id} className="card">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center ${fileIcons[getFileExtension(doc.file_name)]}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-800 truncate">{doc.document_name}</h3>
                            <p className="text-xs text-slate-500">{doc.category}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[doc.status]}`}>
                            {doc.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{doc.employee_name}</span>
                          </div>
                          {doc.expiry_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Exp: {formatDate(doc.expiry_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="btn btn-secondary">
                      <span className="text-xs text-slate-400">{doc.file_name || 'No file'}</span>
                      <div className="flex items-center gap-1">
                        {doc.file_url && (
                          <button className="btn btn-secondary" title="Download">
                            <Download className="w-4 h-4 text-slate-500" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(doc)} className="btn btn-secondary">
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="btn btn-danger">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredDocuments.length === 0 && (
                  <div className="btn btn-secondary">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No documents found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead className="btn btn-secondary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Document</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expiry</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredDocuments.map(doc => (
                        <tr key={doc.id} className="btn btn-secondary">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center ${fileIcons[getFileExtension(doc.file_name)]}`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{doc.document_name}</p>
                                <p className="text-xs text-slate-500">{doc.file_name || 'No file'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-700">{doc.employee_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-700">{doc.category}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-600">{formatDate(doc.expiry_date)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[doc.status]}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right" style={{ textAlign: 'right' }}>
                            <div className="flex items-center justify-end gap-1">
                              {doc.file_url && (
                                <button className="btn btn-secondary" title="Download">
                                  <Download className="w-4 h-4 text-slate-500" />
                                </button>
                              )}
                              <button onClick={() => handleEdit(doc)} className="btn btn-secondary">
                                <Edit2 className="w-4 h-4 text-slate-500" />
                              </button>
                              <button onClick={() => handleDelete(doc.id)} className="btn btn-danger">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredDocuments.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-12 text-center">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No documents found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>{/* END DATA AREA */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Upload'} Document</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                  <select
                    value={form.employee_id}
                    onChange={handleEmployeeChange}
                    className="form-control"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select Category</option>
                    {documentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Name *</label>
                <input
                  type="text"
                  value={form.document_name}
                  onChange={(e) => setForm({ ...form, document_name: e.target.value })}
                  className="form-control"
                  placeholder="e.g., Passport, Degree Certificate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
                <input
                  type="text"
                  value={form.document_type}
                  onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                  className="form-control"
                  placeholder="e.g., ID Proof, Education"
                />
              </div>

              <div className="btn btn-secondary">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-[12px] text-slate-600 mb-1 font-bold tracking-tight">Drag and drop file here or click to browse</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PDF, DOC, JPG up to 10MB</p>
                <input
                  type="file"
                  className="hidden"
                  id="fileUpload"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setForm({ ...form, file_name: file.name, file_url: URL.createObjectURL(file) });
                    }
                  }}
                />
                <button
                  onClick={() => document.getElementById('fileUpload').click()}
                  className="btn btn-secondary"
                >
                  Browse Files
                </button>
                {form.file_name && (
                  <p className="mt-2 text-sm text-green-600">Selected: {form.file_name}</p>
                )}
              </div>

              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">File URL (Optional)</label>
                  <input
                    type="text"
                    value={form.file_url}
                    onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    className="form-control"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="btn btn-secondary">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
