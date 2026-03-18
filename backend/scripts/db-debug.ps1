<#
PowerShell helper to print Oracle DB debug info and optionally test a connection.
Run from the project root where the `backend` folder exists.
Usage examples:
  # Print debug info using env vars from this session
  .\backend\scripts\db-debug.ps1 -DB_USER myuser -DB_PASSWORD mypass -DB_CONNECTION_STRING my_tns_alias -TNS_ADMIN D:\path\to\wallet

  # Print debug info then attempt a test connection
  .\backend\scripts\db-debug.ps1 -DB_USER myuser -DB_PASSWORD mypass -DB_CONNECTION_STRING my_tns_alias -TNS_ADMIN D:\path\to\wallet -TestConnection

This script only sets environment variables for the child `node` process and does not persist them.
#>

param(
  [string]$DB_USER,
  [string]$DB_PASSWORD,
  [string]$DB_CONNECTION_STRING,
  [string]$TNS_ADMIN,
  [string]$DB_HOST,
  [string]$DB_PORT,
  [string]$DB_SERVICE,
  [switch]$TestConnection
)

function Set-If($name, $value) {
  if ($null -ne $value -and $value -ne '') { Set-Item -Path Env:$name -Value $value }
}

Set-If -name 'DB_USER' -value $DB_USER
Set-If -name 'DB_PASSWORD' -value $DB_PASSWORD
Set-If -name 'DB_CONNECTION_STRING' -value $DB_CONNECTION_STRING
Set-If -name 'TNS_ADMIN' -value $TNS_ADMIN
Set-If -name 'DB_HOST' -value $DB_HOST
Set-If -name 'DB_PORT' -value $DB_PORT
Set-If -name 'DB_SERVICE' -value $DB_SERVICE

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
