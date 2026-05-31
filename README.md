# NixInstall - Windows App Installer

Automate Windows app installation. Select apps, download a PowerShell script, and install everything with one command.

**Live at:** [NixInstall.com](https://nixinstall.com)

## Features

- 🎯 30+ popular Windows apps pre-configured
- 📊 Browse apps by category
- 🔍 Search functionality
- 💾 Download custom PowerShell installation scripts
- 🎨 Clean, modern UI
- 🌐 Browser-compatible
- 🔒 Admin privilege checking in generated scripts

## Project Structure

```
installer-mvp/
├── backend/
│   ├── server.js          # Express server
│   ├── apps.json          # App configurations
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html     # HTML template
    ├── src/
    │   ├── App.js         # Main React component
    │   ├── App.css        # Styling
    │   ├── index.js       # React entry point
    │   └── index.css      # Base CSS
    └── package.json
```

## Local Development

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Windows (for testing installation scripts)

### Setup Backend

```bash
cd backend
npm install
npm start
```

The server will start on `http://localhost:5000`

### Setup Frontend

In a new terminal:

```bash
cd frontend
npm install
npm start
```

The React app will open on `http://localhost:3000`

## Production Deployment

### Build Frontend

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `frontend/build` directory.

### Deploy to Cloud (Examples)

#### Option 1: Heroku
```bash
# Install Heroku CLI and login
heroku login

# Create a new app
heroku create your-app-name

# Deploy
git push heroku main
```

Update your `Procfile`:
```
web: cd backend && npm start
```

#### Option 2: Vercel (Frontend) + Any Node Host (Backend)

**Frontend to Vercel:**
```bash
npm install -g vercel
cd frontend
vercel
```

**Backend to Railway, Render, or similar:**
- Push backend folder to Git
- Connect to your hosting service
- Set environment variables (if needed)

#### Option 3: Docker Deployment

Create a `Dockerfile` in the root directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Build frontend
COPY frontend/package*.json ./frontend/
COPY frontend ./frontend
RUN cd frontend && npm ci && npm run build

# Copy backend
COPY backend ./backend

EXPOSE 5000
CMD ["node", "backend/server.js"]
```

Build and run:
```bash
docker build -t app-installer .
docker run -p 5000:5000 app-installer
```

### Environment Variables

For production, set:
```bash
NODE_ENV=production
PORT=5000
```

## Configuration

### Adding More Apps

Edit `backend/apps.json`:

```json
{
  "id": "app-id",
  "name": "App Name",
  "category": "Category Name",
  "url": "https://download-url.com/installer.exe",
  "type": "exe",
  "args": "/silent /install"
}
```

**Supported types:**
- `exe` - Windows executable
- `msi` - Windows installer
- `zip` - ZIP archive (will be extracted)

## Generated PowerShell Script Features

The generated installation script:
- ✅ Checks for administrator privileges
- ✅ Creates a timestamped download directory
- ✅ Downloads all selected apps
- ✅ Executes installers with appropriate arguments
- ✅ Provides detailed progress information
- ✅ Handles errors gracefully
- ✅ Preserves downloaded files for reference

### Running the Script

```powershell
# Right-click PowerShell → "Run as Administrator"
# Navigate to the script location
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\install-apps.ps1
```

## Browser Compatibility

- Chrome/Chromium (v90+)
- Firefox (v88+)
- Safari (v14+)
- Edge (v90+)

## API Endpoints

### GET `/api/apps`
Returns all available apps:
```json
[
  {
    "id": "chrome",
    "name": "Google Chrome",
    "category": "Browser",
    "url": "https://...",
    "type": "exe",
    "args": "..."
  }
]
```

### GET `/api/categories`
Returns array of unique categories:
```json
["Browser", "Developer", "Utilities", ...]
```

### POST `/api/generate-script`
Generates and downloads a PowerShell script.

**Request:**
```json
{
  "appIds": ["chrome", "vscode", "git"]
}
```

**Response:** PowerShell script file (`.ps1`)

## Roadmap

**Phase 2:**
- User accounts / saved profiles
- Installation history tracking
- Custom app submissions
- Installer verification (checksums)
- Speed optimization with parallel downloads
- Progress webhooks for monitoring

**Phase 3:**
- Admin panel for managing apps
- Analytics dashboard
- Uninstall scripts
- System configuration management
- License compliance checking

## Security Considerations

- Scripts are generated client-side initially (can be moved to backend)
- Downloaded files should be verified with checksums
- Admin privileges required for script execution (built in)
- URLs are publicly visible in the script (consider obfuscation for sensitive tools)

## Troubleshooting

### Script won't run
```powershell
# Check execution policy
Get-ExecutionPolicy
# Temporarily bypass
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Installation fails
- Ensure running as Administrator
- Check Windows Defender/antivirus isn't blocking downloads
- Verify internet connection
- Check individual app URLs are still active

## License

Open source - feel free to modify and deploy

## Support

For issues or questions, open a GitHub issue or contact the maintainers.
