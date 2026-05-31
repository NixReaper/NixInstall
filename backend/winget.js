'use strict';
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Cache ─────────────────────────────────────────────────────────
const CACHE_FILE = path.join(__dirname, 'winget-cache.json');
const CACHE_TTL  = 60 * 60 * 1000; // 1 hour

let cache = {};
try {
  if (fs.existsSync(CACHE_FILE)) cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
} catch {}

function saveCache() {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2)); } catch {}
}

// ── Winget ID map ─────────────────────────────────────────────────
const WINGET_IDS = {
  chrome:          'Google.Chrome',
  firefox:         'Mozilla.Firefox',
  brave:           'Brave.Brave',
  opera:           'Opera.Opera',
  vivaldi:         'VivaldiTechnologies.Vivaldi',
  zoom:            'Zoom.Zoom',
  discord:         'Discord.Discord',
  teams:           'Microsoft.Teams',
  slack:           'SlackTechnologies.Slack',
  thunderbird:     'Mozilla.Thunderbird',
  vlc:             'VideoLAN.VLC',
  spotify:         'Spotify.Spotify',
  audacity:        'Audacity.Audacity',
  handbrake:       'HandBrake.HandBrake',
  obs:             'OBSProject.OBSStudio',
  gimp:            'GIMP.GIMP',
  krita:           'KDE.Krita',
  blender:         'BlenderFoundation.Blender',
  paintdotnet:     'dotPDN.PaintDotNet',
  inkscape:        'Inkscape.Inkscape',
  irfanview:       'IrfanSkiljan.IrfanView',
  greenshot:       'Greenshot.Greenshot',
  sharex:          'ShareX.ShareX',
  libreoffice:     'TheDocumentFoundation.LibreOffice',
  sumatrapdf:      'SumatraPDF.SumatraPDF',
  malwarebytes:    'Malwarebytes.Malwarebytes',
  keepass:         'DominikReichl.KeePass',
  dropbox:         'Dropbox.Dropbox',
  googledrive:     'Google.GoogleDrive',
  qbittorrent:     'qBittorrent.qBittorrent',
  vscode:          'Microsoft.VisualStudioCode',
  python3:         'Python.Python.3.12',
  git:             'Git.Git',
  nodejs:          'OpenJS.NodeJS.LTS',
  notepadplusplus: 'Notepad++.Notepad++',
  filezilla:       'TimKosse.FileZilla.Client',
  winscp:          'WinSCP.WinSCP',
  putty:           'PuTTY.PuTTY',
  docker:          'Docker.DockerDesktop',
  '7zip':          '7zip.7zip',
  winrar:          'RARLab.WinRAR',
  peazip:          'GiorgioDal.PeaZip',
  teamviewer:      'TeamViewer.TeamViewer',
  anydesk:         'AnyDeskSoftwareGmbH.AnyDesk',
  ccleaner:        'Piriform.CCleaner',
  everything:      'voidtools.Everything',
  powertoys:       'Microsoft.PowerToys',
  steam:           'Valve.Steam',
  epicgames:       'EpicGames.EpicGamesLauncher',
  evernote:        'Evernote.Evernote',
};

// ── HTTP helper ───────────────────────────────────────────────────
function httpsGet(url, timeout = 12000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);
    const headers = { 'User-Agent': 'NixInstall-UpdateChecker/1.0' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

    https.get(url, { headers }, (res) => {
      clearTimeout(timer);
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location, timeout).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', e => { clearTimeout(timer); reject(e); });
  });
}

// ── Version comparison ────────────────────────────────────────────
function compareVersions(a, b) {
  const pa = String(a).split('.').map(x => parseInt(x) || 0);
  const pb = String(b).split('.').map(x => parseInt(x) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

// ── YAML installer parser ─────────────────────────────────────────
function parseInstallerYaml(yaml) {
  const lines = yaml.split('\n');
  const installers = [];
  let current   = null;
  let inSection = false;
  let globalUrl = null;
  let globalType = null;

  for (const raw of lines) {
    const line = raw.trim();

    if (!inSection) {
      const m = line.match(/^InstallerUrl:\s*(.+)/);
      if (m) globalUrl = m[1].trim();
      const t = line.match(/^InstallerType:\s*(.+)/);
      if (t) globalType = t[1].trim().toLowerCase();
    }

    if (line === 'Installers:') { inSection = true; continue; }
    if (!inSection) continue;

    if (/^-\s*Architecture:/.test(line)) {
      if (current) installers.push(current);
      current = { arch: line.replace(/^-\s*Architecture:\s*/, '').trim().toLowerCase() };
    } else if (current) {
      const u = line.match(/^InstallerUrl:\s*(.+)/);
      if (u) current.url = u[1].trim();
      const t = line.match(/^InstallerType:\s*(.+)/);
      if (t) current.type = t[1].trim().toLowerCase();
    }
  }
  if (current) installers.push(current);

  const pick = installers.find(i => i.arch === 'x64') ||
               installers.find(i => i.arch === 'x86_64') ||
               installers[0];

  if (pick?.url)  return { url: pick.url,  type: pick.type  || globalType };
  if (globalUrl)  return { url: globalUrl, type: globalType };
  return null;
}

// ── Main export: get latest info for one package ──────────────────
async function getLatestWingetInfo(wingetId) {
  const cached = cache[wingetId];
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const parts   = wingetId.split('.');
  const first   = parts[0][0].toLowerCase();
  const dirPath = parts.join('/');

  const apiUrl = `https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/${first}/${dirPath}`;
  const rawBase = `https://raw.githubusercontent.com/microsoft/winget-pkgs/master/manifests/${first}/${dirPath}`;

  const entries  = JSON.parse(await httpsGet(apiUrl));
  const versions = entries
    .filter(e => e.type === 'dir')
    .map(e => e.name)
    .sort((a, b) => compareVersions(b, a));

  if (!versions.length) throw new Error(`No versions for ${wingetId}`);
  const latest = versions[0];

  const yaml      = await httpsGet(`${rawBase}/${latest}/${wingetId}.installer.yaml`);
  const installer = parseInstallerYaml(yaml);
  if (!installer) throw new Error(`No installer URL for ${wingetId}`);

  const result = { version: latest, url: installer.url, type: installer.type };
  cache[wingetId] = { ts: Date.now(), data: result };
  saveCache();
  return result;
}

// ── Check all apps concurrently ───────────────────────────────────
async function checkAllUpdates(apps) {
  const BATCH = 8;
  const results = [];

  for (let i = 0; i < apps.length; i += BATCH) {
    const settled = await Promise.allSettled(
      apps.slice(i, i + BATCH).map(async app => {
        const wid = WINGET_IDS[app.id];
        if (!wid) return null;
        const info = await getLatestWingetInfo(wid);
        if (info.url && info.url !== app.url) {
          return { id: app.id, name: app.name, newUrl: info.url, newVersion: info.version, newType: info.type };
        }
        return null;
      })
    );
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
  }
  return results;
}

module.exports = { WINGET_IDS, getLatestWingetInfo, checkAllUpdates };
