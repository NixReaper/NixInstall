import React, { useState, useEffect } from 'react';
import './theme.css';
import './Admin.css';

// ── Inline SVG Icons ──────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const paths = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    applications: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
    logs: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    help: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/>
      </svg>
    ),
    signout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
        <polyline points="16,17 21,12 16,7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    menu: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  };
  return <span className="icon">{paths[name] || null}</span>;
};

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: 'dashboard' },
  { id: 'applications', label: 'Applications', icon: 'applications' },
  { id: 'settings',     label: 'Settings',     icon: 'settings' },
  { id: 'logs',         label: 'Logs',         icon: 'logs',   soon: true },
  { id: 'help',         label: 'Help / Docs',  icon: 'help',   soon: true },
];

// ── Main Component ────────────────────────────────────────────────
function Admin() {
  const [screen,        setScreen]        = useState('login');
  const [token,         setToken]         = useState(localStorage.getItem('adminToken') || null);
  const [password,      setPassword]      = useState('');
  const [apps,          setApps]          = useState([]);
  const [stats,         setStats]         = useState(null);
  const [settings,      setSettings]      = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  // App form
  const [editingId, setEditingId] = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [formData,  setFormData]  = useState({ id: '', name: '', category: '', url: '', type: 'exe', args: '' });

  const API_URL = process.env.REACT_APP_API_URL ?? '';

  useEffect(() => {
    if (token) {
      setScreen('dashboard');
      loadDashboard();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  // ── API calls ───────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('Invalid password');
      const data = await res.json();
      setToken(data.token);
      localStorage.setItem('adminToken', data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('adminToken')}` };
      const [statsRes, appsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/apps`,  { headers }),
      ]);
      if (!statsRes.ok || !appsRes.ok) throw new Error('Session expired — please log in again.');
      setStats(await statsRes.json());
      setApps(await appsRes.json());
    } catch (err) {
      setError(err.message);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      if (res.ok) setSettings(await res.json());
    } catch {}
  };

  const handleSaveApp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url    = editingId ? `${API_URL}/admin/apps/${editingId}` : `${API_URL}/admin/apps`;
      const method = editingId ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(formData) });
      if (!res.ok) throw new Error('Failed to save app');
      setSuccess(editingId ? 'App updated.' : 'App added.');
      resetForm();
      await loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditApp = (app) => {
    setFormData(app);
    setEditingId(app.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm('Delete this app?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/apps/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('App deleted.');
      await loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', category: '', url: '', type: 'exe', args: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    setScreen('login');
    setPassword('');
    setStats(null);
    setApps([]);
  };

  const handleSectionChange = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    setError('');
    setSuccess('');
    if (id === 'settings') loadSettings();
  };

  const filteredApps = apps.filter(app =>
    appSearch === '' ||
    app.name.toLowerCase().includes(appSearch.toLowerCase()) ||
    app.category.toLowerCase().includes(appSearch.toLowerCase()) ||
    app.id.toLowerCase().includes(appSearch.toLowerCase())
  );

  // ── Login Screen ──────────────────────────────────────────────

  if (screen === 'login') {
    return (
      <div className="admin-login-page">
        <div className="login-card">
          <div className="login-logo">
            <img src="/logo.png" alt="NixInstall" />
          </div>
          <h1>Admin Panel</h1>
          <p className="login-subtitle">Sign in to manage NixInstall</p>
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary full-width">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main Shell ────────────────────────────────────────────────

  const currentNav = NAV_ITEMS.find(n => n.id === activeSection);

  return (
    <div className="admin-shell">

      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-brand" onClick={() => window.navigateTo('/')}>
          <img src="/logo.png" alt="NixInstall" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item${activeSection === item.id ? ' active' : ''}${item.soon ? ' soon' : ''}`}
              onClick={() => !item.soon && handleSectionChange(item.id)}
            >
              <Icon name={item.icon} />
              <span className="nav-label">{item.label}</span>
              {item.soon && <span className="nav-soon">Soon</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item nav-signout" onClick={handleLogout}>
            <Icon name="signout" />
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="admin-body">

        {/* Top bar */}
        <header className="admin-topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            <Icon name="menu" size={20} />
          </button>
          <h2 className="topbar-title">{currentNav?.label}</h2>
          <div className="topbar-right">
            <span className="topbar-user">Administrator</span>
            <button className="btn-signout" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          {error   && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          {/* ── Dashboard ─────────────────────────────────── */}
          {activeSection === 'dashboard' && (
            <div className="section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats?.totalApps ?? '—'}</div>
                  <div className="stat-label">Total Apps</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats?.totalCategories ?? '—'}</div>
                  <div className="stat-label">Categories</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number-sm">
                    {stats ? new Date(stats.lastUpdated).toLocaleTimeString() : '—'}
                  </div>
                  <div className="stat-label">Last Refreshed</div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-title">Categories</div>
                  <div className="category-list">
                    {stats?.categories?.map(cat => (
                      <div key={cat} className="category-row">
                        <span>{cat}</span>
                        <span className="cat-count">{apps.filter(a => a.category === cat).length}</span>
                      </div>
                    ))}
                    {!stats?.categories?.length && (
                      <p className="empty-state">No data yet.</p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">Quick Actions</div>
                  <div className="quick-actions">
                    <button className="btn-primary" onClick={() => { handleSectionChange('applications'); setShowForm(true); }}>
                      + Add New App
                    </button>
                    <button className="btn-secondary" onClick={() => window.navigateTo('/')}>
                      View Live Site
                    </button>
                    <button className="btn-secondary" onClick={loadDashboard} disabled={loading}>
                      {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Applications ──────────────────────────────── */}
          {activeSection === 'applications' && (
            <div className="section">
              <div className="section-toolbar">
                <div className="search-wrap">
                  <Icon name="search" size={15} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, category or ID..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                  />
                </div>
                <button
                  className="btn-primary"
                  onClick={() => { if (showForm && !editingId) { resetForm(); } else { resetForm(); setShowForm(true); } }}
                >
                  {showForm && !editingId ? '✕  Cancel' : '+ Add App'}
                </button>
              </div>

              {/* Add / Edit Form */}
              {showForm && (
                <div className="card form-card">
                  <div className="card-title">{editingId ? 'Edit App' : 'New App'}</div>
                  <form onSubmit={handleSaveApp}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>App ID <span className="req">*</span></label>
                        <input
                          type="text"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                          placeholder="e.g., vscode"
                          disabled={!!editingId}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Display Name <span className="req">*</span></label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., VS Code"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Category <span className="req">*</span></label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="e.g., Developer Tools"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Installer Type <span className="req">*</span></label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                          <option value="exe">EXE</option>
                          <option value="msi">MSI</option>
                          <option value="zip">ZIP</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Download URL <span className="req">*</span></label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://..."
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Install Arguments <span className="opt">(optional)</span></label>
                      <input
                        type="text"
                        value={formData.args}
                        onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                        placeholder="e.g., /silent /norestart"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Saving...' : editingId ? 'Update App' : 'Add App'}
                      </button>
                      <button type="button" onClick={resetForm} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Apps Table */}
              <div className="card">
                <div className="card-title-row">
                  <div className="card-title">Apps Library</div>
                  <span className="count-badge">{filteredApps.length} / {apps.length}</span>
                </div>
                <div className="apps-table">
                  <div className="table-head">
                    <div className="col-id">ID</div>
                    <div className="col-name">Name</div>
                    <div className="col-cat">Category</div>
                    <div className="col-type">Type</div>
                    <div className="col-actions">Actions</div>
                  </div>
                  {filteredApps.length === 0 ? (
                    <div className="table-empty">
                      {appSearch ? `No apps match "${appSearch}"` : 'No apps yet.'}
                    </div>
                  ) : filteredApps.map(app => (
                    <div key={app.id} className="table-row">
                      <div className="col-id"><code>{app.id}</code></div>
                      <div className="col-name">{app.name}</div>
                      <div className="col-cat">{app.category}</div>
                      <div className="col-type">
                        <span className={`type-badge type-${app.type}`}>{app.type.toUpperCase()}</span>
                      </div>
                      <div className="col-actions">
                        <button className="btn-sm btn-edit"   onClick={() => handleEditApp(app)}>Edit</button>
                        <button className="btn-sm btn-delete" onClick={() => handleDeleteApp(app.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Settings ──────────────────────────────────── */}
          {activeSection === 'settings' && (
            <div className="section">
              <div className="card">
                <div className="card-title">Authentication</div>
                <div className="settings-rows">
                  <div className="settings-row">
                    <div>
                      <div className="settings-key">Admin Password</div>
                      <div className="settings-desc">Used to access this admin panel</div>
                    </div>
                    <span className="badge-status badge-ok">
                      {settings?.adminPassword === 'SET' ? 'SET' : 'DEFAULT'}
                    </span>
                  </div>
                </div>
                <p className="settings-note">
                  To change the password, update <code>ADMIN_PASSWORD</code> in the server <code>.env</code> file and restart the backend process.
                </p>
              </div>

              <div className="card">
                <div className="card-title">Email / SMTP</div>
                <div className="settings-rows">
                  <div className="settings-row">
                    <div>
                      <div className="settings-key">Outgoing Mail Server</div>
                      <div className="settings-desc">Used to send app requests to admin</div>
                    </div>
                    <span className="badge-status badge-ok">CONFIGURED</span>
                  </div>
                  <div className="settings-row">
                    <div>
                      <div className="settings-key">Admin Notification Email</div>
                      <div className="settings-desc">Receives app request submissions</div>
                    </div>
                    <span className="badge-status badge-ok">SET</span>
                  </div>
                </div>
                <p className="settings-note">
                  Email is configured via the server <code>.env</code> file using <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, and <code>ADMIN_EMAIL</code>.
                </p>
              </div>

              <div className="card">
                <div className="card-title">Server Info</div>
                <div className="settings-rows">
                  <div className="settings-row">
                    <div className="settings-key">Total Apps</div>
                    <code className="settings-val">{stats?.totalApps ?? '—'}</code>
                  </div>
                  <div className="settings-row">
                    <div className="settings-key">Total Categories</div>
                    <code className="settings-val">{stats?.totalCategories ?? '—'}</code>
                  </div>
                  <div className="settings-row">
                    <div className="settings-key">Environment</div>
                    <code className="settings-val">production</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Coming Soon ───────────────────────────────── */}
          {(activeSection === 'logs' || activeSection === 'help') && (
            <div className="section">
              <div className="coming-soon-wrap">
                <div className="coming-soon-icon">
                  <Icon name={activeSection} size={48} />
                </div>
                <h3>{currentNav?.label}</h3>
                <p>This section is coming in a future update.</p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Admin;
