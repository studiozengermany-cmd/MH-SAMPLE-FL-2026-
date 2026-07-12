const test = require("node:test");
const assert = require("node:assert/strict");
const { isSupportedAudioFile, sanitizeFtsQuery, normalizeTags, createStableId } = require("../src/main/utils.cjs");

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

