# Trạng thái triển khai và bằng chứng

## Baseline

- Phiên bản: `0.1.0-alpha`
- Ngày: 12/07/2026
- Phạm vi: ứng dụng desktop app-first
- VST3: `BLOCKED BY VST-GATE-000`, không có code/plugin dependency

## Đã triển khai

| Requirement | Hạng mục | Source chính | Trạng thái |
|---|---|---|---|
| APP-001/002 | Electron app local-first, preload IPC an toàn | `src/main/main.cjs`, `src/preload/preload.cjs` | IMPLEMENTED |
| LIB-001–005 | Roots, recursive scan, watcher, progress, metadata, SHA-256 | `src/main/indexer.cjs` | VERIFIED BY INTEGRATION TEST |
| LIB-006–007 | Cây folder cha–con/folder rỗng, filter descendants, discovery trước deep analysis | `database.cjs`, `indexer.cjs`, `App.tsx` | VERIFIED BY NESTED-FOLDER TEST; WINDOWS UI UNTESTED |
| SEA-001 | SQLite WAL, FTS5 search/filter/sort | `src/main/database.cjs` | VERIFIED BY TEST |
| AUD-001–004 | Audio protocol, waveform thật, preview player | `WaveformPlayer.tsx`, `main.cjs` | BUILD VERIFIED; DESKTOP RUNTIME UNTESTED |
| AUD-005–007 | BPM/key provenance, tempo sync preview, In/Out và xuất WAV mới | `utils.cjs`, `indexer.cjs`, `WaveformPlayer.tsx`, `main.cjs` | PARSER TESTED; AUDIO/UI RUNTIME UNTESTED |
| UX-001–003 | Studio layout theo mockup, cây Local Crate, resizable panes/cột và lưu layout | `App.tsx`, `styles.css` | TYPESCRIPT BUILD VERIFIED; VISUAL ACCEPTANCE PENDING |
| MEM-001–004 | Project và event provenance/count tách biệt | `database.cjs`, `App.tsx` | VERIFIED BY TEST |
| FLW-001–003 | Electron native file drag và fallback | `main.cjs`, `App.tsx` | IMPLEMENTED; FL STUDIO UNTESTED |
| LIC-001 | Source/license record | `database.cjs`, `App.tsx` | IMPLEMENTED; UI BUILD VERIFIED |
| SAF-001–003 | Exact duplicate report, không destructive | `database.cjs`, `App.tsx` | VERIFIED BY TEST |
| APP-003 | SQLite backup và JSON export | `database.cjs`, `main.cjs` | BACKUP VERIFIED BY TEST |

## Bằng chứng local hiện tại

Lệnh:

```text
npm run check
```

Kết quả:

- Node test: `10 passed / 0 failed`.
- Integration test tạo WAV thật, index, metadata, SHA-256, FTS search và backup: PASS.
- Integration test cây `Drums/Kicks`, `Drums/Snares`, `Vocals/Empty Pack`: giữ đủ 5 folder, folder rỗng, count toàn nhánh, filter descendants và BPM/key filename: PASS.
- Migration v2 tạo bản SQLite `before-v2` trước thay đổi schema và mở lại ở version 2: PASS.
- WAV hỏng vẫn hiện trong chỉ mục, BPM/key filename vẫn có provenance và `AUDIO_METADATA_UNREADABLE` được ghi thay vì nuốt lỗi: PASS.
- TypeScript `tsc --noEmit`: PASS.
- Vite production build: PASS.
- Renderer bundle được tạo thành công trong `dist/`.

## Bằng chứng Windows CI của redesign

- Workflow: `Windows Build`.
- Run: [`29214548160`](https://github.com/studiozengermany-cmd/MH-SAMPLE-FL-2026-/actions/runs/29214548160).
- Commit: `8e45bcee609a1dd71402ab23ee4a895872f10070`.
- Install dependencies: PASS.
- 10/10 tests trên Windows: PASS.
- TypeScript/Vite production build: PASS.
- Electron-builder NSIS: PASS.
- Smoke launch packaged `MH Sample FL.exe` trong 8 giây: PASS.
- Upload artifact: PASS.
- Artifact: `MH-Sample-FL-Windows-8e45bcee609a1dd71402ab23ee4a895872f10070`.
- Artifact size: `100,194,059 bytes`.
- Artifact digest: `sha256:cd040e329c7b2351717bc7d94bf14972b3ac30051be3d042d857cc2603c41378`.
- GitHub expiry hiện tại: `27/07/2026`; có thể build lại từ source bất kỳ lúc nào.

Smoke launch đã chứng minh bản đóng gói khởi động và giữ process sống trên Windows runner. Nó chưa thay thế nghiệm thu thao tác thật trên Windows 10 và FL Studio của chủ dự án.

Artifact cũ của run `29212590864` thuộc giao diện bị từ chối ngày 13/07/2026 và chỉ còn là bằng chứng CI lịch sử. Artifact của run `29214548160` là baseline redesign đầu tiên để chủ dự án kiểm tra.

## Chưa được phép tuyên bố hoàn thành

- Chưa chạy cửa sổ Electron thật trong sandbox vì binary Electron không tải được tại môi trường này.
- Đã build bộ cài bằng Windows GitHub runner; chưa khởi động/cài trên Windows 10 của chủ dự án.
- Chưa kiểm thử native drag với Channel Rack, Playlist, Sampler của FL Studio.
- Chưa chạy performance test với thư viện 100.000 sample.
- Chưa kiểm thử crash/power-loss thực tế trên Windows.

Các mục trên phải giữ trạng thái `UNTESTED` cho tới khi GitHub Actions hoặc máy Windows cung cấp log/bằng chứng thật.

## Lỗi đã được test phát hiện và sửa

1. `bm25()` không hợp lệ trong truy vấn FTS có `GROUP BY`: đã thay tag aggregation bằng correlated subquery và dùng FTS rank.
2. File watcher giữ debounce timer sau khi database đóng: đã quản lý watcher/timer record và hủy sạch trong `close()`.
3. Backup API ban đầu gọi sai trên `DatabaseSync`: đã chuyển sang hàm `backup()` chính thức của `node:sqlite` và có integration test.
4. Windows CI phát assertion khi integration test tạo watcher rồi xóa thư mục tạm: đã thêm chế độ `watch:false` dành riêng cho test; ứng dụng thật vẫn bật watcher.
5. Electron-builder đã tạo xong installer nhưng CI fail vì implicit publish đòi `GH_TOKEN`: đã khóa `--publish never`; workflow chỉ upload artifact, không tự phát hành GitHub Release.

## Gate kế tiếp

`WIN-GATE-001`:

1. GitHub Actions Windows phải chạy `npm ci`, `npm run check`, `npm run dist:win` thành công.
2. Tải artifact và cài trên Windows 10.
3. Add Folder → scan WAV thật → search → preview → create project → drag sang FL → confirm usage → backup.
4. Ghi log/screenshot/video và cập nhật bảng này.
