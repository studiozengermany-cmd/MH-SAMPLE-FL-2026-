const fs = require("node:fs/promises");
const path = require("node:path");
const { isSupportedAudioFile, createStableId, hashFile } = require("./utils.cjs");

class LibraryIndexer {
  constructor(database, emitProgress) {
    this.database = database;
    this.emitProgress = emitProgress;
    this.active = new Map();
    this.watchers = new Map();
  }

  async *walk(rootPath, signal) {
    const stack = [rootPath];
    while (stack.length) {
      if (signal.aborted) throw new Error("SCAN_CANCELLED");
      const current = stack.pop();
      let entries;
      try { entries = await fs.readdir(current, { withFileTypes: true }); }
      catch (error) { yield { error, path: current }; continue; }
      for (const entry of entries) {
        if (signal.aborted) throw new Error("SCAN_CANCELLED");
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(fullPath);
        else if (entry.isFile() && isSupportedAudioFile(fullPath)) yield { path: fullPath };
      }
    }
  }

  async metadata(filePath) {
    try {
      const { parseFile } = await import("music-metadata");
      const result = await parseFile(filePath, { duration: true, skipCovers: true });
      return {
        duration_ms: result.format.duration ? result.format.duration * 1000 : null,
        sample_rate: result.format.sampleRate || null,
        bit_depth: result.format.bitsPerSample || null,
        channels: result.format.numberOfChannels || null,
        codec: result.format.codec || result.format.container || null
      };
    } catch {
      return { duration_ms: null, sample_rate: null, bit_depth: null, channels: null, codec: null };
    }
  }

  async scanRoot(rootId) {
    if (this.active.has(rootId)) return { status: "already-running" };
    const root = this.database.getRoot(rootId);
    if (!root) throw new Error("ROOT_NOT_FOUND");
    const controller = new AbortController();
    this.active.set(rootId, controller);
    this.database.beginRootScan(rootId);
    let processed = 0; let bytes = 0; let errors = 0;
    try {
      for await (const item of this.walk(root.path, controller.signal)) {
        if (item.error) {
          errors += 1;
          this.database.recordScanError(rootId, item.path, item.error.code || "READ_ERROR", item.error.message);
          continue;
        }
        try {
          const stat = await fs.stat(item.path);
          const existing = this.database.existingFile(item.path);
          const unchanged = existing && existing.size_bytes === stat.size && Math.trunc(existing.mtime_ms) === Math.trunc(stat.mtimeMs);
          const metadata = unchanged ? {} : await this.metadata(item.path);
          const exactHash = unchanged && existing.exact_hash ? existing.exact_hash : await hashFile(item.path, controller.signal);
          this.database.upsertSample({
            stable_id: createStableId(item.path, stat.size, stat.mtimeMs), root_id: rootId, path: item.path,
            filename: path.basename(item.path), extension: path.extname(item.path).slice(1).toLowerCase(), size_bytes: stat.size,
            mtime_ms: stat.mtimeMs, duration_ms: metadata.duration_ms ?? null, sample_rate: metadata.sample_rate ?? null,
            bit_depth: metadata.bit_depth ?? null, channels: metadata.channels ?? null, codec: metadata.codec ?? null, exact_hash: exactHash
          });
          processed += 1; bytes += stat.size;
          if (processed % 10 === 0) this.emitProgress({ rootId, status: "scanning", processed, bytes, errors });
        } catch (error) {
          errors += 1;
          this.database.recordScanError(rootId, item.path, error.code || "INDEX_ERROR", error.message);
        }
      }
      this.database.finishRootScan(rootId);
      const result = { rootId, status: "indexed", processed, bytes, errors };
      this.emitProgress(result);
      this.startWatching(rootId);
      return result;
    } catch (error) {
      const cancelled = error.message === "SCAN_CANCELLED";
      this.database.setRootStatus(rootId, cancelled ? "cancelled" : "error", cancelled ? null : error.message);
      const result = { rootId, status: cancelled ? "cancelled" : "error", processed, bytes, errors, message: error.message };
      this.emitProgress(result);
      return result;
    } finally { this.active.delete(rootId); }
  }

  cancel(rootId) { const controller = this.active.get(rootId); if (controller) controller.abort(); return Boolean(controller); }

  startWatching(rootId) {
    const root = this.database.getRoot(rootId);
    if (!root || this.watchers.has(rootId)) return;
    try {
      const fsSync = require("node:fs");
      const record = { watcher: null, timer: null };
      const watcher = fsSync.watch(root.path, { recursive: true }, () => {
        clearTimeout(record.timer);
        record.timer = setTimeout(() => {
          record.timer = null;
          this.scanRoot(rootId).catch(() => {});
        }, 1200);
      });
      record.watcher = watcher;
      watcher.on("error", () => { clearTimeout(record.timer); watcher.close(); this.watchers.delete(rootId); });
      this.watchers.set(rootId, record);
    } catch { /* manual rescan remains available */ }
  }

  close() {
    for (const record of this.watchers.values()) { clearTimeout(record.timer); record.watcher.close(); }
    this.watchers.clear();
    for (const controller of this.active.values()) controller.abort();
  }
}

module.exports = { LibraryIndexer };
