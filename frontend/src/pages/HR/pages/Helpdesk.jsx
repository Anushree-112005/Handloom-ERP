import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, MessageSquare, CheckCircle, Clock, AlertCircle, X, Save, Edit2, Trash2, Send, User, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { fetchHelpdesk, createHelpdesk, updateHelpdesk, deleteHelpdesk, fetchEmployees } from '../../../services/hrService';

const ticketCategories = [
  'Payroll Query', 'Leave Query', 'Benefits', 'Tax Documents', 
  'Policy Clarification', 'Technical Issue', 'Access Request', 
  'Document Request', 'General Inquiry', 'Complaint', 'Other'
];

const statusColors = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Waiting on User': 'bg-purple-100 text-purple-700',
  'Resolved': 'bg-green-100 text-green-700',
  'Closed': 'bg-slate-100 text-slate-600'
};

const priorityColors = {
  'Low': 'text-green-600',
  'Medium': 'text-yellow-600',
  'High': 'text-orange-600',
  'Urgent': 'text-red-600'
};

export default function Helpdesk() {
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewingTicket, setViewingTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  const initialForm = {
    employee_id: '',
    employee_name: '',
    category: '',
    subject: '',
    description: '',
    priority: 'Medium'
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketData, empData] = await Promise.all([
        fetchHelpdesk(),
        fetchEmployees()
      ]);
      setTickets(ticketData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.category || !form.subject || !form.description) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        ...form,
        employee_id: parseInt(form.employee_id)
      };

      if (editingId) {
        await updateHelpdesk(editingId, payload);
      } else {
        await createHelpdesk(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (error) {
      console.error('Error saving ticket:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateHelpdesk(id, { status: newStatus });
      loadData();
      if (viewingTicket && viewingTicket.id === id) {
        setViewingTicket({ ...viewingTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    try {
      await deleteHelpdesk(id);
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

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      const currentResponse = viewingTicket.response || '';
      const newResponse = currentResponse + 
        (currentResponse ? '\n\n---\n\n' : '') + 
        `[${new Date().toLocaleString()}] HR Team:\n${replyText}`;
      
      await updateHelpdesk(viewingTicket.id, { 
        response: newResponse,
        status: 'In Progress'
      });
      
      setReplyText('');
      loadData();
      setViewingTicket({ ...viewingTicket, response: newResponse, status: 'In Progress' });
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = !filterStatus || ticket.status === filterStatus;
    const matchesCategory = !filterCategory || ticket.category === filterCategory;
    return matchesStatus && matchesCategory;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER */}
      <div className="btn btn-secondary">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">HR Helpdesk</h1>
          <span className="btn btn-primary">
            {filteredTickets.length} Records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                showFilters || filterStatus || filterCategory
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              Filter
              {(filterStatus || filterCategory) && (
                <span className="btn btn-primary" />
              )}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button
                    onClick={() => { setFilterStatus(''); setFilterCategory(''); setShowFilters(false); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-control"
                    >
                      <option value="">All Status</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="form-control"
                    >
                      <option value="">All Categories</option>
                      {ticketCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="btn btn-secondary">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary"
          >
            <Plus size={14} /> New Ticket
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
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Tickets</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.open}</p>
              <p className="text-xs text-slate-500">Open</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.inProgress}</p>
              <p className="text-xs text-slate-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.resolved}</p>
              <p className="text-xs text-slate-500">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Content */}
      {viewMode === 'list' ? (
      <div className="card">
        <div className="divide-y divide-slate-100">
          {filteredTickets.map(ticket => (
            <div 
              key={ticket.id} 
              className="btn btn-secondary"
              onClick={() => setViewingTicket(ticket)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-indigo-600">{ticket.ticket_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                      {ticket.status}
                    </span>
                    <span className={`text-xs font-medium ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800 truncate">{ticket.subject}</h3>
                  <p className="text-sm text-slate-500 truncate mt-1">{ticket.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{ticket.employee_name}</span>
                    </div>
                    <span>{ticket.category}</span>
                    <span>{getTimeAgo(ticket.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {ticket.response && (
                    <MessageSquare className="w-4 h-4 text-green-500" />
                  )}
                  <button onClick={() => handleDelete(ticket.id)} className="btn btn-danger">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && (
            <div className="p-12 text-center">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No tickets found</p>
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="form-row">
          {filteredTickets.map(ticket => (
            <div 
              key={ticket.id} 
              className="card"
              onClick={() => setViewingTicket(ticket)}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-sm font-mono text-indigo-600">{ticket.ticket_id}</span>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  {ticket.response && (
                    <MessageSquare className="w-4 h-4 text-green-500" />
                  )}
                  <button onClick={() => handleDelete(ticket.id)} className="btn btn-danger">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{ticket.subject}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{ticket.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                  {ticket.status}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[ticket.priority]} bg-slate-50`}>
                  {ticket.priority}
                </span>
              </div>
              
              <div className="btn btn-secondary">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5" />
                  <span>{ticket.employee_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{ticket.category}</span>
                  <span>{getTimeAgo(ticket.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && (
            <div className="btn btn-secondary">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No tickets found</p>
            </div>
          )}
        </div>
      )}

      </div>{/* END DATA AREA */}

      {/* New Ticket Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">New Support Ticket</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
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
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select Category</option>
                    {ticketCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="form-control"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="form-control"
                  placeholder="Brief description of your issue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="form-control"
                  placeholder="Provide detailed information about your query..."
                />
              </div>
            </div>
            <div className="btn btn-secondary">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                <Save className="w-4 h-4" /> Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {viewingTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-indigo-600">{viewingTicket.ticket_id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[viewingTicket.status]}`}>
                  {viewingTicket.status}
                </span>
              </div>
              <button onClick={() => setViewingTicket(null)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h2 className="card-title">{viewingTicket.subject}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span>{viewingTicket.employee_name}</span>
                  <span>{viewingTicket.category}</span>
                  <span className={`font-medium ${priorityColors[viewingTicket.priority]}`}>{viewingTicket.priority}</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewingTicket.description}</p>
                <p className="text-xs text-slate-400 mt-2">{formatDate(viewingTicket.created_at)}</p>
              </div>
              
              {viewingTicket.response && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">Response</h4>
                  <div className="btn btn-success">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewingTicket.response}</p>
                  </div>
                </div>
              )}
              
              {/* Status Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <span className="text-sm font-medium text-slate-600 mr-2">Change Status:</span>
                {['Open', 'In Progress', 'Waiting on User', 'Resolved', 'Closed'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(viewingTicket.id, status)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${viewingTicket.status === status ? statusColors[status] : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              
              {/* Reply Section */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Send Reply</label>
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="btn btn-secondary"
                    placeholder="Type your response..."
                  />
                </div>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="btn btn-primary"
                >
                  <Send className="w-4 h-4" /> Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
