const path = require("node:path");
const crypto = require("node:crypto");
const fs = require("node:fs");

const SUPPORTED_AUDIO_EXTENSIONS = new Set([".wav", ".aif", ".aiff", ".flac", ".mp3", ".ogg", ".m4a"]);

function isSupportedAudioFile(filePath) {
  return SUPPORTED_AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function createStableId(filePath, size, mtimeMs) {
  return crypto.createHash("sha256").update(`${path.resolve(filePath)}\u0000${size}\u0000${Math.trunc(mtimeMs)}`).digest("hex");
}

function hashFile(filePath, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("SCAN_CANCELLED"));
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    const abort = () => stream.destroy(new Error("SCAN_CANCELLED"));
    signal?.addEventListener("abort", abort, { once: true });
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("close", () => signal?.removeEventListener("abort", abort));
  });
}

function sanitizeFtsQuery(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/["'():*^~{}\[\]\\]/g, ""))
    .filter(Boolean)
    .map((part) => `"${part}"*`)
    .join(" AND ");
}

function normalizeTags(tags) {
  return [...new Set((Array.isArray(tags) ? tags : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean))].slice(0, 32);
}

module.exports = {
  SUPPORTED_AUDIO_EXTENSIONS,
  isSupportedAudioFile,
  createStableId,
  hashFile,
  sanitizeFtsQuery,
  normalizeTags
};

