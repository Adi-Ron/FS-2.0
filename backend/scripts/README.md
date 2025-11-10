# MongoDB Setup Scripts

## Problem
MongoDB is not starting automatically, requiring manual `mongod` command before starting the backend.

## Solutions

### Option 1: Install MongoDB as Windows Service (Recommended)
This will make MongoDB start automatically on system boot.

**Run as Administrator:**
```powershell
npm run install-mongo-service
```

Or manually:
```powershell
# Open PowerShell as Administrator
cd backend
powershell -ExecutionPolicy Bypass -File scripts/install-mongodb-service.ps1
```

This will:
- Install MongoDB as a Windows service named "MongoDB"
- Configure it to start automatically on boot
- Set default data directory to `C:\data\db`
- Set default log directory to `C:\data\log`

### Option 2: Auto-start MongoDB before dev server
The `predev` script will automatically start MongoDB before running the dev server.

**Just run:**
```powershell
npm run dev
```

This will:
- Check if MongoDB service is running, start it if not
- If service doesn't exist, start `mongod` directly
- Then start the backend dev server

### Option 3: Skip MongoDB auto-start
If you want to start MongoDB manually:
```powershell
npm run dev:no-mongo
```

## Troubleshooting

### Check MongoDB Service Status
```powershell
Get-Service -Name MongoDB
```

### Start MongoDB Service Manually
```powershell
Start-Service -Name MongoDB
```

### Stop MongoDB Service
```powershell
Stop-Service -Name MongoDB
```

### Check if MongoDB is Running
```powershell
Get-Process -Name mongod
```

### Start MongoDB Manually (if not installed as service)
```powershell
mongod --dbpath "C:\data\db"
```



