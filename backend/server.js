require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Load apps configuration (mutable in memory, persisted on write)
let appsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps.json'), 'utf8'));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ── Public API ────────────────────────────────────────────────────

app.get('/api/apps', (req, res) => {
  res.json(appsData.apps);
});

app.get('/api/categories', (req, res) => {
  const categories = [...new Set(appsData.apps.map(app => app.category))].sort();
  res.json(categories);
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

  appsData.apps[appIndex] = {
    id: req.params.id,
    name: name || appsData.apps[appIndex].name,
    category: category || appsData.apps[appIndex].category,
    url: url || appsData.apps[appIndex].url,
    type: type || appsData.apps[appIndex].type,
    args: args !== undefined ? args : appsData.apps[appIndex].args,
  };

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
          <h2 style="color: #0ea5e9;">New App Request — NixInstall</h2>
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

// ── Fallback to React app ─────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
