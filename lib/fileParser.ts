import path from "path";
import { pathToFileURL } from "url";

import { PDFParse } from "pdf-parse";

export type ParsedPage = {
  page: number;
  text: string;
};

export type ParsedDocument = {
  source: string;
  pages: ParsedPage[];
};

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".pdf"];

let pdfWorkerConfigured = false;

function ensurePdfWorkerConfigured() {
  if (pdfWorkerConfigured) return;

  const workerPath = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
  );

  PDFParse.setWorker(pathToFileURL(workerPath).href);
  pdfWorkerConfigured = true;
}

export function isSupportedFile(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPage[]> {
  ensurePdfWorkerConfigured();

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const pages = result.pages
    .filter((page) => page.text.trim())
    .map((page) => ({ page: page.num, text: page.text.trim() }));

  if (pages.length === 0) {
    throw new Error(
      "This PDF has no selectable text. It may be a scanned image — try a text-based PDF or upload a .txt file instead.",
    );
  }

  return pages;
}

export async function parseFileBuffer(
  buffer: Buffer,
  filename: string,
): Promise<ParsedDocument> {
  const ext = path.extname(filename).toLowerCase();

  if (!isSupportedFile(filename)) {
    throw new Error("Only .txt, .md, .csv, .json, and .pdf files are supported.");
  }

  if ([".txt", ".md", ".csv", ".json"].includes(ext)) {
    const text = buffer.toString("utf-8").trim();

    if (!text) {
      throw new Error("Document is empty or text could not be extracted.");
    }

    return {
      source: filename,
      pages: [{ page: 1, text }],
    };
  }

  const pages = await parsePdfBuffer(buffer);

  return { source: filename, pages };
}

export async function parseTextContent(
  text: string,
  source: string,
): Promise<ParsedDocument> {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("Document is empty or text could not be extracted.");
  }

  return {
    source,
    pages: [{ page: 1, text: trimmed }],
  };
}
