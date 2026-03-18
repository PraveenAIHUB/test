<#
Reads backend/.env and calls db-debug.ps1 with the extracted values.
Usage:
  From project root:
    .\backend\scripts\db-debug-from-env.ps1            # reads backend/.env and prints debug info
    .\backend\scripts\db-debug-from-env.ps1 -TestConnection  # also attempts a DB connection

The script will prefer `backend/.env`. If missing, it will try `backend/.env.example`.
It does not modify your environment permanently; it invokes the child script which sets env vars for the child node process.
#>

param(
  [switch]$TestConnection
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendDir = Resolve-Path (Join-Path $scriptDir '..')
$envPath = Join-Path $backendDir '.env'
$envExamplePath = Join-Path $backendDir '.env.example'

if (-not (Test-Path $envPath)) {
  if (Test-Path $envExamplePath) {
    Write-Host "No backend/.env found; using backend/.env.example" -ForegroundColor Yellow
    $envPath = $envExamplePath
  } else {
    Write-Host "No backend/.env or backend/.env.example found. Create one first." -ForegroundColor Red
    exit 2
  }
}

Write-Host "Reading env file: $envPath" -ForegroundColor Cyan

$lines = Get-Content $envPath -ErrorAction Stop
$vars = @{}

foreach ($line in $lines) {
  $trim = $line.Trim()
  if ($trim -eq '' -or $trim.StartsWith('#')) { continue }
  if ($trim -notmatch '=') { continue }
  $parts = $trim.Split('=',2)
  $name = $parts[0].Trim()
  $value = $parts[1].Trim()
  # Remove optional surrounding quotes
  if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Substring(1,$value.Length-2) }
  if ($value.StartsWith("'") -and $value.EndsWith("'")) { $value = $value.Substring(1,$value.Length-2) }
  $vars[$name] = $value
}

# Map expected names to parameters for db-debug.ps1
$scriptToCall = Join-Path $scriptDir 'db-debug.ps1'
if (-not (Test-Path $scriptToCall)) {
  Write-Host "Cannot find db-debug.ps1 next to this script: $scriptToCall" -ForegroundColor Red
  exit 3
}

Write-Host "Setting environment variables from $envPath for the child Node process" -ForegroundColor Cyan
foreach ($k in $vars.Keys) {
  # Only set known DBA-related keys to avoid polluting environment
  if ($k -in @('DB_USER','DB_PASSWORD','DB_CONNECTION_STRING','TNS_ADMIN','DB_HOST','DB_PORT','DB_SERVICE')) {
    Write-Host "  $k = $($vars[$k])"
    Set-Item -Path Env:$k -Value $vars[$k]
  }
}

Write-Host "-> Running Node to print sanitized DB debug info..." -ForegroundColor Cyan
$printCmd = "console.log(JSON.stringify(require('./backend/config/database').getDebugInfo(), null, 2))"
$printResult = & node -e $printCmd 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Node command failed:" -ForegroundColor Red
  Write-Host $printResult
  exit $LASTEXITCODE
}

Write-Host $printResult

if ($TestConnection) {
  Write-Host "-> Attempting a test DB connection (this may take a few seconds)..." -ForegroundColor Cyan
  $testCmd = "require('./backend/config/database').initialize().then(()=>{console.log(JSON.stringify({status:'OK'}));process.exit(0)}).catch(e=>{console.error(JSON.stringify({status:'ERROR',message:(e && e.message) ? e.message : String(e)}));process.exit(2)})"
  $testResult = & node -e $testCmd 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Connection test succeeded." -ForegroundColor Green
    Write-Host $testResult
    exit 0
  } else {
    Write-Host "Connection test failed (see output)." -ForegroundColor Red
    Write-Host $testResult
    exit $LASTEXITCODE
  }
} else {
  Write-Host "-> Skipping connection test (use -TestConnection to run it)." -ForegroundColor Yellow
}
