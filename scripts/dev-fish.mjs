import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function statMtimeMs(filePath) {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

const rootDir = process.cwd();
const fishDir = path.join(rootDir, "server-fish");
const venvDir = path.join(fishDir, ".venv");
const venvPython =
  process.platform === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python");
const requirementsFile = path.join(fishDir, "requirements.txt");
const installedStamp = path.join(venvDir, ".installed");

if (process.argv.includes("--print")) {
  console.log(JSON.stringify({ fishDir, venvPython, requirementsFile }, null, 2));
  process.exit(0);
}

if (!exists(fishDir)) {
  console.error("未找到 server-fish 目录。");
  process.exit(1);
}

async function main() {
  if (!exists(venvPython)) {
    await run("python", ["-m", "venv", venvDir], { cwd: fishDir });
  }

  const shouldInstall =
    !exists(installedStamp) ||
    statMtimeMs(requirementsFile) > statMtimeMs(installedStamp);

  if (shouldInstall && !process.env.SKIP_FISH_INSTALL) {
    await run(venvPython, ["-m", "pip", "install", "-r", requirementsFile], { cwd: fishDir });
    fs.writeFileSync(installedStamp, String(Date.now()), "utf8");
  }

  const child = spawn(venvPython, ["-m", "src.app"], { cwd: fishDir, stdio: "inherit" });
  const forward = (signal) => {
    try {
      child.kill(signal);
    } catch {
    }
  };
  process.on("SIGINT", () => forward("SIGINT"));
  process.on("SIGTERM", () => forward("SIGTERM"));

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err?.message || String(err));
  process.exit(1);
});

