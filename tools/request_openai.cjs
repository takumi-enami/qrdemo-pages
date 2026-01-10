const { spawnSync } = require("child_process");
const fs = require("fs");

const requestPath = process.argv[2];
const outputPath = process.argv[3];

if (!requestPath || !outputPath) {
  console.error("Usage: node tools/request_openai.cjs <request.json> <out.json>");
  process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in environment variables.");
  process.exit(1);
}

if (!fs.existsSync(requestPath)) {
  console.error(`Request file not found: ${requestPath}`);
  process.exit(1);
}

const args = [
  "https://api.openai.com/v1/responses",
  "-H",
  `Authorization: Bearer ${apiKey}`,
  "-H",
  "Content-Type: application/json",
  "--data-binary",
  `@${requestPath}`,
  "-o",
  outputPath,
];

const r = spawnSync("curl.exe", args, { stdio: "inherit", shell: false });
process.exit(r.status ?? 1);
