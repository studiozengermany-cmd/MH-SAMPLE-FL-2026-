const fs = require("node:fs/promises");
const path = require("node:path");
const { isSupportedAudioFile, createStableId, hashFile, inferMusicalMetadata } = require("./utils.cjs");

class LibraryIndexer {
  constructor(database, emitProgress, options = {}) {
    this.database = database;
    this.emitProgress = emitProgress;
    this.watchEnabled = options.watch !== false;
    this.active = new Map();
    this.watchers = new Map();
  }

  async *walk(rootPath, signal) {
    const stack = [{ path: rootPath, parentPath: null, isRoot: true }];
    while (stack.length) {
      if (signal.aborted) throw new Error("SCAN_CANCELLED");
      const current = stack.pop();
      if (!current.isRoot) yield { type: "directory", path: current.path, parentPath: current.parentPath };
      let entries;
      try { entries = await fs.readdir(current.path, { withFileTypes: true }); }
      catch (error) { yield { type: "error", error, path: current.path }; continue; }
      entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
      const directories = [];
      for (const entry of entries) {
        if (signal.aborted) throw new Error("SCAN_CANCELLED");
        const fullPath = path.join(current.path, entry.name);
        if (entry.isDirectory()) directories.push({ path: fullPath, parentPath: current.path, isRoot: false });
        else if (entry.isFile() && isSupportedAudioFile(fullPath)) yield { type: "file", path: fullPath, folderPath: current.path };
      }
      for (let index = directories.length - 1; index >= 0; index -= 1) stack.push(directories[index]);
    }
  }

  async metadata(filePath) {
    try {
      const { parseFile } = await import("music-metadata");
      const result = await parseFile(filePath, { duration: true, skipCovers: true });
      const musical = inferMusicalMetadata(filePath, { bpm: result.common.bpm, key: result.common.key });
      const metadata = {
        duration_ms: result.format.duration ? result.format.duration * 1000 : null,
        sample_rate: result.format.sampleRate || null,
        bit_depth: result.format.bitsPerSample || null,
        channels: result.format.numberOfChannels || null,
        codec: result.format.codec || result.format.container || null,
        ...musical
      };
      if (!metadata.duration_ms && !metadata.sample_rate && !metadata.channels) metadata.metadata_error = new Error("AUDIO_METADATA_EMPTY");
      return metadata;
    } catch (error) {
      return { duration_ms: null, sample_rate: null, bit_depth: null, channels: null, codec: null, ...inferMusicalMetadata(filePath), metadata_error: error };
    }
  }

  async analyzeFile(file, rootId, signal) {
    const existing = this.database.existingFile(file.path);
    const unchanged = existing && existing.size_bytes === file.stat.size && Math.trunc(existing.mtime_ms) === Math.trunc(file.stat.mtimeMs);
    if (unchanged && existing.exact_hash && existing.duration_ms) return { bytes: file.stat.size, skipped: true };
    const [metadataResult, exactHash] = await Promise.all([this.metadata(file.path), hashFile(file.path, signal)]);
    const { metadata_error: metadataError, ...metadata } = metadataResult;
    this.database.upsertSample({
      stable_id: createStableId(file.path, file.stat.size, file.stat.mtimeMs), root_id: rootId, folder_id: file.folderId,
      path: file.path, filename: path.basename(file.path), extension: path.extname(file.path).slice(1).toLowerCase(),
      size_bytes: file.stat.size, mtime_ms: file.stat.mtimeMs, exact_hash: exactHash, ...metadata
    });
    if (metadataError) {
      this.database.recordScanError(rootId, file.path, "AUDIO_METADATA_UNREADABLE", "Đã lập chỉ mục file nhưng không đọc được toàn bộ metadata âm thanh.");
      return { bytes: file.stat.size, warning: true };
    }
    return { bytes: file.stat.size };
  }

  async scanRoot(rootId) {
    if (this.active.has(rootId)) return { status: "already-running" };
    const root = this.database.getRoot(rootId);
    if (!root) throw new Error("ROOT_NOT_FOUND");
    const controller = new AbortController();
    this.active.set(rootId, controller);
    this.database.beginRootScan(rootId);
    const folderIds = new Map([[path.resolve(root.path), null]]);
    const files = [];
    let discovered = 0; let analyzed = 0; let bytes = 0; let errors = 0; let folders = 0;
    try {
      this.emitProgress({ rootId, status: "discovering", processed: 0, discovered: 0, analyzed: 0, bytes: 0, errors: 0, folders: 0 });
      for await (const item of this.walk(root.path, controller.signal)) {
        if (item.type === "error") {
          errors += 1;
          this.database.recordScanError(rootId, item.path, item.error.code || "READ_ERROR", item.error.message);
          continue;
        }
        if (item.type === "directory") {
          const relativePath = path.relative(root.path, item.path).split(path.sep).join("/");
          const folder = this.database.upsertFolder({
            stable_id: createStableId(item.path, 0, 0), root_id: rootId,
            parent_id: folderIds.get(path.resolve(item.parentPath)) || null, path: item.path,
            relative_path: relativePath, name: path.basename(item.path), depth: relativePath.split("/").length
          });
          folderIds.set(path.resolve(item.path), folder.id); folders += 1;
          continue;
        }
        try {
          const stat = await fs.stat(item.path);
          const inferred = inferMusicalMetadata(item.path);
          const folderId = folderIds.get(path.resolve(item.folderPath)) || null;
          this.database.upsertSample({
            stable_id: createStableId(item.path, stat.size, stat.mtimeMs), root_id: rootId, folder_id: folderId,
            path: item.path, filename: path.basename(item.path), extension: path.extname(item.path).slice(1).toLowerCase(),
            size_bytes: stat.size, mtime_ms: stat.mtimeMs, ...inferred
          });
          files.push({ path: item.path, stat, folderId }); discovered += 1; bytes += stat.size;
          if (discovered === 1 || discovered % 20 === 0) this.emitProgress({ rootId, status: "discovering", processed: discovered, discovered, analyzed, bytes, errors, folders });
        } catch (error) {
          errors += 1;
          this.database.recordScanError(rootId, item.path, error.code || "DISCOVERY_ERROR", error.message);
        }
      }

      this.emitProgress({ rootId, status: "analyzing", processed: discovered, discovered, analyzed, bytes, errors, folders });
      const concurrency = 4;
      for (let offset = 0; offset < files.length; offset += concurrency) {
        if (controller.signal.aborted) throw new Error("SCAN_CANCELLED");
        const batch = files.slice(offset, offset + concurrency);
        const results = await Promise.all(batch.map(async (file) => {
          try { return await this.analyzeFile(file, rootId, controller.signal); }
          catch (error) {
            errors += 1;
            this.database.recordScanError(rootId, file.path, error.code || "INDEX_ERROR", error.message);
            return null;
          }
        }));
        analyzed += results.length;
        if (analyzed === results.length || analyzed % 20 === 0 || analyzed >= files.length) {
          this.emitProgress({ rootId, status: "analyzing", processed: discovered, discovered, analyzed, bytes, errors, folders });
        }
      }
      this.database.finishRootScan(rootId);
      const result = { rootId, status: "indexed", processed: discovered, discovered, analyzed, bytes, errors, folders };
      this.emitProgress(result);
      if (this.watchEnabled) this.startWatching(rootId);
      return result;
    } catch (error) {
      const cancelled = error.message === "SCAN_CANCELLED";
      this.database.setRootStatus(rootId, cancelled ? "cancelled" : "error", cancelled ? null : error.message);
      const result = { rootId, status: cancelled ? "cancelled" : "error", processed: discovered, discovered, analyzed, bytes, errors, folders, message: error.message };
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
        record.timer = setTimeout(() => { record.timer = null; this.scanRoot(rootId).catch(() => {}); }, 1200);
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
