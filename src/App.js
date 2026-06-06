
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5000/api';

// ── LOGIN ──
function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/login`, form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      onLogin(res.data.username);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed!');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">📋 CRM</div>
        <h1>Welcome Back</h1>
        <p className="login-sub">Sign in to manage your leads</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="login-hint">Register via API first — then login!</p>
      </div>
    </div>
  );
}

// ── ADD LEAD MODAL ──
function AddLeadModal({ onClose, onAdd, editLead }) {
  const [form, setForm] = useState(
    editLead || { name: '', email: '', phone: '', source: 'Website', status: 'New', notes: '' }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editLead ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Enter name" required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Enter email" required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Enter phone" />
            </div>
            <div className="form-group">
              <label>Source</label>
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                <option>Website</option>
                <option>LinkedIn</option>
                <option>Referral</option>
                <option>Cold Call</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option>New</option>
                <option>Contacted</option>
                <option>Converted</option>
                <option>Lost</option>
              </select>
            </div>
            <div className="form-group full">
              <label>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Add notes..." rows={3} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">{editLead ? 'Update Lead' : 'Add Lead'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── DASHBOARD ──
function Dashboard({ username, onLogout }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API}/leads`, { headers });
      setLeads(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleAdd = async (form) => {
    try {
      if (editLead) {
        await axios.put(`${API}/leads/${editLead.id}`, form, { headers });
      } else {
        await axios.post(`${API}/leads`, form, { headers });
      }
      setShowModal(false);
      setEditLead(null);
      fetchLeads();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    await axios.delete(`${API}/leads/${id}`, { headers });
    fetchLeads();
  };

  const handleStatusChange = async (id, status) => {
    await axios.put(`${API}/leads/${id}`, { status }, { headers });
    fetchLeads();
  };

  const filtered = leads.filter(l => {
    const matchSearch = l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    converted: leads.filter(l => l.status === 'Converted').length,
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">📋 CRM</div>
        <nav className="sidebar-nav">
          <a className="nav-item active">📊 Dashboard</a>
          <a className="nav-item">👥 Leads</a>
          <a className="nav-item">📈 Reports</a>
          <a className="nav-item">⚙️ Settings</a>
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{username[0].toUpperCase()}</div>
          <div>
            <div className="user-name">{username}</div>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="main-header">
          <div>
            <h1>Lead Management</h1>
            <p className="header-sub">Manage and track your client leads</p>
          </div>
          <button className="btn-add" onClick={() => { setEditLead(null); setShowModal(true); }}>
            + Add Lead
          </button>
        </div>

        <div className="stats-grid">
          {[
            { icon: '👥', num: stats.total, label: 'Total Leads' },
            { icon: '🆕', num: stats.new, label: 'New' },
            { icon: '📞', num: stats.contacted, label: 'Contacted' },
            { icon: '✅', num: stats.converted, label: 'Converted' },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="filters">
          <input
            className="search-input"
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filter-btns">
            {['All', 'New', 'Contacted', 'Converted', 'Lost'].map(s => (
              <button key={s} className={`filter-btn ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading">Loading leads...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No leads found. Add your first lead! 🚀</div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Phone</th>
                  <th>Source</th><th>Status</th><th>Notes</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}>
                    <td><strong>{lead.name}</strong></td>
                    <td>{lead.email}</td>
                    <td>{lead.phone || '—'}</td>
                    <td>{lead.source}</td>
                    <td>
                      <select className="status-select" value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}>
                        <option>New</option>
                        <option>Contacted</option>
                        <option>Converted</option>
                        <option>Lost</option>
                      </select>
                    </td>
                    <td>{lead.notes || '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit" onClick={() => { setEditLead(lead); setShowModal(true); }}>✏️</button>
                        <button className="btn-delete" onClick={() => handleDelete(lead.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showModal && (
        <AddLeadModal
          onClose={() => { setShowModal(false); setEditLead(null); }}
          onAdd={handleAdd}
          editLead={editLead}
        />
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(localStorage.getItem('username'));
  const handleLogin = (username) => setUser(username);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };
  return user
    ? <Dashboard username={user} onLogout={handleLogout} />
    : <Login onLogin={handleLogin} />;
}

export default App;
