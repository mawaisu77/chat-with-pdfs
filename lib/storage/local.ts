import fs from "fs/promises";
import path from "path";

import { env } from "@/lib/env";
import { RAGError } from "@/lib/errors";

function getUploadRoot() {
  return path.resolve(process.cwd(), env.storage.localDir());
}

function resolveStoragePath(storagePath: string) {
  const root = path.resolve(getUploadRoot());
  const fullPath = path.resolve(root, storagePath);

  if (!fullPath.startsWith(`${root}${path.sep}`) && fullPath !== root) {
    throw new RAGError("Invalid storage path.", "storage_error", 400);
  }

  return fullPath;
}

export async function uploadLocalFile(storagePath: string, buffer: Buffer): Promise<void> {
  const fullPath = resolveStoragePath(storagePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
}

export async function deleteLocalFile(storagePath: string): Promise<void> {
  const fullPath = resolveStoragePath(storagePath);

  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}
