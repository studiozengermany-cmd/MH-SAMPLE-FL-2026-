const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync, backup } = require("node:sqlite");
const { sanitizeFtsQuery, normalizeTags } = require("./utils.cjs");

class MhDatabase {
  constructor(databasePath) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.path = databasePath;
    this.db = new DatabaseSync(databasePath);
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    this.migrate();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS library_roots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'pending',
        file_count INTEGER NOT NULL DEFAULT 0,
        size_bytes INTEGER NOT NULL DEFAULT 0,
        last_scan_at TEXT,
        last_error TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stable_id TEXT NOT NULL UNIQUE,
        root_id INTEGER NOT NULL REFERENCES library_roots(id) ON DELETE CASCADE,
        path TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        extension TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        mtime_ms REAL NOT NULL,
        duration_ms REAL,
        sample_rate INTEGER,
        bit_depth INTEGER,
        channels INTEGER,
        codec TEXT,
        exact_hash TEXT,
        available INTEGER NOT NULL DEFAULT 1,
        favorite INTEGER NOT NULL DEFAULT 0,
        rating INTEGER NOT NULL DEFAULT 0 CHECK(rating BETWEEN 0 AND 5),
        category TEXT NOT NULL DEFAULT '',
        pack TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        preview_count INTEGER NOT NULL DEFAULT 0,
        sent_to_fl_count INTEGER NOT NULL DEFAULT 0,
        confirmed_usage_count INTEGER NOT NULL DEFAULT 0,
        first_indexed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_samples_root ON samples(root_id);
      CREATE INDEX IF NOT EXISTS idx_samples_hash ON samples(exact_hash);
      CREATE INDEX IF NOT EXISTS idx_samples_available ON samples(available);
      CREATE VIRTUAL TABLE IF NOT EXISTS samples_fts USING fts5(filename, path, category, pack, note, content='samples', content_rowid='id');
      CREATE TRIGGER IF NOT EXISTS samples_ai AFTER INSERT ON samples BEGIN
        INSERT INTO samples_fts(rowid, filename, path, category, pack, note) VALUES (new.id, new.filename, new.path, new.category, new.pack, new.note);
      END;
      CREATE TRIGGER IF NOT EXISTS samples_ad AFTER DELETE ON samples BEGIN
        INSERT INTO samples_fts(samples_fts, rowid, filename, path, category, pack, note) VALUES('delete', old.id, old.filename, old.path, old.category, old.pack, old.note);
      END;
      CREATE TRIGGER IF NOT EXISTS samples_au AFTER UPDATE ON samples BEGIN
        INSERT INTO samples_fts(samples_fts, rowid, filename, path, category, pack, note) VALUES('delete', old.id, old.filename, old.path, old.category, old.pack, old.note);
        INSERT INTO samples_fts(rowid, filename, path, category, pack, note) VALUES (new.id, new.filename, new.path, new.category, new.pack, new.note);
      END;
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE
      );
      CREATE TABLE IF NOT EXISTS sample_tags (
        sample_id INTEGER NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        source TEXT NOT NULL DEFAULT 'manual',
        PRIMARY KEY(sample_id, tag_id)
      );
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stable_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        project_path TEXT,
        style TEXT NOT NULL DEFAULT '',
        bpm REAL,
        musical_key TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS project_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        sample_id INTEGER NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL CHECK(event_type IN ('previewed','sent_to_fl','user_confirmed','manifest_imported','verified_reference')),
        role TEXT NOT NULL DEFAULT '',
        style_context TEXT NOT NULL DEFAULT '',
        producer_note TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 1 CHECK(confidence BETWEEN 0 AND 1),
        occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_memories_project ON project_memories(project_id, occurred_at DESC);
      CREATE INDEX IF NOT EXISTS idx_memories_sample ON project_memories(sample_id, occurred_at DESC);
      CREATE TABLE IF NOT EXISTS licenses (
        sample_id INTEGER PRIMARY KEY REFERENCES samples(id) ON DELETE CASCADE,
        vendor TEXT NOT NULL DEFAULT '',
        pack_name TEXT NOT NULL DEFAULT '',
        source_url TEXT NOT NULL DEFAULT '',
        purchase_date TEXT NOT NULL DEFAULT '',
        order_reference TEXT NOT NULL DEFAULT '',
        license_type TEXT NOT NULL DEFAULT 'unknown',
        commercial_status TEXT NOT NULL DEFAULT 'unknown',
        evidence_path TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS scan_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        root_id INTEGER REFERENCES library_roots(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        code TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO schema_migrations(version) VALUES(1);
    `);
  }

  close() { this.db.close(); }

  transaction(fn) {
    this.db.exec("BEGIN IMMEDIATE");
    try { const result = fn(); this.db.exec("COMMIT"); return result; }
    catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }

  addRoot(rootPath) {
    const displayName = path.basename(rootPath) || rootPath;
    this.db.prepare(`INSERT INTO library_roots(path, display_name) VALUES (?, ?)
      ON CONFLICT(path) DO UPDATE SET enabled=1, updated_at=CURRENT_TIMESTAMP`).run(rootPath, displayName);
    return this.db.prepare("SELECT * FROM library_roots WHERE path=?").get(rootPath);
  }

  listRoots() { return this.db.prepare("SELECT * FROM library_roots ORDER BY display_name COLLATE NOCASE").all(); }
  getRoot(id) { return this.db.prepare("SELECT * FROM library_roots WHERE id=?").get(id); }
  setRootStatus(id, status, error = null) {
    this.db.prepare("UPDATE library_roots SET status=?, last_error=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status, error, id);
  }
  beginRootScan(id) {
    this.db.prepare("UPDATE samples SET available=0 WHERE root_id=?").run(id);
    this.db.prepare("DELETE FROM scan_errors WHERE root_id=?").run(id);
    this.setRootStatus(id, "scanning");
  }
  finishRootScan(id) {
    this.db.prepare(`UPDATE library_roots SET status='indexed', file_count=(SELECT COUNT(*) FROM samples WHERE root_id=? AND available=1),
      size_bytes=COALESCE((SELECT SUM(size_bytes) FROM samples WHERE root_id=? AND available=1),0), last_scan_at=CURRENT_TIMESTAMP,
      last_error=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(id, id, id);
  }
  recordScanError(rootId, filePath, code, message) {
    this.db.prepare("INSERT INTO scan_errors(root_id,path,code,message) VALUES(?,?,?,?)").run(rootId, filePath, code, message);
  }

  upsertSample(sample) {
    this.db.prepare(`INSERT INTO samples(stable_id,root_id,path,filename,extension,size_bytes,mtime_ms,duration_ms,sample_rate,bit_depth,channels,codec,exact_hash,available)
      VALUES(@stable_id,@root_id,@path,@filename,@extension,@size_bytes,@mtime_ms,@duration_ms,@sample_rate,@bit_depth,@channels,@codec,@exact_hash,1)
      ON CONFLICT(path) DO UPDATE SET stable_id=excluded.stable_id, root_id=excluded.root_id, filename=excluded.filename,
      extension=excluded.extension, size_bytes=excluded.size_bytes, mtime_ms=excluded.mtime_ms,
      duration_ms=COALESCE(excluded.duration_ms,samples.duration_ms), sample_rate=COALESCE(excluded.sample_rate,samples.sample_rate),
      bit_depth=COALESCE(excluded.bit_depth,samples.bit_depth), channels=COALESCE(excluded.channels,samples.channels),
      codec=COALESCE(excluded.codec,samples.codec),
      exact_hash=excluded.exact_hash, available=1, updated_at=CURRENT_TIMESTAMP`).run(sample);
    return this.db.prepare("SELECT * FROM samples WHERE path=?").get(sample.path);
  }

  existingFile(filePath) { return this.db.prepare("SELECT id,size_bytes,mtime_ms,exact_hash FROM samples WHERE path=?").get(filePath); }

  searchSamples(params = {}) {
    const query = String(params.query || "").trim();
    const clauses = ["1=1"];
    const values = [];
    let join = "";
    if (query) {
      join += " JOIN samples_fts ON samples_fts.rowid=s.id";
      clauses.push("samples_fts MATCH ?"); values.push(sanitizeFtsQuery(query));
    }
    if (params.rootId) { clauses.push("s.root_id=?"); values.push(Number(params.rootId)); }
    if (params.extension) { clauses.push("s.extension=?"); values.push(String(params.extension)); }
    if (params.favorite) clauses.push("s.favorite=1");
    if (params.available === "missing") clauses.push("s.available=0");
    if (params.available !== "all" && params.available !== "missing") clauses.push("s.available=1");
    const allowedSorts = {
      relevance: query ? "samples_fts.rank, s.filename COLLATE NOCASE" : "s.updated_at DESC",
      name: "s.filename COLLATE NOCASE ASC",
      recent: "s.updated_at DESC",
      usage: "s.confirmed_usage_count DESC, s.sent_to_fl_count DESC",
      rating: "s.rating DESC, s.favorite DESC"
    };
    const sort = allowedSorts[params.sort] || allowedSorts.relevance;
    const limit = Math.min(Math.max(Number(params.limit) || 250, 1), 1000);
    const rows = this.db.prepare(`SELECT s.*, r.display_name AS root_name,
      COALESCE((SELECT GROUP_CONCAT(t.name) FROM tags t JOIN sample_tags st ON st.tag_id=t.id WHERE st.sample_id=s.id),'') AS tags
      FROM samples s ${join}
      JOIN library_roots r ON r.id=s.root_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY ${sort} LIMIT ?`).all(...values, limit);
    return rows.map((row) => ({ ...row, tags: row.tags ? row.tags.split(",") : [] }));
  }

  getSample(id) {
    const sample = this.db.prepare(`SELECT s.*, r.display_name AS root_name FROM samples s JOIN library_roots r ON r.id=s.root_id WHERE s.id=?`).get(id);
    if (!sample) return null;
    sample.tags = this.db.prepare("SELECT t.name FROM tags t JOIN sample_tags st ON st.tag_id=t.id WHERE st.sample_id=? ORDER BY t.name").all(id).map((x) => x.name);
    sample.license = this.db.prepare("SELECT * FROM licenses WHERE sample_id=?").get(id) || null;
    sample.memories = this.listMemories({ sampleId: id });
    sample.audioUrl = `mh-audio://sample/${id}`;
    return sample;
  }

  updateSample(id, patch) {
    const allowed = ["favorite", "rating", "category", "pack", "note"];
    const entries = Object.entries(patch || {}).filter(([key]) => allowed.includes(key));
    if (!entries.length) return this.getSample(id);
    const setters = entries.map(([key]) => `${key}=?`).join(",");
    this.db.prepare(`UPDATE samples SET ${setters}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...entries.map(([,value]) => value), id);
    return this.getSample(id);
  }

  setTags(sampleId, inputTags) {
    const tags = normalizeTags(inputTags);
    this.transaction(() => {
      this.db.prepare("DELETE FROM sample_tags WHERE sample_id=?").run(sampleId);
      for (const tag of tags) {
        this.db.prepare("INSERT OR IGNORE INTO tags(name) VALUES(?)").run(tag);
        const row = this.db.prepare("SELECT id FROM tags WHERE name=? COLLATE NOCASE").get(tag);
        this.db.prepare("INSERT OR IGNORE INTO sample_tags(sample_id,tag_id,source) VALUES(?,?,'manual')").run(sampleId, row.id);
      }
    });
    return this.getSample(sampleId);
  }

  incrementPreview(id) { this.db.prepare("UPDATE samples SET preview_count=preview_count+1 WHERE id=?").run(id); }

  stats() {
    return this.db.prepare(`SELECT COUNT(*) total, SUM(CASE WHEN available=1 THEN 1 ELSE 0 END) available,
      SUM(CASE WHEN available=0 THEN 1 ELSE 0 END) missing,
      COALESCE(SUM(CASE WHEN available=1 THEN size_bytes ELSE 0 END),0) size_bytes FROM samples`).get();
  }

  listProjects() { return this.db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all(); }
  createProject(project) {
    const stableId = require("node:crypto").randomUUID();
    const result = this.db.prepare("INSERT INTO projects(stable_id,name,project_path,style,bpm,musical_key,note) VALUES(?,?,?,?,?,?,?)")
      .run(stableId, project.name, project.project_path || null, project.style || "", project.bpm || null, project.musical_key || "", project.note || "");
    return this.db.prepare("SELECT * FROM projects WHERE id=?").get(result.lastInsertRowid);
  }

  addMemory(memory) {
    const result = this.db.prepare(`INSERT INTO project_memories(project_id,sample_id,event_type,role,style_context,producer_note,source,confidence)
      VALUES(?,?,?,?,?,?,?,?)`).run(memory.project_id, memory.sample_id, memory.event_type, memory.role || "", memory.style_context || "",
      memory.producer_note || "", memory.source || "manual", Number(memory.confidence ?? 1));
    if (memory.event_type === "sent_to_fl") this.db.prepare("UPDATE samples SET sent_to_fl_count=sent_to_fl_count+1 WHERE id=?").run(memory.sample_id);
    if (memory.event_type === "user_confirmed") this.db.prepare("UPDATE samples SET confirmed_usage_count=confirmed_usage_count+1 WHERE id=?").run(memory.sample_id);
    return this.db.prepare("SELECT * FROM project_memories WHERE id=?").get(result.lastInsertRowid);
  }

  listMemories({ projectId, sampleId } = {}) {
    const clauses = []; const values = [];
    if (projectId) { clauses.push("m.project_id=?"); values.push(projectId); }
    if (sampleId) { clauses.push("m.sample_id=?"); values.push(sampleId); }
    return this.db.prepare(`SELECT m.*, p.name project_name, s.filename sample_name FROM project_memories m
      JOIN projects p ON p.id=m.project_id JOIN samples s ON s.id=m.sample_id
      ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY m.occurred_at DESC LIMIT 500`).all(...values);
  }

  upsertLicense(sampleId, data) {
    this.db.prepare(`INSERT INTO licenses(sample_id,vendor,pack_name,source_url,purchase_date,order_reference,license_type,commercial_status,evidence_path,note)
      VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(sample_id) DO UPDATE SET vendor=excluded.vendor,pack_name=excluded.pack_name,
      source_url=excluded.source_url,purchase_date=excluded.purchase_date,order_reference=excluded.order_reference,
      license_type=excluded.license_type,commercial_status=excluded.commercial_status,evidence_path=excluded.evidence_path,
      note=excluded.note,updated_at=CURRENT_TIMESTAMP`).run(sampleId, data.vendor || "", data.pack_name || "", data.source_url || "",
      data.purchase_date || "", data.order_reference || "", data.license_type || "unknown", data.commercial_status || "unknown",
      data.evidence_path || "", data.note || "");
    return this.db.prepare("SELECT * FROM licenses WHERE sample_id=?").get(sampleId);
  }

  duplicateGroups() {
    return this.db.prepare(`SELECT exact_hash, COUNT(*) file_count, SUM(size_bytes) total_size,
      GROUP_CONCAT(id) sample_ids FROM samples WHERE available=1 AND exact_hash IS NOT NULL AND exact_hash<>''
      GROUP BY exact_hash HAVING COUNT(*)>1 ORDER BY total_size DESC LIMIT 500`).all().map((group) => ({
        ...group,
        samples: this.db.prepare("SELECT id,filename,path,size_bytes FROM samples WHERE exact_hash=? ORDER BY path").all(group.exact_hash)
      }));
  }

  getSetting(key, fallback = null) {
    const row = this.db.prepare("SELECT value FROM settings WHERE key=?").get(key);
    if (!row) return fallback;
    try { return JSON.parse(row.value); } catch { return row.value; }
  }
  setSetting(key, value) {
    this.db.prepare(`INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).run(key, JSON.stringify(value));
    return value;
  }

  async backup(destination) { await backup(this.db, destination); return destination; }
  exportSnapshot() {
    const samples = this.db.prepare("SELECT * FROM samples ORDER BY id").all().map((sample) => ({
      ...sample,
      tags: this.db.prepare("SELECT t.name FROM tags t JOIN sample_tags st ON st.tag_id=t.id WHERE st.sample_id=? ORDER BY t.name").all(sample.id).map((tag) => tag.name),
      license: this.db.prepare("SELECT * FROM licenses WHERE sample_id=?").get(sample.id) || null
    }));
    return { exported_at: new Date().toISOString(), roots: this.listRoots(), samples, projects: this.listProjects(), memories: this.listMemories(), duplicates: this.duplicateGroups() };
  }
}

module.exports = { MhDatabase };
