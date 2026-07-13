const test = require("node:test");
const assert = require("node:assert/strict");
const { isSupportedAudioFile, sanitizeFtsQuery, normalizeTags, createStableId, inferMusicalMetadata, normalizeMusicalKey } = require("../src/main/utils.cjs");

test("chỉ nhận định dạng âm thanh nằm trong phạm vi MVP", () => {
  assert.equal(isSupportedAudioFile("Kick.WAV"), true);
  assert.equal(isSupportedAudioFile("vocal.flac"), true);
  assert.equal(isSupportedAudioFile("project.flp"), false);
  assert.equal(isSupportedAudioFile("script.exe"), false);
});

test("FTS query loại ký tự điều khiển và giữ tìm kiếm prefix", () => {
  assert.equal(sanitizeFtsQuery('kick (heavy)*'), '"kick"* AND "heavy"*');
});

test("tag được trim, loại rỗng và loại trùng", () => {
  assert.deepEqual(normalizeTags([" Kick ", "", "Kick", "One Shot"]), ["Kick", "One Shot"]);
});

test("stable id đổi khi fingerprint đường dẫn thay đổi", () => {
  assert.equal(createStableId("A.wav", 10, 1), createStableId("A.wav", 10, 1));
  assert.notEqual(createStableId("A.wav", 10, 1), createStableId("A.wav", 11, 1));
});

test("đọc BPM và key có provenance từ metadata hoặc tên file", () => {
  assert.deepEqual(inferMusicalMetadata("Vocal Loop 128BPM F#min.wav"), {
    bpm_original: 128, bpm_confidence: 0.72, musical_key: "F#m", key_confidence: 0.72, analysis_source: "filename"
  });
  const embedded = inferMusicalMetadata("loop.wav", { bpm: 124, key: "A minor" });
  assert.equal(embedded.bpm_original, 124); assert.equal(embedded.musical_key, "Am"); assert.equal(embedded.analysis_source, "embedded_metadata");
  assert.equal(normalizeMusicalKey("C# Major"), "C#");
});
