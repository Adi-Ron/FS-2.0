# PowerShell script to install MongoDB as a Windows Service
# Run this script as Administrator

Write-Host "Installing MongoDB as a Windows Service..." -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Find MongoDB installation path
$mongodPath = Get-Command mongod -ErrorAction SilentlyContinue
if (-not $mongodPath) {
    Write-Host "ERROR: MongoDB (mongod) not found in PATH!" -ForegroundColor Red
    Write-Host "Please ensure MongoDB is installed and added to PATH" -ForegroundColor Yellow
    exit 1
}

$mongodExe = $mongodPath.Source
Write-Host "Found MongoDB at: $mongodExe" -ForegroundColor Green

# Default data directory
$dbPath = "C:\data\db"
if (-not (Test-Path $dbPath)) {
    Write-Host "Creating data directory: $dbPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $dbPath -Force | Out-Null
}

# Default log directory
$logPath = "C:\data\log"
if (-not (Test-Path $logPath)) {
    Write-Host "Creating log directory: $logPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $logPath -Force | Out-Null
}

# Check if service already exists
$existingService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "MongoDB service already exists. Removing old service..." -ForegroundColor Yellow
    Stop-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    sc.exe delete MongoDB | Out-Null
    Start-Sleep -Seconds 2
}

# Install MongoDB as a Windows Service
Write-Host "Installing MongoDB service..." -ForegroundColor Cyan
$serviceArgs = "--dbpath `"$dbPath`" --logpath `"$logPath\mongod.log`" --install"

try {
    & $mongodExe $serviceArgs.Split(' ')
    
    # Configure service to start automatically
    Write-Host "Configuring service to start automatically..." -ForegroundColor Cyan
    sc.exe config MongoDB start= auto | Out-Null
    
    # Start the service
    Write-Host "Starting MongoDB service..." -ForegroundColor Cyan
    Start-Service -Name "MongoDB"
    
    Write-Host "`n✅ MongoDB service installed and started successfully!" -ForegroundColor Green
    Write-Host "Service will now start automatically on system boot." -ForegroundColor Green
    Write-Host "`nTo verify, run: Get-Service -Name MongoDB" -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR: Failed to install MongoDB service" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}



