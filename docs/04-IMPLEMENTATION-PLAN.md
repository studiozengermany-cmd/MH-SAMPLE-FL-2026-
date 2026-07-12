# Kế hoạch code và vận hành dự án

## Nguyên tắc triển khai

- Mỗi milestone tạo ra một vertical slice chạy được và test được.
- Không dựng toàn bộ UI rồi mới nối engine.
- Không bắt đầu milestone sau khi gate bắt buộc của milestone trước chưa đạt.
- Không code VST3 trong kế hoạch này.
- Ước lượng là dự kiến cho một người phát triển có AI hỗ trợ; nghiệm thu quan trọng hơn ngày tháng.

## Milestone 0 — Khóa hồ sơ và kỹ thuật nền

**Đầu ra:** repository greenfield, tài liệu, ADR, threat/safety rules, backlog và test strategy.

- Chốt tên, scope, non-goals và terminology.
- Chốt Electron + React/TypeScript + Node SQLite theo ADR-009.
- Dựng CI Windows và tiếp tục bốn Technical Gate A–D, ưu tiên desktop drag trên FL Studio thật.
- Chỉ đổi shell/engine khi có benchmark hoặc lỗi host được chứng minh.

**Baseline v0.1:** source đã đi qua M1–M8 ở mức alpha theo `docs/09-IMPLEMENTATION-STATUS.md`; các gate Windows/FL/performance chưa đạt vẫn phải giữ UNTESTED, không được hợp thức hóa bằng việc UI đã build.

## Milestone 1 — App shell và persistence

- Scaffold Rust workspace và desktop UI.
- Settings, data/cache/backup path và SQLite migrations.
- App shell, navigation, error boundary, structured logs.
- Backup/restore database tối thiểu.
- CI: format, lint, unit test, build Windows.

**Nghiệm thu:** mở/đóng app, đổi data path hợp lệ, migration và restore test pass; chưa có dữ liệu demo giả.

## Milestone 2 — Local Crate và fast index

- Add/disable/remove-from-index root.
- Discover supported files, metadata cơ bản và batch insert.
- Job queue, progress, pause/resume/cancel/retry.
- Indexed/Pending/Missing/Error thật.
- File watcher và incremental update bản đầu.

**Nghiệm thu:** scan fixtures và thư viện thật; restart giữa scan có thể phục hồi; không đụng file nguồn.

## Milestone 3 — Search workspace

- FTS search, filters, sort, pagination/virtual list.
- Result row, selection, inspector và empty/error states.
- Favorite, rating, tags, crates và bulk metadata.

**Nghiệm thu:** 100k records, warm search P95 theo budget; UI dùng được khi index nền.

## Milestone 4 — Audio preview và waveform

- Decode formats MVP, player state machine và audio device settings.
- Waveform worker/cache, seek, loop, volume và preview-only gain/normalize.
- Resource cleanup, corrupted/unsupported states.

**Nghiệm thu:** test 500 lần switch/play/stop; không phát chồng, crash hoặc khóa file dài hạn.

## Milestone 5 — Project Workspace và Memory

- Project CRUD và project selector.
- Memory events với source/confidence.
- Role/style/note, counts tách loại và manifest export.
- Recently sent/confirmed/verified và ranking cơ bản.

**Nghiệm thu:** không có entry nào thiếu provenance; UI không gọi `sent` là `used`.

## Milestone 6 — Desktop-to-FL workflow

- Tích hợp native drag đã pass Gate A.
- Drag readiness, accepted/rejected feedback và fallback.
- Ghi `sent_to_fl` gắn project đang chọn.
- Test matrix FL targets, path Unicode/dài và nhiều định dạng.

**Nghiệm thu:** 500 lần drag soak không crash; drop rejected không làm mất dữ liệu/selection.

## Milestone 7 — Source/License và Library Health

- Pack/source/license/evidence model và UI.
- Missing workflow, locate, path history, aliases và health report.
- Export CSV/JSON cho project assets và license evidence.

**Nghiệm thu:** disconnected drive, renamed folder và missing file có đường phục hồi rõ; không tuyên bố pháp lý tự động.

## Milestone 8 — Exact Duplicate Safety Lab

- Hash queue và exact duplicate groups.
- Canonical candidate, reference summary và simulation report.
- Không auto-delete/hard-link.
- Export manifest/log.

**Nghiệm thu:** byte/hash verified; file unreadable không bị đưa vào exact group; simulation không thay đổi filesystem.

## Milestone 9 — Hardening và private beta

- Performance profiling, memory/handle leak, crash recovery.
- Accessibility, localization, diagnostics và support bundle.
- Signed installer/update strategy; uninstall safety.
- Private beta, issue template và rollback release.

**Nghiệm thu:** test matrix pass, backup/restore pass, không critical data-loss bug, release notes nêu rõ tested/untested.

## Nhịp vận hành mỗi milestone

1. Issue/brief có mục tiêu và ngoài phạm vi.
2. Acceptance tests được viết trước.
3. Branch nhỏ theo feature; không trộn refactor ngoài scope.
4. Code → unit/integration/E2E → manual evidence.
5. Review safety/performance/migration.
6. Chỉ merge khi docs và trạng thái test được cập nhật.
7. Release checkpoint có backup và rollback note.

## Backlog ưu tiên đầu tiên

1. `SPIKE-001`: Native desktop file drag sang FL Studio.
2. `SPIKE-002`: Audio decode/waveform/resource lifecycle.
3. `SPIKE-003`: SQLite WAL/FTS với 100k records.
4. `SPIKE-004`: Crash giữa index và database recovery.
5. `ARCH-001`: Rust workspace và layer boundaries.
6. `DATA-001`: Schema/migrations v1.
7. `APP-001`: Desktop shell/settings/data locations.
8. `IDX-001`: Add root và fast index vertical slice.
