import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pinecone } from "@pinecone-database/pinecone";

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

const apiKey = process.env.PINECONE_API_KEY?.trim();
const indexName = process.env.PINECONE_INDEX_NAME?.trim();
const dimensions = Number.parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS || "1536", 10);
const cloud = process.env.PINECONE_CLOUD?.trim() || "aws";
const region = process.env.PINECONE_REGION?.trim() || "us-east-1";

if (!apiKey || !indexName) {
  console.error("Missing PINECONE_API_KEY or PINECONE_INDEX_NAME in .env.local");
  process.exit(1);
}

const pc = new Pinecone({ apiKey });

async function waitUntilReady(name) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const description = await pc.describeIndex(name);

    if (description.status?.ready) {
      return description;
    }

    console.log(`Waiting for index "${name}" to be ready...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error(`Index "${name}" was created but is not ready yet. Try again in a minute.`);
}

async function main() {
  try {
    const existing = await pc.describeIndex(indexName);
    console.log(`Index "${indexName}" already exists.`);
    console.log(`Status: ${existing.status?.state ?? "unknown"}`);
    console.log(`Host: ${existing.host}`);
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes("404") && !message.toLowerCase().includes("not found")) {
      throw error;
    }
  }

  console.log(`Creating Pinecone index "${indexName}" (${dimensions} dimensions, cosine)...`);

  await pc.createIndex({
    name: indexName,
    dimension: dimensions,
    metric: "cosine",
    spec: {
      serverless: {
        cloud,
        region,
      },
    },
    waitUntilReady: true,
  });

  const ready = await waitUntilReady(indexName);
  console.log(`Index "${indexName}" is ready.`);
  console.log(`Host: ${ready.host}`);
}

main().catch((error) => {
  console.error("Pinecone setup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
