require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Winget updater (optional — fails gracefully if unavailable)
let winget = null;
try { winget = require('./winget'); } catch (e) { console.warn('winget.js not loaded:', e.message); }

const app = express();

app.use(cors());
app.use(express.json());

// Load apps configuration (mutable in memory, persisted on write)
let appsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps.json'), 'utf8'));

// Load news data
const NEWS_FILE = path.join(__dirname, 'news.json');
let newsData = { items: [] };
try { newsData = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8')); } catch {}

function saveNews() {
  fs.writeFileSync(NEWS_FILE, JSON.stringify(newsData, null, 2));
}

function addNewsItem(type, title, appId = null) {
  const item = { id: Date.now().toString(), type, title, date: new Date().toISOString() };
  if (appId) item.appId = appId;
  newsData.items.unshift(item);
  // Keep max 100 items
  if (newsData.items.length > 100) newsData.items = newsData.items.slice(0, 100);
  saveNews();
  return item;
}

// Serve static files from frontend build (when deployed via cPanel)
const frontendBuildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
}

// ── Health check ─────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Public API ────────────────────────────────────────────────────

app.get('/api/apps', (req, res) => {
  res.json(appsData.apps);
});

app.get('/api/categories', (req, res) => {
  const categories = [...new Set(appsData.apps.map(app => app.category))].sort();
  res.json(categories);
});

app.get('/api/news', (req, res) => {
  res.json(newsData.items.slice(0, 20));
});

app.post('/api/generate-script', (req, res) => {
  const { appIds } = req.body;

  if (!appIds || !Array.isArray(appIds) || appIds.length === 0) {
    return res.status(400).json({ error: 'No apps selected' });
  }

  const selectedApps = appsData.apps.filter(app => appIds.includes(app.id));

  if (selectedApps.length === 0) {
    return res.status(400).json({ error: 'Invalid app IDs' });
  }

  const script = generatePowerShellScript(selectedApps);

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="nixinstall.ps1"');
  res.send(script);
});

function generatePowerShellScript(apps) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const downloadDir = `C:\\Users\\%USERNAME%\\Downloads\\AppInstaller-${timestamp}`;

  let script = `# Auto-generated installation script
# Generated: ${new Date().toISOString()}
# Selected apps: ${apps.map(a => a.name).join(', ')}

# Check if running as administrator
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "This script requires administrator privileges. Please run as administrator."
    exit 1
}

# Create download directory
$downloadDir = "${downloadDir}"
if (-not (Test-Path $downloadDir)) {
    New-Item -ItemType Directory -Path $downloadDir | Out-Null
    Write-Host "Created directory: $downloadDir"
}

# Set progress preference
$ProgressPreference = 'SilentlyContinue'

Write-Host "Starting app installation..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

`;

  apps.forEach((app, index) => {
    const filename = path.basename(app.url.split('?')[0]) || `${app.id}.${app.type}`;
    const filepath = `\$downloadDir\\${filename}`;

    script += `
# ${index + 1}. Installing ${app.name}
Write-Host "Installing ${app.name}..." -ForegroundColor Cyan
\$url = "${app.url}"
\$filepath = "${filepath}"

try {
    Write-Host "  Downloading..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri \$url -OutFile \$filepath -ErrorAction Stop
    Write-Host "  Downloaded to: \$filepath" -ForegroundColor Green

    Write-Host "  Installing..." -ForegroundColor Yellow
`;

    if (app.type === 'msi') {
      script += `    Start-Process msiexec.exe -ArgumentList "/i \`"\$filepath\`" ${app.args}" -Wait -NoNewWindow\n`;
    } else if (app.type === 'exe') {
      script += `    Start-Process "\$filepath" -ArgumentList "${app.args}" -Wait -NoNewWindow\n`;
    } else if (app.type === 'zip') {
      script += `    Expand-Archive -Path \$filepath -DestinationPath "\$downloadDir\\${app.id}" -Force
    Write-Host "  Extracted to: \$downloadDir\\${app.id}" -ForegroundColor Green\n`;
    }

    script += `    Write-Host "  + ${app.name} installed successfully" -ForegroundColor Green
} catch {
    Write-Host "  - Failed to install ${app.name}: \$_" -ForegroundColor Red
}

`;
  });

  script += `
Write-Host "======================================" -ForegroundColor Green
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "Downloaded files saved to: $downloadDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now delete the installer files if desired."
Write-Host ""
pause
`;

  return script;
}

// ── App Request ───────────────────────────────────────────────────

app.post('/api/request-app', async (req, res) => {
  const { appName, appUrl, category, reason, requesterEmail } = req.body;

  if (!appName || !appName.trim()) {
    return res.status(400).json({ error: 'App name is required' });
  }

  try {
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"NixInstall" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || 'kris.parish@icloud.com',
      subject: `App Request: ${appName.trim()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">New App Request - NixInstall</h2>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold; color: #555;">App Name</td><td style="padding: 8px;">${appName.trim()}</td></tr>
            ${appUrl ? `<tr><td style="padding: 8px; font-weight: bold; color: #555;">Website</td><td style="padding: 8px;"><a href="${appUrl}">${appUrl}</a></td></tr>` : ''}
            ${category ? `<tr><td style="padding: 8px; font-weight: bold; color: #555;">Category</td><td style="padding: 8px;">${category}</td></tr>` : ''}
            ${reason ? `<tr><td style="padding: 8px; font-weight: bold; color: #555;">Reason</td><td style="padding: 8px;">${reason}</td></tr>` : ''}
            ${requesterEmail ? `<tr><td style="padding: 8px; font-weight: bold; color: #555;">From</td><td style="padding: 8px;">${requesterEmail}</td></tr>` : ''}
          </table>
          <hr style="margin: 24px 0; border-color: #eee;">
          <p style="color: #999; font-size: 12px;">Sent from nixinstall.com</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send request. Please try again later.' });
  }
});

// ── Admin auth middleware ─────────────────────────────────────────

function requireAuth(req, res, next) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const expectedToken = crypto.createHash('sha256').update(adminPassword).digest('hex');

  if (token !== expectedToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
}

// ── Admin API ─────────────────────────────────────────────────────

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === adminPassword) {
    const token = crypto.createHash('sha256').update(adminPassword).digest('hex');
    res.json({ token, success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/admin/stats', requireAuth, (req, res) => {
  const categories = [...new Set(appsData.apps.map(app => app.category))];
  res.json({
    totalApps: appsData.apps.length,
    totalCategories: categories.length,
    categories,
    lastUpdated: new Date().toISOString(),
  });
});

app.get('/admin/apps', requireAuth, (req, res) => {
  res.json(appsData.apps);
});

app.post('/admin/apps', requireAuth, (req, res) => {
  const { id, name, category, url, type, args } = req.body;

  if (!id || !name || !category || !url || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (appsData.apps.find(app => app.id === id)) {
    return res.status(400).json({ error: 'App ID already exists' });
  }

  const newApp = { id, name, category, url, type, args: args || '' };
  appsData.apps.push(newApp);
  fs.writeFileSync(path.join(__dirname, 'apps.json'), JSON.stringify(appsData, null, 2));

  res.json({ success: true, app: newApp });
});

app.put('/admin/apps/:id', requireAuth, (req, res) => {
  const { name, category, url, type, args } = req.body;
  const appIndex = appsData.apps.findIndex(app => app.id === req.params.id);

  if (appIndex === -1) {
    return res.status(404).json({ error: 'App not found' });
  }

  const oldUrl = appsData.apps[appIndex].url;
  appsData.apps[appIndex] = {
    id: req.params.id,
    name: name || appsData.apps[appIndex].name,
    category: category || appsData.apps[appIndex].category,
    url: url || appsData.apps[appIndex].url,
    type: type || appsData.apps[appIndex].type,
    args: args !== undefined ? args : appsData.apps[appIndex].args,
  };

  // Auto-create news item when download URL changes
  if (url && url !== oldUrl) {
    addNewsItem('app_update', `${appsData.apps[appIndex].name} updated`, req.params.id);
  }

  fs.writeFileSync(path.join(__dirname, 'apps.json'), JSON.stringify(appsData, null, 2));
  res.json({ success: true, app: appsData.apps[appIndex] });
});

app.delete('/admin/apps/:id', requireAuth, (req, res) => {
  const appIndex = appsData.apps.findIndex(app => app.id === req.params.id);

  if (appIndex === -1) {
    return res.status(404).json({ error: 'App not found' });
  }

  const deletedApp = appsData.apps.splice(appIndex, 1);
  fs.writeFileSync(path.join(__dirname, 'apps.json'), JSON.stringify(appsData, null, 2));
  res.json({ success: true, app: deletedApp[0] });
});

app.get('/admin/settings', requireAuth, (req, res) => {
  res.json({
    adminPassword: process.env.ADMIN_PASSWORD ? 'SET' : 'admin123',
    updateFrequency: process.env.UPDATE_FREQUENCY || 'on-launch',
  });
});

// ── Admin News ────────────────────────────────────────────────────

app.get('/admin/news', requireAuth, (req, res) => {
  res.json(newsData.items);
});

app.post('/admin/news', requireAuth, (req, res) => {
  const { title, body } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  const item = addNewsItem('manual', title.trim(), null);
  if (body) item.body = body.trim();
  saveNews();
  res.json({ success: true, item });
});

app.delete('/admin/news/:id', requireAuth, (req, res) => {
  const before = newsData.items.length;
  newsData.items = newsData.items.filter(i => i.id !== req.params.id);
  if (newsData.items.length === before) return res.status(404).json({ error: 'Item not found' });
  saveNews();
  res.json({ success: true });
});

// ── Winget Update Check ───────────────────────────────────────────

app.get('/admin/check-updates', requireAuth, async (req, res) => {
  if (!winget) return res.status(503).json({ error: 'Update checker unavailable' });
  try {
    const results = await winget.checkAllUpdates(appsData.apps);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/apply-update/:id', requireAuth, (req, res) => {
  const { newUrl, newVersion, newType } = req.body;
  const appIndex = appsData.apps.findIndex(a => a.id === req.params.id);
  if (appIndex === -1) return res.status(404).json({ error: 'App not found' });

  appsData.apps[appIndex].url = newUrl;
  if (newType) appsData.apps[appIndex].type = newType;
  fs.writeFileSync(path.join(__dirname, 'apps.json'), JSON.stringify(appsData, null, 2));

  addNewsItem('app_update', `${appsData.apps[appIndex].name} updated to v${newVersion}`, req.params.id);

  res.json({ success: true, app: appsData.apps[appIndex] });
});

// ── Fallback to React app ─────────────────────────────────────────

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Serve from public_html root (cPanel deployment)
    const cpanelIndex = path.join(__dirname, '../index.html');
    if (fs.existsSync(cpanelIndex)) {
      res.sendFile(cpanelIndex);
    } else {
      res.status(404).json({ error: 'Frontend not found' });
    }
  }
});

// ── Error handling ────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ──────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`NixInstall Backend running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Loaded ${appsData.apps.length} apps`);
  console.log(`SMTP Host: ${process.env.SMTP_HOST || '(not set)'}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

module.exports = app;
