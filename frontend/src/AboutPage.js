import React from 'react';
import './theme.css';
import './AboutPage.css';

function AboutPage() {
  return (
    <div className="about-page">
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
            <button className="nav-link nav-btn" onClick={() => window.navigateTo('/request')}>Request an App</button>
            <button className="nav-link nav-btn active">About</button>
          </nav>
        </div>
      </header>

      <main className="about-main">
        <div className="container">

          {/* Hero */}
          <section className="about-hero">
            <h1 className="about-title">About NixInstall</h1>
            <p className="about-lead">
              A fast, clean way to set up a Windows PC — pick the apps you want, get one script, run it once.
            </p>
          </section>

          {/* Mission */}
          <section className="about-section">
            <h2 className="about-section-title">Why NixInstall exists</h2>
            <div className="about-card">
              <p>
                Setting up a new Windows machine has always meant hunting for installers one by one, clicking through
                setup wizards, and dodging bundled toolbars or sponsor offers. NixInstall was built to eliminate that
                friction entirely.
              </p>
              <p>
                You pick your apps from a curated catalog, and we generate a single PowerShell script that installs
                everything silently and cleanly — no extra clicks, no junk, no account required.
              </p>
            </div>
          </section>

          {/* Principles */}
          <section className="about-section">
            <h2 className="about-section-title">Principles</h2>
            <div className="principles-grid">
              <div className="principle-card">
                <div className="principle-icon">⚡</div>
                <h3>Fast</h3>
                <p>Scripts install apps in parallel where possible. A full suite of tools takes minutes, not an afternoon.</p>
              </div>
              <div className="principle-card">
                <div className="principle-icon">🔒</div>
                <h3>Clean</h3>
                <p>Silent install flags strip out bundled extras. What you selected is what you get — nothing more.</p>
              </div>
              <div className="principle-card">
                <div className="principle-icon">🔍</div>
                <h3>Transparent</h3>
                <p>The generated script is plain text. Read it, audit it, modify it before you run a single line.</p>
              </div>
              <div className="principle-card">
                <div className="principle-icon">📦</div>
                <h3>Official sources</h3>
                <p>Installers are fetched directly from each vendor's CDN or official GitHub releases — never re-hosted.</p>
              </div>
            </div>
          </section>

          {/* How it works under the hood */}
          <section className="about-section">
            <h2 className="about-section-title">How it works</h2>
            <div className="about-card">
              <p>
                NixInstall is a lightweight web app backed by a small Node.js server. When you click
                "Get Your NixInstall Script," the server assembles a PowerShell script from the apps
                you selected, streams it to your browser as a <code>.ps1</code> download, and discards
                the request — nothing is logged or stored.
              </p>
              <p>
                The script itself uses standard PowerShell to download each installer directly from
                its official source and invoke it with silent-install arguments. No package manager
                or third-party runtime is required on the target machine.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="about-section about-cta">
            <p>Have an app you'd like to see in the catalog?</p>
            <button className="btn-primary" onClick={() => window.navigateTo('/request')}>
              Request an App
            </button>
            <button className="btn-secondary" onClick={() => window.navigateTo('/')}>
              Back to the Catalog
            </button>
          </section>

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

export default AboutPage;
