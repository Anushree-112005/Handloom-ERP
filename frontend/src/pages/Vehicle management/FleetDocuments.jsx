import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, Plus, Search, FileText, AlertCircle, Edit2, Trash2, 
  X, Save, CheckCircle, Upload, Calendar, Truck, ArrowLeft, Eye
} from 'lucide-react';
import api from '../../services/api';
import { showSuccess, showError } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';

// Constants moved to component or state if dynamic
const DOC_TYPES = ['RC (Registration Certificate)', 'Insurance', 'Permit', 'Fitness Certificate', 'Pollution (PUC)'];
const STATUSES = ['Active', 'Expired', 'Renewed'];
const REMINDER_DAYS = [7, 15, 30, 45, 60];

const FleetDocuments = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' | 'form'
  const [loading, setLoading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  
  const [formData, setFormData] = useState({
    id: null,
    vehicle: '',
    documentType: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    issuedBy: '',
    reminderBeforeDays: '',
    status: 'Active',
    documentUpload: null, // Just storing file name or object
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      id: null,
      vehicle: '',
      documentType: '',
      documentNumber: '',
      issueDate: '',
      expiryDate: '',
      issuedBy: '',
      reminderBeforeDays: '',
      status: 'Active',
      documentUpload: null,
      notes: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({ ...prev, documentUpload: e.target.files[0] }));
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const [docsRes, vehiclesRes] = await Promise.all([
        api.get('/fleet/documents'),
        api.get('/fleet/vehicles?status=Active')
      ]);
      setDocuments(docsRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle || !formData.documentType || !formData.documentNumber || !formData.issueDate || !formData.expiryDate || !formData.status) {
      showError("Please fill in all required fields marked with *");
      return;
    }

    try {
      if (formData.id) {
        await api.put(`/fleet/documents/${formData.id}`, formData);
        showSuccess("Document updated successfully!");
      } else {
        await api.post('/fleet/documents', formData);
        showSuccess("Document added successfully!");
      }
      fetchDocuments();
      setMode('list');
      resetForm();
    } catch (error) {
      console.error("Error saving document:", error);
      showError("Failed to save document");
    }
  };

  const handleEdit = (doc) => {
    setFormData(doc);
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.vehicle && !formData.documentNumber;
    if (!isFormEmpty) {
      const confirmed = await showConfirm({
        title: 'Cancel Changes',
        description: 'Are you sure you want to cancel? Any unsaved changes will be lost.',
        confirmText: 'Yes, Cancel',
        cancelText: 'No, Stay',
        variant: 'destructive'
      });
      if (!confirmed) return;
    }
    setMode('list');
    resetForm();
  };

  const handleView = (doc) => {
    setFormData(doc);
    setViewingDoc(doc);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Document',
      description: 'Are you sure you want to delete this document? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'destructive'
    });

    if (confirmed) {
      try {
        await api.delete(`/fleet/documents/${id}`);
        showSuccess("Document deleted successfully");
        fetchDocuments();
      } catch (error) {
        console.error("Error deleting document:", error);
        showError("Failed to delete document");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Renewed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocs = documents;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Folder className="h-7 w-7 text-indigo-600" />
              RC / Insurance / Permit
            </h1>
            <p className="text-gray-600 mt-1">Manage vehicle compliance documents</p>
          </div>
        </div>
        {mode === 'list' ? (
          <button 
            onClick={() => { resetForm(); setMode('form'); }}
            className="btn btn-primary"
          >
            <Plus size={18} />
            New Document
          </button>
        ) : (
          <button 
            onClick={handleCancel}
            className="btn btn-secondary"
          >
            <X size={18} />
            Cancel
          </button>
        )}
      </div>

      {mode === 'list' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle / Doc No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issue / Expiry</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Reminder</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
                  <tr key={doc.id} className="btn btn-secondary">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{doc.vehicle}</div>
                      <div className="text-sm text-gray-500">{doc.documentNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{doc.documentType}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">Issue: {doc.issueDate}</div>
                      <div className="text-sm text-red-600 font-medium">Exp: {doc.expiryDate}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">
                      {doc.reminderBeforeDays ? `${doc.reminderBeforeDays} Days` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center space-x-3">
                      <button onClick={() => handleView(doc)} className="text-blue-600 hover:text-blue-900" title="View">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleEdit(doc)} className="text-indigo-600 hover:text-indigo-900" title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:text-red-900" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-900">No documents found</p>
                      <p>Click "New Document" to create one.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Modal Popup */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="card">
            <div className="btn btn-primary">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-3">
                <FileText className="h-6 w-6 text-indigo-600" />
                Document Details
              </h2>
              <button 
                onClick={() => setViewingDoc(null)}
                className="btn btn-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[75vh] bg-white">
              <div className="form-row">
                <div className="btn btn-primary">
                  <h3 className="font-bold text-indigo-800 text-lg border-b border-indigo-200 pb-3 mb-2 flex items-center gap-2">
                    <Truck size={20} className="text-indigo-500" />
                    Basic Info
                  </h3>
                  <div className="space-y-4">
                    <div className="group"><span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Vehicle</span><p className="font-bold text-gray-900 text-lg">{formData.vehicle}</p></div>
                    <div className="group"><span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Document Type</span><p className="font-semibold text-gray-800">{formData.documentType}</p></div>
                    <div className="group"><span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Document Number</span><p className="btn btn-primary">{formData.documentNumber}</p></div>
                    <div className="group"><span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Status</span>
                      <span className={`inline-flex mt-1 px-3 py-1 text-xs rounded-full font-bold uppercase tracking-tighter ${getStatusColor(formData.status)}`}>
                        {formData.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="btn btn-primary">
                  <h3 className="font-bold text-blue-800 text-lg border-b border-blue-200 pb-3 mb-2 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" />
                    Dates & Authority
                  </h3>
                  <div className="space-y-4">
                    <div className="group"><span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Issued By</span><p className="font-semibold text-gray-800 text-lg">{formData.issuedBy || 'N/A'}</p></div>
                    <div className="group"><span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Issue Date</span><p className="font-semibold text-gray-800">{formData.issueDate}</p></div>
                    <div className="group"><span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Expiry Date</span><p className="font-bold text-red-600 flex items-center gap-2"><AlertCircle size={14} />{formData.expiryDate}</p></div>
                    <div className="group"><span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Reminder Before</span><p className="font-semibold text-gray-800">{formData.reminderBeforeDays ? `${formData.reminderBeforeDays} Days` : 'N/A'}</p></div>
                  </div>
                </div>

                {formData.notes && (
                  <div className="btn btn-secondary">
                    <h3 className="btn btn-secondary">Notes & Remarks</h3>
                    <p className="text-gray-700 whitespace-pre-wrap italic leading-relaxed">"{formData.notes}"</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-8 py-5 border-t bg-slate-50 shadow-inner flex justify-end gap-3">
              <button
                onClick={() => setViewingDoc(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button 
                onClick={() => { setViewingDoc(null); setMode('form'); }} 
                className="btn btn-primary"
              >
                <Edit2 size={18} /> Edit Document
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'form' && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2 border-b pb-2">
                <Truck size={20} /> Basic Details
              </h3>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                  <select 
                    name="vehicle" 
                    value={formData.vehicle} 
                    onChange={handleInputChange} 
                    required 
                    className="form-control"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.vehicle_number}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                  <select 
                    name="documentType" 
                    value={formData.documentType} 
                    onChange={handleInputChange} 
                    required 
                    className="form-control"
                  >
                    <option value="">Select Document Type</option>
                    {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Document Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2 border-b pb-2">
                <FileText size={20} /> Document Information
              </h3>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Number *</label>
                  <input 
                    type="text" 
                    name="documentNumber" 
                    value={formData.documentNumber} 
                    onChange={handleInputChange} 
                    required 
                    className="form-control" 
                    placeholder="Enter Document No" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label>
                  <input 
                    type="text" 
                    name="issuedBy" 
                    value={formData.issuedBy} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    placeholder="E.g., RTO Office, Insurance Co." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                  <input 
                    type="date" 
                    name="issueDate" 
                    value={formData.issueDate} 
                    onChange={handleInputChange} 
                    required 
                    className="form-control" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                  <input 
                    type="date" 
                    name="expiryDate" 
                    value={formData.expiryDate} 
                    onChange={handleInputChange} 
                    required 
                    className="form-control" 
                  />
                </div>
              </div>
            </div>

            {/* Auto Links & Reminders */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2 border-b pb-2">
                <AlertCircle size={20} /> Linking & Alerts
              </h3>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Link (Auto)</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={formData.vehicle || 'Auto from selection'} 
                    className="form-control" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Before (Days)</label>
                  <select 
                    name="reminderBeforeDays" 
                    value={formData.reminderBeforeDays} 
                    onChange={handleInputChange} 
                    className="form-control"
                  >
                    <option value="">Select Days</option>
                    {REMINDER_DAYS.map(days => <option key={days} value={days}>{days} Days</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange} 
                    required 
                    className="form-control"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Document Upload & Additional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2 border-b pb-2">
                <Upload size={20} /> Attachment & Notes
              </h3>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Upload * (PDF / Image)</label>
                  <input 
                    type="file" 
                    accept=".pdf,image/*"
                    onChange={handleFileChange} 
                    required={!formData.id && !formData.documentUpload} // required on create only
                    className="form-control" 
                  />
                  {formData.documentUpload && formData.documentUpload.name && (
                    <p className="mt-1 text-sm text-gray-500">Selected: {formData.documentUpload.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Remarks</label>
                  <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleInputChange} 
                    rows={3}
                    placeholder="Any additional information..."
                    className="form-control" 
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex justify-end gap-4">
              <button 
                type="button" 
                onClick={handleCancel} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                <Save size={18} />
                Save Document
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default FleetDocuments;