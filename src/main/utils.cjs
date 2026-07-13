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

const NOTE_NAMES = "A|B|C|D|E|F|G";

function normalizeMusicalKey(value) {
  const text = String(value || "").trim().replace(/♯/g, "#").replace(/♭/g, "b");
  if (!text) return null;
  const match = text.match(new RegExp(`\\b(${NOTE_NAMES})(#|b)?\\s*(major|maj|minor|min|m)?\\b`, "i"));
  if (!match) return null;
  const note = `${match[1].toUpperCase()}${match[2] || ""}`;
  const quality = (match[3] || "").toLowerCase();
  return `${note}${quality === "m" || quality.startsWith("min") ? "m" : quality.startsWith("maj") || quality === "major" ? "" : ""}`;
}

function inferMusicalMetadata(filename, embedded = {}) {
  const sourceText = path.basename(String(filename || ""), path.extname(String(filename || "")))
    .replace(/[_-]+/g, " ");
  const bpmMatch = sourceText.match(/(?:^|\s)([4-9]\d|1\d\d|2[0-9]\d)(?:\s?bpm)?(?:\s|$)/i);
  const filenameBpm = bpmMatch ? Number(bpmMatch[1]) : null;
  const filenameKeyMatch = sourceText.match(new RegExp(`(?:^|\\s)(${NOTE_NAMES})(#|b)?(?:\\s*)(major|maj|minor|min|m)(?:\\s|$)`, "i"));
  const filenameKey = filenameKeyMatch ? normalizeMusicalKey(filenameKeyMatch.slice(1).join("")) : null;
  const embeddedBpm = Number(embedded.bpm);
  const embeddedKey = normalizeMusicalKey(embedded.key);
  return {
    bpm_original: Number.isFinite(embeddedBpm) && embeddedBpm > 0 ? embeddedBpm : filenameBpm,
    bpm_confidence: Number.isFinite(embeddedBpm) && embeddedBpm > 0 ? 0.98 : filenameBpm ? 0.72 : null,
    musical_key: embeddedKey || filenameKey,
    key_confidence: embeddedKey ? 0.98 : filenameKey ? 0.72 : null,
    analysis_source: embeddedKey || (Number.isFinite(embeddedBpm) && embeddedBpm > 0) ? "embedded_metadata" : filenameBpm || filenameKey ? "filename" : "unavailable"
  };
}

module.exports = {
  SUPPORTED_AUDIO_EXTENSIONS,
  isSupportedAudioFile,
  createStableId,
  hashFile,
  sanitizeFtsQuery,
  normalizeTags,
  normalizeMusicalKey,
  inferMusicalMetadata
};
