const fs = require("fs");

const path = process.argv[2] || "src/Layout.tsx";
let t = fs.readFileSync(path, "utf8");

// import React, { ... } from "react";  → import { ..., ReactNode } from "react";
t = t.replace(
  /^import\s+React,\s*\{\s*([^}]*)\}\s+from\s+"react";\s*$/m,
  (m, g) => {
    const parts = g
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.includes("ReactNode")) parts.push("ReactNode");
    return `import { ${parts.join(", ")} } from "react";`;
  }
);

// React.ReactNode → ReactNode
t = t.replace(/React\.ReactNode/g, "ReactNode");

fs.writeFileSync(path, t, "utf8");
console.log(`Patched ${path}`);
