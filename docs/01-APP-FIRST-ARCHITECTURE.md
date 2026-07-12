# Kiến trúc app-first

## 1. Nguyên tắc

Ứng dụng desktop là sản phẩm hoàn chỉnh, không phải “launcher chờ VST3”. VST3 tương lai là client mỏng của cùng domain và dữ liệu; việc bỏ VST3 khỏi máy không được làm mất chức năng quản lý thư viện.

## 2. Stack đề xuất

- Desktop shell/UI: Tauri + React + TypeScript.
- Core/engine: Rust.
- Database: SQLite với WAL, FTS và migrations.
- Audio: Rust audio service; thư viện decoder được chốt sau Technical Gate B.
- Windows integration: module riêng cho long path, file identity, watcher và OLE drag.
- VST3 giai đoạn 2: C++/JUCE, giao tiếp với local engine qua IPC; không nằm trong repository code ở giai đoạn hiện tại.

Tauri là lựa chọn khởi đầu, nhưng chỉ được khóa sau proof-of-concept native file drag sang FL Studio. Nếu webview không cung cấp luồng drag-out ổn định, nhóm phải đánh giá native helper hoặc shell khác trước khi xây UI lớn.

## 3. Các lớp

```text
Presentation (React UI)
        ↓ commands / queries
Application (use cases, validation, permissions)
        ↓
Domain (entities, value objects, policies)
        ↓ ports
Infrastructure (SQLite, filesystem, audio, Windows APIs)
```

### Presentation

- Render UI và state.
- Không mở file, scan thư mục hoặc query SQLite trực tiếp.
- Không tự suy diễn trạng thái Indexed/Used/Verified.

### Application

- Commands: add root, start scan, tag file, create project, record memory, simulate duplicate action.
- Queries: search, load inspector, library health, project history, license report.
- Validation, authorization theo root, transaction boundary và error mapping.

### Domain

- LibraryRoot, Sample, Project, Memory, License, DuplicateGroup và Job.
- Quy tắc read-only nguồn, provenance, confidence và safety policies.
- Không phụ thuộc Tauri, React, SQLite hoặc Windows UI.

### Infrastructure

- SQLite repositories và migrations.
- File scanner/watcher/hash.
- Audio decoder/player/waveform.
- Windows native drag, file identity và path handling.
- Backup, logs và installer integration.

## 4. Background workers

- `discovery-worker`: tìm file và cập nhật path/status.
- `metadata-worker`: đọc metadata nhanh.
- `hash-worker`: tính exact hash theo queue.
- `waveform-worker`: sinh peak cache.
- `analysis-worker`: BPM/key/category, được ưu tiên thấp và có thể tắt.
- `watcher-worker`: xử lý change events và lên lịch incremental jobs.

Worker phải có cancel token, progress, retry giới hạn, persisted checkpoint và resource budget. UI gọi command; không chạy workload nặng trên UI thread.

## 5. Technical gates trước khi scaffold lớn

### Gate A — Desktop drag sang FL Studio

- Proof-of-concept một cửa sổ desktop kéo WAV/MP3/AIFF sang Channel Rack, Playlist và Sampler.
- Test Unicode path, path dài, file trên ổ khác, FL đang playback và drop rejected.
- Kết quả accepted chỉ ghi `sent_to_fl`.
- Nếu thất bại, chốt fallback và shell strategy trước khi tiếp tục.

### Gate B — Audio pipeline

- Decode các định dạng MVP, seek, waveform và chuyển sample liên tục.
- 500 lần play/stop/switch không crash, không rò handle và không phát chồng.

### Gate C — Index/search 100k

- Seed 100.000 metadata records; đo scan, batch insert, FTS, filter và virtual list.
- UI vẫn tương tác khi index nền.

### Gate D — Crash/database recovery

- Kill app giữa scan/write; mở lại không corrupt và job có thể resume/retry.
- Backup/restore database thử thật.

## 6. Chuẩn bị cho VST3 mà không xây VST3

- Stable IDs không dựa duy nhất vào absolute path.
- Commands/queries có DTO versioned.
- Event provenance rõ ràng.
- Schema migrations có version.
- Domain và application độc lập UI.
- Không để desktop UI sở hữu logic nghiệp vụ.

Khi sang giai đoạn 2, local IPC được đặt trước application layer. VST3 không được mở database trực tiếp nếu điều đó gây coupling, lock hoặc crash surface trong FL Studio.

