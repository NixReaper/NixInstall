import React, { useState, useEffect } from 'react';
import './theme.css';
import './App.css';

function App() {
  const [apps, setApps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL ?? '';

  useEffect(() => {
    fetchApps();
    fetchCategories();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await fetch(`${API_URL}/api/apps`);
      if (!response.ok) throw new Error('Failed to fetch apps');
      const data = await response.json();
      setApps(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const toggleApp = (appId) => {
    const next = new Set(selectedApps);
    if (next.has(appId)) next.delete(appId);
    else next.add(appId);
    setSelectedApps(next);
  };

  const generateScript = async () => {
    if (selectedApps.size === 0) return;
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appIds: Array.from(selectedApps) })
      });
      if (!response.ok) throw new Error('Failed to generate script');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nixinstall.ps1';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Error generating script: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getAppsForCategory = (category) => {
    return apps.filter(app => {
      const inCategory = app.category === category;
      const matchesSearch = !searchTerm || app.name.toLowerCase().includes(searchTerm.toLowerCase());
      return inCategory && matchesSearch;
    });
  };

  // Respect both search and selected category filter
  const visibleCategories = categories.filter(cat => {
    const matchesCategory = selectedCategory === 'All' || cat === selectedCategory;
    return matchesCategory && getAppsForCategory(cat).length > 0;
  });

  const visibleAppCount = visibleCategories.reduce(
    (sum, cat) => sum + getAppsForCategory(cat).length, 0
  );

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    // Clear search when switching categories so results aren't confusing
    if (searchTerm) setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading apps...</p>
      </div>
    );
  }

  if (error) {
    return <div className="container" style={{ paddingTop: '3rem' }}><p className="error">Error: {error}</p></div>;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container header-top">
          <div className="header-brand">
            <img src="/logo.png" alt="NixInstall" className="header-logo" />
          </div>
          <nav className="header-nav">
            <button className="nav-link nav-btn active">Home</button>
            <button className="nav-link nav-btn" onClick={() => window.navigateTo('/help')}>Help</button>
            <button className="nav-link nav-btn" onClick={() => window.navigateTo('/request')}>Request an App</button>
            <button className="nav-link nav-btn" onClick={() => window.navigateTo('/about')}>About</button>
          </nav>
          <div className="header-search">
            <input
              type="text"
              placeholder="Search apps..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedCategory !== 'All') setSelectedCategory('All');
              }}
              className="search-input"
            />
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="category-filter-bar">
          <div className="category-tabs">
              <button
                className={`category-tab${selectedCategory === 'All' ? ' active' : ''}`}
                onClick={() => handleCategoryClick('All')}
              >
                All
                <span className="tab-count">{apps.length}</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-tab${selectedCategory === cat ? ' active' : ''}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat}
                  <span className="tab-count">
                    {apps.filter(a => a.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="step-label">
            1. Pick the apps you want
            <span className="step-count">{visibleAppCount} app{visibleAppCount !== 1 ? 's' : ''}</span>
          </div>

          {visibleCategories.length === 0 ? (
            <p className="no-results">No apps match "{searchTerm}"</p>
          ) : (
            <div className="categories-masonry">
              {visibleCategories.map(category => (
                <div key={category} className="category-block">
                  <h3 className="category-title">{category}</h3>
                  <ul className="app-list">
                    {getAppsForCategory(category).map(app => (
                      <li key={app.id}>
                        <label className={`app-label${selectedApps.has(app.id) ? ' selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selectedApps.has(app.id)}
                            onChange={() => toggleApp(app.id)}
                          />
                          <span>{app.name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="step-label">2. Download and run your installer</div>
          <div className="install-bar">
            <span className="selection-count">
              {selectedApps.size === 0
                ? 'No apps selected — check some above'
                : `${selectedApps.size} app${selectedApps.size !== 1 ? 's' : ''} selected`}
            </span>
            <button
              className="btn-primary"
              onClick={generateScript}
              disabled={selectedApps.size === 0 || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Get Your NixInstall Script'}
            </button>
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

export default App;
