import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFile(filename) {
  const filePath = path.join(root, filename);

  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");

    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

async function main() {
  try {
    const hostname = new URL(url).hostname;
    const response = await fetch(`https://${hostname}/rest/v1/`, {
      method: "HEAD",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "check-only",
      },
      signal: AbortSignal.timeout(8_000),
    });

    console.log(`Supabase URL reachable: ${url}`);
    console.log(`HTTP status: ${response.status}`);

    if (response.status === 401 || response.status === 200 || response.status === 404) {
      console.log("Project host resolves. If the dashboard still fails, run: npm run db:migrate");
      return;
    }

    console.warn("Unexpected status — verify API keys in Supabase dashboard.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Supabase check failed:", message);
    console.error("");
    console.error("Your Supabase project URL does not resolve or is inactive.");
    console.error("1. Open https://supabase.com/dashboard");
    console.error("2. Create a new project (or restore the paused one)");
    console.error("3. Update NEXT_PUBLIC_SUPABASE_URL and keys in .env.local");
    console.error("4. Run: npm run db:migrate");
    process.exit(1);
  }
}

main();
