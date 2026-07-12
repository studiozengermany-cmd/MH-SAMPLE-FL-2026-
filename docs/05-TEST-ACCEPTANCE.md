# Kiểm thử và nghiệm thu

## 1. Ma trận môi trường

- Windows 10 và Windows 11.
- SSD/NVMe, HDD chậm và ổ ngoài.
- Đường dẫn ASCII, tiếng Việt, ký tự đặc biệt và >260 ký tự.
- Thư viện 10k, 100k và stress 500k records.
- FL Studio stable mục tiêu; beta chỉ dùng kiểm tra sớm, không làm chuẩn duy nhất.

## 2. Dataset/fixtures

- WAV/AIFF/FLAC/MP3/OGG hợp lệ.
- File zero-byte, header hỏng, extension giả và permission denied.
- Exact duplicates khác tên/path.
- File cùng tên nhưng khác nội dung.
- Root bị rename, drive letter thay đổi và drive disconnected.
- Project/memory có path dài và note tiếng Việt.

Fixtures nhỏ được tạo hoặc cấp phép rõ ràng; không commit sample thương mại của người dùng.

## 3. Acceptance theo hệ thống

### Filesystem

- Chỉ scan roots đã chọn.
- Add/remove index không xóa nguồn.
- Rename/move/disconnect không crash.
- Watcher missed event có rescan/recovery.

### Database

- Migration mới/từ bản cũ test được.
- Kill process giữa transaction không corrupt.
- Backup tạo được, checksum đúng và restore mở được.

### Search

- Search/filter/sort cho kết quả đúng và có deterministic tests.
- 100k warm query P95 trong budget trên máy chuẩn được ghi rõ.
- Không kết quả không giữ inspector cũ.

### Audio

- Chỉ một player active.
- Seek/stop/switch đúng; unsupported/corrupt có error.
- Normalize/gain không đổi checksum file gốc.
- Không rò file handle sau soak test.

### Project Memory

- Mọi event có source/confidence.
- Counts preview/sent/confirmed/verified tách biệt.
- Export/import manifest giữ đúng IDs và timestamps.

### Drag sang FL

- Test Channel Rack, Playlist và target hỗ trợ.
- Accepted/rejected phản hồi đúng.
- Chỉ accepted mới tạo `sent_to_fl`; không tự tạo confirmed usage.

### Safety Lab

- Exact group chỉ gồm hash bằng nhau.
- File unreadable bị loại và báo lý do.
- Simulation không thay đổi path, content, timestamp hoặc link count.

## 4. Release gates

- `BLOCKER`: data loss, tự sửa sample, corrupt DB, crash FL, báo verified sai.
- `CRITICAL`: search/index sai diện rộng, restore thất bại, drag gây treo lặp lại.
- Không release khi còn blocker/critical chưa có workaround được chấp thuận.
- Mỗi release ghi OS/FL/format đã test, chưa test và log kiểm chứng.

