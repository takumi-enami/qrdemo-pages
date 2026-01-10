$ErrorActionPreference = "Stop"

Write-Host "=== Generating Japanese UI for src/App.tsx ===" -ForegroundColor Cyan

if (-not $Env:OPENAI_API_KEY) {
  throw "OPENAI_API_KEY is not set in environment variables."
}

New-Item -ItemType Directory -Force -Path "logs" | Out-Null

node tools\request_openai.cjs requests\app_ja.json logs\app_ja.response.json
if ($LASTEXITCODE -ne 0) { throw "request_openai failed with exit code $LASTEXITCODE" }

if (-not (Test-Path "logs\app_ja.response.json")) {
  throw "OpenAI response file was not created: logs\app_ja.response.json"
}

node tools\extract_output_text.cjs logs\app_ja.response.json src\App.tsx
if ($LASTEXITCODE -ne 0) { throw "extract_output_text failed with exit code $LASTEXITCODE" }

Write-Host "OK: src/App.tsx updated (Japanese UI)" -ForegroundColor Green

