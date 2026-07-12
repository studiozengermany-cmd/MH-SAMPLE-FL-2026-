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
