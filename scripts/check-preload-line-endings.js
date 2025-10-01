import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const electronDir = path.resolve("src-electron");
const candidates = readdirSync(electronDir).filter((file) => file.endsWith(".cjs"));

const issues = [];

for (const file of candidates) {
  const absolutePath = path.join(electronDir, file);
  const content = readFileSync(absolutePath, "utf8");

  if (content.includes("\\\\r\\\\n")) {
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const columnIndex = line.indexOf("\\\\r\\\\n");
      if (columnIndex >= 0) {
        issues.push({
          file: absolutePath,
          line: index + 1,
          column: columnIndex + 1,
          snippet: line.trim().slice(0, 120)
        });
      }
    });
  }
}

if (issues.length > 0) {
  console.error("Pre-build check failed: literal \\\"\\\\r\\\\n\\\" sequences detected. These break Electron sandbox parsing.");
  for (const issue of issues) {
    console.error(`  ${issue.file}:${issue.line}:${issue.column} -> ${issue.snippet}`);
  }
  console.error("Replace literal \\\"\\\\r\\\\n\\\" with real newlines before packaging.");
  process.exit(1);
}

console.log("Pre-build check passed: no literal \\\"\\\\r\\\\n\\\" sequences found in src-electron .cjs files.");