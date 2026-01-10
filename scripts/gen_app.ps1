$ErrorActionPreference = "Stop"

Write-Host "=== Generating src/App.tsx via OpenAI API ===" -ForegroundColor Cyan

# 1) Call OpenAI API using the prepared request JSON
node tools\request_openai.cjs `
  requests\app.json `
  logs\app.response.json

# 2) Extract output_text and write src/App.tsx
node tools\extract_output_text.cjs `
  logs\app.response.json `
  src\App.tsx

Write-Host "OK: src/App.tsx generated" -ForegroundColor Green
