$ErrorActionPreference = "Stop"

Write-Host "=== Updating src/App.tsx (centered full-width content inside Layout card) ===" -ForegroundColor Cyan

if (-not $Env:OPENAI_API_KEY) {
  throw "OPENAI_API_KEY is not set in environment variables."
}

New-Item -ItemType Directory -Force -Path "logs" | Out-Null

node tools\request_openai.cjs requests\app_center.json logs\app_center.response.json
if ($LASTEXITCODE -ne 0) { throw "request_openai failed with exit code $LASTEXITCODE" }

node tools\extract_output_text.cjs logs\app_center.response.json src\App.tsx
if ($LASTEXITCODE -ne 0) { throw "extract_output_text failed with exit code $LASTEXITCODE" }

Write-Host "OK: src/App.tsx updated (center/full-width)" -ForegroundColor Green
