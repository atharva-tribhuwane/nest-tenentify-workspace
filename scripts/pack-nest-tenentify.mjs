import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const srcPkgDir = path.join(repoRoot, "libs", "nest-tenentify");
const distDir = path.join(repoRoot, "dist", "libs", "nest-tenentify");

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const srcPkgJson = path.join(srcPkgDir, "package.json");
  const srcReadme = path.join(srcPkgDir, "README.md");
  const rootLicense = path.join(repoRoot, "LICENSE");

  if (!(await fileExists(distDir))) {
    throw new Error(`Missing build output folder: ${distDir}. Run build first.`);
  }

  await fs.copyFile(srcPkgJson, path.join(distDir, "package.json"));

  if (await fileExists(srcReadme)) {
    await fs.copyFile(srcReadme, path.join(distDir, "README.md"));
  }

  if (await fileExists(rootLicense)) {
    await fs.copyFile(rootLicense, path.join(distDir, "LICENSE"));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

