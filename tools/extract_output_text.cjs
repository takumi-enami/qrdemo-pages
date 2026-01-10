const fs = require("fs");

const inPath = process.argv[2];
const outPath = process.argv[3];

if (!inPath || !outPath) {
  console.error("Usage: node tools/extract_output_text.cjs <in.json> <out.txt>");
  process.exit(1);
}

const j = JSON.parse(fs.readFileSync(inPath, "utf8"));

let t = j.output_text || "";
if (!t && Array.isArray(j.output)) {
  const a = [];
  for (const o of j.output) {
    for (const c of o.content || []) {
      if (c.type === "output_text" && c.text) a.push(c.text);
    }
  }
  t = a.join("\n");
}

if (!t.trim()) {
  console.error("No output_text found in response.");
  process.exit(1);
}

fs.writeFileSync(outPath, t, "utf8");
console.log(`Wrote ${outPath}`);
