import React, { useState, useEffect } from 'react';
import './theme.css';
import './Admin.css';

function Admin() {
  const [screen, setScreen] = useState('login'); // login, dashboard
  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [password, setPassword] = useState('');
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    url: '',
    type: 'exe',
    args: '',
  });

  const API_URL = process.env.REACT_APP_API_URL ?? '';

  useEffect(() => {
    if (token) {
      setScreen('dashboard');
      loadDashboard();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) throw new Error('Invalid password');

      const data = await response.json();
      setToken(data.token);
      localStorage.setItem('adminToken', data.token);
      setScreen('dashboard');
      loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const storedToken = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${storedToken}` };

      const [statsRes, appsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/apps`, { headers }),
      ]);

      if (!statsRes.ok || !appsRes.ok) throw new Error('Failed to load');

      setStats(await statsRes.json());
      setApps(await appsRes.json());
    } catch (err) {
      setError(err.message);
      setToken(null);
      localStorage.removeItem('adminToken');
      setScreen('login');
    } finally {
      setLoading(false);
    }
  };

  const handleAddApp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const storedToken = localStorage.getItem('adminToken');
      const url = editingId
        ? `${API_URL}/admin/apps/${editingId}`
        : `${API_URL}/admin/apps`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save app');

      setSuccess(editingId ? 'App updated!' : 'App added!');
      setFormData({ id: '', name: '', category: '', url: '', type: 'exe', args: '' });
      setEditingId(null);
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
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm('Delete this app?')) return;

    setLoading(true);
    try {
      const storedToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/apps/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (!response.ok) throw new Error('Failed to delete');

      setSuccess('App deleted!');
      await loadDashboard();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
    setScreen('login');
    setPassword('');
  };

  if (screen === 'login') {
    return (
      <div className="admin-container">
        <div className="login-box">
          <div className="login-header">
            <h1>NixInstall Admin</h1>
            <p>Manage your app sources</p>
          </div>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="hint">Default password: <code>admin123</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="container">
          <div className="header-content">
            <h1>NixInstall Admin Dashboard</h1>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="container">
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          {/* Stats */}
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalApps}</div>
                <div className="stat-label">Total Apps</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.totalCategories}</div>
                <div className="stat-label">Categories</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Last Updated</div>
                <div className="stat-time">
                  {new Date(stats.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          <div className="card">
            <h2>{editingId ? 'Edit App' : 'Add New App'}</h2>
            <form onSubmit={handleAddApp}>
              <div className="form-row">
                <div className="form-group">
                  <label>App ID *</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g., notepad++, vscode"
                    disabled={!!editingId}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>App Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Notepad++"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Developer Tools"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
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
                <label>Download URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Installation Args</label>
                <input
                  type="text"
                  value={formData.args}
                  onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                  placeholder="e.g., /silent /install"
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : editingId ? 'Update App' : 'Add App'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ id: '', name: '', category: '', url: '', type: 'exe', args: '' });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Apps List */}
          <div className="card">
            <h2>Apps Library ({apps.length})</h2>
            <div className="apps-table">
              <div className="table-header">
                <div className="col-id">ID</div>
                <div className="col-name">Name</div>
                <div className="col-category">Category</div>
                <div className="col-type">Type</div>
                <div className="col-actions">Actions</div>
              </div>

              {apps.map((app) => (
                <div key={app.id} className="table-row">
                  <div className="col-id">
                    <code>{app.id}</code>
                  </div>
                  <div className="col-name">{app.name}</div>
                  <div className="col-category">{app.category}</div>
                  <div className="col-type">
                    <span className={`type-badge type-${app.type}`}>{app.type}</span>
                  </div>
                  <div className="col-actions">
                    <button
                      onClick={() => handleEditApp(app)}
                      className="btn-sm btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteApp(app.id)}
                      className="btn-sm btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Admin;
