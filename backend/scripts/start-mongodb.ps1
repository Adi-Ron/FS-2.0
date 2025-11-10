# PowerShell script to start MongoDB if not running
# This can be used as a pre-dev script

$ErrorActionPreference = "Continue"

# First, check if mongod is already running
$mongodProcess = Get-Process -Name mongod -ErrorAction SilentlyContinue
if ($mongodProcess) {
    Write-Host "MongoDB (mongod) is already running" -ForegroundColor Green
    exit 0
}

$serviceName = "MongoDB"
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

# Try to start MongoDB service if it exists
$serviceStarted = $false
if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "MongoDB service is already running" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Attempting to start MongoDB service..." -ForegroundColor Yellow
        try {
            # Try to start the service - this may require admin privileges
            Start-Service -Name $serviceName -ErrorAction Stop
            Start-Sleep -Seconds 2
            # Verify the service actually started
            $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
            if ($service -and $service.Status -eq "Running") {
                Write-Host "MongoDB service started successfully" -ForegroundColor Green
                exit 0
            } else {
                Write-Host "Service start command succeeded but service is not running" -ForegroundColor Yellow
                Write-Host "Falling back to starting mongod directly..." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "Could not start MongoDB service: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "This may require admin privileges. Falling back to starting mongod directly..." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "MongoDB service not found. Starting mongod directly..." -ForegroundColor Yellow
}

# Fallback: Start mongod directly
$dbPath = "C:\data\db"
if (-not (Test-Path $dbPath)) {
    Write-Host "Creating data directory: $dbPath" -ForegroundColor Yellow
    try {
        New-Item -ItemType Directory -Path $dbPath -Force | Out-Null
        Write-Host "Data directory created successfully" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Could not create data directory: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "MongoDB may fail to start if the directory doesn't exist." -ForegroundColor Yellow
    }
}

$mongodPath = Get-Command mongod -ErrorAction SilentlyContinue
if ($mongodPath) {
    Write-Host "Starting MongoDB (mongod) in background..." -ForegroundColor Yellow
    try {
        # Start mongod in the background
        $process = Start-Process -FilePath $mongodPath.Source -ArgumentList "--dbpath", "`"$dbPath`"" -WindowStyle Hidden -PassThru -ErrorAction Stop
        Write-Host "MongoDB process started (PID: $($process.Id))" -ForegroundColor Green
        Write-Host "Waiting for MongoDB to initialize (this may take a few seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Verify it's still running
        $checkProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
        if ($checkProcess) {
            Write-Host "MongoDB is running successfully" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "Warning: MongoDB process may have exited. Please check the logs or start manually." -ForegroundColor Yellow
            Write-Host "Try running: mongod --dbpath `"$dbPath`"" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "ERROR: Failed to start MongoDB: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please start MongoDB manually: mongod --dbpath `"$dbPath`"" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "ERROR: MongoDB (mongod) not found in PATH!" -ForegroundColor Red
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Install MongoDB" -ForegroundColor Yellow
    Write-Host "  2. Add MongoDB to your PATH" -ForegroundColor Yellow
    Write-Host "  3. OR run manually: mongod --dbpath `"$dbPath`"" -ForegroundColor Yellow
    exit 1
}
