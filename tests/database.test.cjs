const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");
const { MhDatabase } = require("../src/main/database.cjs");

test("database lưu sample, search, project memory và exact duplicate đúng semantics", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mh-sample-fl-test-"));
  const db = new MhDatabase(path.join(dir, "test.sqlite"));
  const root = db.addRoot(dir);
  const base = { root_id:root.id, extension:"wav", size_bytes:100, mtime_ms:1, duration_ms:500, sample_rate:44100, bit_depth:24, channels:1, codec:"PCM", exact_hash:"same-hash" };
  const a = db.upsertSample({...base,stable_id:"a",path:path.join(dir,"kick-heavy.wav"),filename:"kick-heavy.wav"});
  db.upsertSample({...base,stable_id:"b",path:path.join(dir,"copy.wav"),filename:"copy.wav"});
  db.finishRootScan(root.id);
  db.setTags(a.id,["Kick","Warehouse"]);
  const result = db.searchSamples({query:"kick",available:"all"});
  assert.equal(result.length,1); assert.deepEqual(result[0].tags,["Kick","Warehouse"]);
  const project = db.createProject({name:"Beat 01"});
  db.addMemory({project_id:project.id,sample_id:a.id,event_type:"sent_to_fl",source:"desktop_drag_accepted",confidence:.8});
  assert.equal(db.getSample(a.id).sent_to_fl_count,1);
  assert.equal(db.getSample(a.id).confirmed_usage_count,0);
  assert.equal(db.duplicateGroups()[0].file_count,2);
  db.close(); fs.rmSync(dir,{recursive:true,force:true});
});

