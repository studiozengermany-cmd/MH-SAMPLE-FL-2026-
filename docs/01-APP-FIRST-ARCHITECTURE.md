# Kiến trúc app-first

## 1. Nguyên tắc

Ứng dụng desktop là sản phẩm hoàn chỉnh, không phải “launcher chờ VST3”. VST3 tương lai là client mỏng của cùng domain và dữ liệu; việc bỏ VST3 khỏi máy không được làm mất chức năng quản lý thư viện.

## 2. Stack đề xuất

- Desktop shell: Electron.
- UI: React + TypeScript + Vite.
- Core/engine v0.1: Node.js main process, tách module database/indexer/platform khỏi renderer.
- Database: `node:sqlite` với SQLite WAL, FTS5 và migrations.
- Audio metadata: `music-metadata`; preview và waveform dùng Chromium Web Audio qua protocol nội bộ.
- Windows integration: Electron `webContents.startDrag`, shell APIs, long path và filesystem watcher.
- VST3 giai đoạn 2: C++/JUCE, giao tiếp với local engine qua IPC; không nằm trong repository code ở giai đoạn hiện tại.

Electron được chọn cho bản desktop đầu tiên vì có API native file drag rõ ràng, renderer Chromium hỗ trợ audio/waveform và Node main process truy cập filesystem mà vẫn giữ `contextIsolation`. Quyết định này không chứng minh FL Studio đã nhận mọi target; FL drag vẫn là Technical Gate A cần kiểm thử trên Windows thật.

## 3. Các lớp

```text
Presentation (React renderer, không có Node integration)
        ↓ commands / queries
Preload IPC allowlist (contextBridge)
        ↓
Electron Main/Application handlers
        ↓
Infrastructure modules (SQLite, indexer, filesystem, audio protocol)
```

### Presentation

- Render UI và state.
- Không mở file, scan thư mục hoặc query SQLite trực tiếp.
- Không tự suy diễn trạng thái Indexed/Used/Verified.

### Preload IPC

- Chỉ expose allowlist method cụ thể qua `contextBridge`.
- `contextIsolation=true`, `nodeIntegration=false`, `sandbox=true`.
- Renderer không nhận quyền gọi filesystem hoặc shell tùy ý.

### Application

- Commands: add root, start scan, tag file, create project, record memory, simulate duplicate action.
- Queries: search, load inspector, library health, project history, license report.
- Validation, authorization theo root, transaction boundary và error mapping.

### Infrastructure

- SQLite repositories và migrations.
- File scanner/watcher/hash.
- Audio decoder/player/waveform.
- Windows native drag, file identity và path handling.
- Backup, logs và installer integration.

## 4. Background workers

- `LibraryIndexer.walk`: tìm file theo scope root.
- `LibraryIndexer.metadata`: đọc metadata nhanh.
- `hashFile`: tính SHA-256 theo stream, không giữ toàn file trong RAM.
- Renderer waveform: decode file đang chọn, không phân tích cả thư viện nền.
- `fs.watch`: phát hiện thay đổi và debounce incremental rescan; manual rescan luôn tồn tại.

Worker phải có cancel token, progress, retry giới hạn, persisted checkpoint và resource budget. UI gọi command; không chạy workload nặng trên UI thread.

## 5. Technical gates trước khi scaffold lớn

### Gate A — Desktop drag sang FL Studio (`IMPLEMENTED / FL UNTESTED`)

- Proof-of-concept một cửa sổ desktop kéo WAV/MP3/AIFF sang Channel Rack, Playlist và Sampler.
- Test Unicode path, path dài, file trên ổ khác, FL đang playback và drop rejected.
- Kết quả accepted chỉ ghi `sent_to_fl`.
- Nếu thất bại, chốt fallback và shell strategy trước khi tiếp tục.

### Gate B — Audio pipeline (`PARTIALLY VERIFIED`)

- Decode các định dạng MVP, seek, waveform và chuyển sample liên tục.
- 500 lần play/stop/switch không crash, không rò handle và không phát chồng.

### Gate C — Index/search 100k (`NOT RUN`)

- Seed 100.000 metadata records; đo scan, batch insert, FTS, filter và virtual list.
- UI vẫn tương tác khi index nền.

### Gate D — Crash/database recovery (`PARTIALLY VERIFIED`)

- Kill app giữa scan/write; mở lại không corrupt và job có thể resume/retry.
- Backup/restore database thử thật.

## 6. Chuẩn bị cho VST3 mà không xây VST3

- Stable IDs không dựa duy nhất vào absolute path.
- Commands/queries có DTO versioned.
- Event provenance rõ ràng.
- Schema migrations có version.
- Domain và application độc lập UI.
- Không để desktop UI sở hữu logic nghiệp vụ.

Nếu v0.1 chứng minh Node main process không đủ hiệu năng ở thư viện lớn, engine Rust chỉ được mở bằng ADR có benchmark. Không rewrite vì sở thích công nghệ. Khi sang giai đoạn 2, local IPC được đặt trước application layer; VST3 không được mở database trực tiếp nếu điều đó gây coupling, lock hoặc crash surface trong FL Studio.
