import React, { useState } from 'react';
import './theme.css';
import './RequestApp.css';

function RequestApp() {
  const [form, setForm] = useState({
    appName: '',
    appUrl: '',
    category: '',
    reason: '',
    requesterEmail: '',
  });
  const [status, setStatus] = useState(null); // null | 'sending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const API_URL = process.env.REACT_APP_API_URL ?? '';

  const categories = [
    'Browsers', 'Compression', 'Developer Tools', 'Documents',
    'File Sharing', 'Gaming', 'Imaging', 'Media', 'Messaging',
    'Online Storage', 'Security', 'Utilities', 'Other',
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.appName.trim()) return;

    setStatus('sending');
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/api/request-app`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Something went wrong');

      setStatus('success');
      setForm({ appName: '', appUrl: '', category: '', reason: '', requesterEmail: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="request-page">
      <header className="header">
        <div className="container header-top">
          <div className="header-brand">
            <img
              src="/logo.png"
              alt="NixInstall"
              className="header-logo"
              style={{ cursor: 'pointer' }}
              onClick={() => window.navigateTo('/')}
            />
          </div>
          <nav className="header-nav">
            <button className="nav-link nav-btn" onClick={() => window.navigateTo('/')}>Home</button>
            <button className="nav-link nav-btn" onClick={() => window.navigateTo('/help')}>Help</button>
            <button className="nav-link nav-btn active">Request an App</button>
            <button className="nav-link nav-btn" onClick={() => window.navigateTo('/about')}>About</button>
          </nav>
        </div>
      </header>

      <main className="request-main">
        <div className="container">
          <div className="request-card">
            <div className="request-header">
              <h1>Request an App</h1>
              <p>Don't see an app you need? Let us know and we'll look into adding it.</p>
            </div>

            {status === 'success' ? (
              <div className="request-success">
                <div className="success-icon">✓</div>
                <h2>Request Sent!</h2>
                <p>Thanks — we'll review your request and add it if it's a good fit.</p>
                <button className="btn-primary" onClick={() => setStatus(null)}>Submit Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="request-form">
                {status === 'error' && (
                  <div className="request-alert error">{errorMsg}</div>
                )}

                <div className="form-group">
                  <label htmlFor="appName">App Name <span className="required">*</span></label>
                  <input
                    id="appName"
                    name="appName"
                    type="text"
                    placeholder="e.g. Notepad++"
                    value={form.appName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="appUrl">App Website <span className="optional">(optional)</span></label>
                  <input
                    id="appUrl"
                    name="appUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={form.appUrl}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Suggested Category <span className="optional">(optional)</span></label>
                  <select id="category" name="category" value={form.category} onChange={handleChange}>
                    <option value="">Select a category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Why do you want this app? <span className="optional">(optional)</span></label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows="4"
                    placeholder="Tell us why this app would be useful..."
                    value={form.reason}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="requesterEmail">Your Email <span className="optional">(optional — for follow-up)</span></label>
                  <input
                    id="requesterEmail"
                    name="requesterEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={form.requesterEmail}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!form.appName.trim() || status === 'sending'}
                  >
                    {status === 'sending' ? 'Sending...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => window.navigateTo('/')}
                  >
                    Back to Apps
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>Run as Administrator · Installs silently in the background · No toolbars or junk</p>
          <p><span className="footer-brand">NixInstall</span></p>
        </div>
      </footer>
    </div>
  );
}

export default RequestApp;
