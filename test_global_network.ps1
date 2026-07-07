$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# Reuse the canonical Node.js integration suite.
node .\test-global-network.js
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
