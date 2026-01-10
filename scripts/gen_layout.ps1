$ErrorActionPreference = "Stop"

node tools\request_openai.cjs requests\layout.json logs\layout.response.json
node tools\extract_output_text.cjs logs\layout.response.json src\Layout.tsx
node tools\patch_layout_imports.cjs src\Layout.tsx

Write-Host "OK: generated src/Layout.tsx" -ForegroundColor Green
