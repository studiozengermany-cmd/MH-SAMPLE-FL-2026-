const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");
const { MhDatabase } = require("../src/main/database.cjs");
const { LibraryIndexer } = require("../src/main/indexer.cjs");

function makeSilentWav(sampleRate = 44100, durationSeconds = 0.05) {
  const samples = Math.floor(sampleRate * durationSeconds);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write("WAVE", 8);
  buffer.write("fmt ", 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

test("indexer quét WAV thật, đọc metadata, hash, search và backup", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mh-indexer-test-"));
  const samplePath = path.join(dir, "Kick Việt 01.wav");
  fs.writeFileSync(samplePath, makeSilentWav());
  const databasePath = path.join(dir, "mh.sqlite");
  const backupPath = path.join(dir, "mh-backup.sqlite");
  const db = new MhDatabase(databasePath);
  const events = [];
  const indexer = new LibraryIndexer(db, (event) => events.push(event), { watch: false });
  const root = db.addRoot(dir);
  const result = await indexer.scanRoot(root.id);
  assert.equal(result.status, "indexed");
  assert.equal(result.processed, 1);
  const rows = db.searchSamples({ query: "Kick", available: "all" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sample_rate, 44100);
  assert.equal(rows[0].channels, 1);
  assert.match(rows[0].exact_hash, /^[a-f0-9]{64}$/);
  assert.equal(events.at(-1).status, "indexed");
  await db.backup(backupPath);
  assert.equal(fs.existsSync(backupPath), true);
  assert.ok(fs.statSync(backupPath).size > 0);
  indexer.close(); db.close(); fs.rmSync(dir, { recursive: true, force: true });
});

test("indexer giữ nguyên cây folder lồng nhau, folder rỗng và lọc theo nhánh", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mh-folder-tree-test-"));
  const kicks = path.join(dir, "Drums", "Kicks");
  const snares = path.join(dir, "Drums", "Snares");
  const empty = path.join(dir, "Vocals", "Empty Pack");
  fs.mkdirSync(kicks, { recursive: true }); fs.mkdirSync(snares, { recursive: true }); fs.mkdirSync(empty, { recursive: true });
  fs.writeFileSync(path.join(kicks, "Kick 128BPM Am.wav"), makeSilentWav());
  fs.writeFileSync(path.join(snares, "Snare.wav"), makeSilentWav());
  const db = new MhDatabase(path.join(dir, "tree.sqlite")); const events = [];
  const indexer = new LibraryIndexer(db, (event) => events.push(event), { watch: false }); const root = db.addRoot(dir);
  const result = await indexer.scanRoot(root.id); const tree = db.listFolderTree(root.id);
  assert.equal(result.folders, 5); assert.deepEqual(tree.map((item) => item.name), ["Drums", "Vocals"]);
  const drums = tree.find((item) => item.name === "Drums"); const kickFolder = drums.children.find((item) => item.name === "Kicks");
  const emptyFolder = tree.find((item) => item.name === "Vocals").children.find((item) => item.name === "Empty Pack");
  assert.equal(drums.total_sample_count, 2); assert.equal(kickFolder.total_sample_count, 1); assert.equal(emptyFolder.total_sample_count, 0);
  const kickRows = db.searchSamples({ folderId: kickFolder.id, available: "available" });
  assert.equal(kickRows.length, 1); assert.equal(kickRows[0].folder_relative_path, "Drums/Kicks");
  assert.equal(kickRows[0].bpm_original, 128); assert.equal(kickRows[0].musical_key, "Am"); assert.equal(kickRows[0].analysis_source, "filename");
  assert.ok(events.some((event) => event.status === "discovering")); assert.ok(events.some((event) => event.status === "analyzing"));
  indexer.close(); db.close(); fs.rmSync(dir, { recursive: true, force: true });
});

test("file audio hỏng vẫn được phát hiện và ghi lỗi metadata minh bạch", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mh-corrupt-audio-test-"));
  fs.writeFileSync(path.join(dir, "Broken 140BPM Dm.wav"), Buffer.from("not-a-wave"));
  const db = new MhDatabase(path.join(dir, "corrupt.sqlite")); const indexer = new LibraryIndexer(db, () => {}, { watch: false }); const root = db.addRoot(dir);
  const result = await indexer.scanRoot(root.id); const rows = db.searchSamples({ rootId: root.id, available: "available" });
  assert.equal(result.status, "indexed"); assert.equal(rows.length, 1); assert.equal(rows[0].bpm_original, 140); assert.equal(rows[0].musical_key, "Dm");
  const errors = db.db.prepare("SELECT code FROM scan_errors WHERE root_id=?").all(root.id);
  assert.ok(errors.some((entry) => entry.code === "AUDIO_METADATA_UNREADABLE"));
  indexer.close(); db.close(); fs.rmSync(dir, { recursive: true, force: true });
});
