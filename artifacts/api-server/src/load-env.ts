import fs from "node:fs";
import path from "node:path";

const workspaceRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const envFiles = [".env.local", ".env"];

for (const file of envFiles) {
  const absolutePath = path.join(workspaceRoot, file);

  if (fs.existsSync(absolutePath)) {
    process.loadEnvFile(absolutePath);
  }
}
