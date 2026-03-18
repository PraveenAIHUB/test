<#
Diagnostic script to locate Oracle Instant Client on Windows.
Run from anywhere to check if the client is findable by node-oracledb.
#>

Write-Host "Checking Oracle Instant Client location..." -ForegroundColor Cyan

# Check PATH environment variable
$pathDirs = $env:PATH -split ';' | Where-Object { $_ }
Write-Host "Searching PATH directories for Oracle client libraries..." -ForegroundColor Yellow
$foundDirs = @()
foreach ($dir in $pathDirs) {
  if (Test-Path $dir) {
    $oracleDlls = Get-ChildItem -Path $dir -Filter "oci.dll" -ErrorAction SilentlyContinue
    if ($oracleDlls) {
      Write-Host "✅ Found oci.dll in: $dir" -ForegroundColor Green
      $foundDirs += $dir
    }
  }
}

if ($foundDirs.Count -eq 0) {
  Write-Host "❌ oci.dll not found in PATH" -ForegroundColor Red
  Write-Host "Please download Oracle Instant Client from:" -ForegroundColor Yellow
  Write-Host "   https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html" -ForegroundColor Yellow
  Write-Host "Extract it and add the folder to your PATH in System Environment Variables." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Checking if node-oracledb can detect the client..." -ForegroundColor Cyan
$clientCheck = & node -e "const o=require('oracledb'); console.log(JSON.stringify({version: o.oracleClientVersionString || o.oracleClientVersion || null, versionTuple: o.oracleClientVersion, libDir: o.oracleClientLibDir || 'unknown'}, null, 2))" 2>&1

Write-Host $clientCheck

if ($clientCheck -match '"version": null' -or $clientCheck -match '"version":null') {
  Write-Host ""
  Write-Host "⚠️  node-oracledb still cannot find the client. Trying workarounds:" -ForegroundColor Yellow
  Write-Host ""
  if ($foundDirs.Count -gt 0) {
    $libDir = $foundDirs[0]
    Write-Host "Try setting this environment variable before running Node:" -ForegroundColor Cyan
    Write-Host "  `$env:LD_LIBRARY_PATH='$libDir'" -ForegroundColor White
    Write-Host ""
    Write-Host "Then re-run the test from the project root:" -ForegroundColor Cyan
    Write-Host "  `$env:DB_ORACLE_LIB_DIR='$libDir'" -ForegroundColor White
    Write-Host "  .\backend\scripts\db-debug-from-env.ps1 -TestConnection" -ForegroundColor White
  }
} else {
  Write-Host ""
  Write-Host "✅ node-oracledb client found! You can now test the DB connection." -ForegroundColor Green
}
