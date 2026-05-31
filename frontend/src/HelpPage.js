import React, { useState } from 'react';
import './theme.css';
import './HelpPage.css';

const faqs = [
  {
    q: 'Do I need to install anything before running the script?',
    a: 'No. The script runs with PowerShell, which is built into Windows 10 and 11. No extra software required.',
  },
  {
    q: 'Why do I need to run it as Administrator?',
    a: 'Most installers write to Program Files or modify system settings, which requires elevated permissions. Right-click the script and choose "Run with PowerShell" — Windows will prompt for admin access.',
  },
  {
    q: 'Will it install toolbars, adware, or bloatware?',
    a: 'No. NixInstall uses silent install flags specifically to skip optional extras, sponsor offers, and bundled software. You get only what you selected.',
  },
  {
    q: 'What if an app fails to install?',
    a: 'The script continues installing the remaining apps. Failed apps are reported at the end with an error code so you can investigate or retry manually.',
  },
  {
    q: 'Can I re-run the script safely?',
    a: 'Yes. Most installers are idempotent — running them again will update an already-installed app or skip it if it\'s already current.',
  },
  {
    q: 'Where are the apps downloaded from?',
    a: 'Directly from each app\'s official source (vendor CDN, GitHub releases, etc.). NixInstall does not proxy or re-host installers.',
  },
  {
    q: 'Is the generated script saved anywhere?',
    a: 'No. Scripts are generated on-demand and served directly as a download. Nothing is stored on our servers.',
  },
  {
    q: 'Can I edit the script before running it?',
    a: 'Absolutely. Open the .ps1 file in any text editor (Notepad, VS Code, etc.) to review or modify it before running.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <span className="faq-chevron">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  );
}

function HelpPage() {
  return (
    <div className="help-page">
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
            <button className="nav-link nav-btn active">Help</button>
            <button className="nav-link nav-btn" onClick={() => window.navigateTo('/request')}>Request an App</button>
            <button className="nav-link nav-btn" onClick={() => window.navigateTo('/about')}>About</button>
          </nav>
        </div>
      </header>

      <main className="help-main">
        <div className="container">

          {/* How it works */}
          <section className="help-section">
            <h1 className="help-title">How to use NixInstall</h1>
            <p className="help-subtitle">Get a fresh Windows machine set up in three steps.</p>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Pick your apps</h3>
                <p>Browse or search the catalog on the home page. Check every app you want — you can select across multiple categories.</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Download the script</h3>
                <p>Click <strong>Get Your NixInstall Script</strong>. A <code>.ps1</code> PowerShell file downloads instantly — no account needed.</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Run as Administrator</h3>
                <p>Right-click the downloaded file → <strong>Run with PowerShell</strong>. Accept the admin prompt and watch everything install silently.</p>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section className="help-section">
            <h2 className="help-section-title">Tips</h2>
            <ul className="tips-list">
              <li>Close browsers and apps before running the script — some installers need a clean environment.</li>
              <li>The script logs every install. Scroll up in the PowerShell window to review results.</li>
              <li>On a brand-new PC, run Windows Update first so system components are current.</li>
              <li>If PowerShell says "script is not digitally signed," run <code>Set-ExecutionPolicy RemoteSigned</code> in an admin PowerShell session first.</li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="help-section">
            <h2 className="help-section-title">Frequently asked questions</h2>
            <div className="faq-list">
              {faqs.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </section>

          {/* Still stuck */}
          <section className="help-section help-contact">
            <h2 className="help-section-title">Still need help?</h2>
            <p>If your question isn't answered here, use the <button className="inline-link" onClick={() => window.navigateTo('/request')}>Request an App</button> form to reach us — include as much detail as you can.</p>
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

export default HelpPage;
