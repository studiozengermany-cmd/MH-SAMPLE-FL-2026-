# MH Sample FL — Đặc tả tổng thể

## 1. Tuyên bố sản phẩm

MH Sample FL là ứng dụng desktop Windows, local-first, giúp producer FL Studio quản lý thư viện sample như một hệ thống trí nhớ và bảo vệ dự án. Ứng dụng không thay thế Browser của FL Studio, không phải sample marketplace, không phải DAW và không lấy “AI” làm lý do tồn tại.

Sản phẩm giải quyết sáu câu hỏi thực tế:

1. Sample nằm ở đâu và còn tồn tại không?
2. Có thể tìm và nghe nó trong vài giây không?
3. Sample đã được dùng hoặc gửi sang project nào, với vai trò gì?
4. Sample đến từ pack/vendor/license nào?
5. Nếu dọn thư viện, project cũ có nguy cơ mất đường dẫn không?
6. Có thể đưa sample sang FL Studio nhanh mà không cần VST3 không?

### Lợi thế không được đánh mất

MH Sample FL không cạnh tranh bằng một danh sách tag/search giống các sample manager đang có. Sản phẩm phải kết hợp bốn thứ trong cùng workflow local:

1. Giữ nguyên cấu trúc folder thật và quyền sở hữu file của producer.
2. Project Memory nhớ quyết định, vai trò và provenance thay vì chỉ đếm lượt click.
3. BPM/key/sync/trim/drag phục vụ khoảnh khắc chọn sample, không đẩy producer qua nhiều màn hình.
4. Project-Safe Lab kiểm tra path, missing, duplicate và license trước khi producer dọn kho.

“Thông minh” chỉ được dùng khi hành vi có dữ liệu chứng minh: xếp hạng theo ngữ cảnh, nhớ lựa chọn, lọc đúng nhánh và báo rõ điều chưa biết. Không dùng AI panel hoặc copy marketing để che chức năng thiếu.

## 2. Ranh giới chính thức

### Có trong ứng dụng desktop

- Quản lý library roots do người dùng chủ động chọn.
- Scan tăng dần, rescan và theo dõi thay đổi filesystem.
- Database local, tìm kiếm, lọc, sắp xếp và virtual list.
- Audio preview, waveform thật và metadata kỹ thuật.
- Favorite, rating, tag, crate và smart collection cơ bản.
- Project Workspace và Project Memory có nguồn dữ liệu minh bạch.
- Kéo file từ ứng dụng desktop sang FL Studio bằng Windows drag payload.
- Missing-file workflow, path alias và locate/rescan.
- Exact duplicate report và mô phỏng tác động.
- Pack/source/license registry và xuất báo cáo.
- Backup, restore, diagnostics và tùy chọn lưu database/cache trên ổ khác.

### Không có trong giai đoạn ứng dụng

- VST3/JUCE/plugin chạy bên trong FL Studio.
- Tự động chỉnh sửa file `.flp`.
- Tự nhận biết chắc chắn project hiện tại của FL nếu không có nguồn xác minh.
- Auto-delete, auto-move, auto-hard-link.
- Cloud sync bắt buộc, tài khoản bắt buộc hoặc marketplace.
- Generative audio, AI panel trang trí hoặc natural-language search chưa chứng minh giá trị.

## 3. Đối tượng sử dụng

- Producer có hàng nghìn đến hàng trăm nghìn sample.
- Sample nằm trên nhiều ổ đĩa, pack và cấu trúc thư mục.
- Làm việc chính trên Windows 10/11 và FL Studio.
- Cần phản hồi nhanh, thao tác chuột/bàn phím và drag-and-drop.
- Sợ dọn thư viện vì có thể làm hỏng project cũ.
- Muốn ứng dụng chạy local, không tốn API và không gửi âm thanh ra ngoài.

## 4. Các module bắt buộc

### 4.1 Onboarding và Settings

- Chọn thư mục sample đầu tiên.
- Chọn vị trí database, cache và backup; hỗ trợ ổ `J:`.
- Kiểm tra quyền đọc/ghi của vị trí dữ liệu.
- Chọn ngôn ngữ, theme, audio output và giới hạn tài nguyên scan.
- Giải thích local-first và phạm vi thư mục được quét.
- Import/export settings; integrity check; rebuild index/cache.

### 4.2 Local Crate và Library Roots

- Add, disable, remove from index và rescan root.
- Không xóa thư mục thật khi remove from index.
- Recursive scan, extension include/exclude và folder exclude.
- Nhận biết local drive, removable drive, network path và disconnected state.
- Hiển thị file count, size, indexed/pending/missing/error và last scanned.
- Scan pause/resume/cancel/retry; progress và error log thật.

### 4.3 Indexing Engine

- Discover file, metadata, stable ID, hash và trạng thái.
- Incremental index; không quét lại toàn bộ khi không cần.
- Background queue có độ ưu tiên và phục hồi sau restart.
- File watcher cho create/modify/rename/delete.
- Long-path và Unicode tiếng Việt.
- File identity/path history để xử lý rename hoặc move.
- Tách fast index và deep analysis để UI dùng được sớm.

### 4.4 Search và Collections

- Search filename, path, pack, tag, note và project memory.
- Fuzzy search; search trong root hoặc toàn library.
- Filter theo type, category, BPM, key, duration, sample rate, bit depth, channel, favorite, rating, used/unused, license và availability.
- Sort relevance/name/date/duration/usage/rating.
- Saved search, recent search, crate, smart crate và bulk actions.
- Virtual scrolling; empty/loading/error/partial-index states.

### 4.5 Audio Preview

- Decode WAV, AIFF, FLAC, MP3 và OGG; định dạng khác phải hiện unsupported rõ ràng.
- Play/pause/stop/seek/previous/next/loop/autoplay.
- Waveform cache thật, playhead và thời gian thật.
- Hiển thị BPM/key gốc cùng nguồn/confidence; sync preview theo BPM project và giữ pitch khi runtime hỗ trợ.
- Vùng cắt In/Out tự nạp sample đang chọn, nghe vùng và xuất WAV mới; không ghi đè nguồn.
- Volume, output device, buffer; normalize/gain chỉ dùng để nghe thử.
- Không ghi đè audio gốc.
- Chỉ một sample phát tại một thời điểm; decode error có cách xử lý.

### 4.6 Metadata và Producer Organization

- Technical metadata: codec, duration, sample rate, bit depth, channels, size và timestamps.
- Favorite, rating, tags, category, pack/source, color label và note.
- Bulk edit có undo.
- Exact hash và audio fingerprint được lưu riêng.
- Manual override cho BPM/key/category tự động; giữ giá trị gốc, giá trị sửa và confidence.

### 4.7 Project Workspace và Project Memory

- Tạo/chọn project hiện tại trong app.
- Tên project, path tùy chọn, style, BPM/key tùy chọn và note.
- Gắn sample với role, status và producer note.
- Phân biệt `previewed`, `sent_to_fl`, `user_confirmed`, `manifest_imported`, `verified`.
- Usage count không trộn preview count với project usage count.
- Mọi entry có source, confidence, created_at và updated_at.
- Xuất project manifest; mở folder/project khi path tồn tại.

### 4.8 Desktop-to-FL Workflow

- Native Windows file drag từ app sang FL Studio là Technical Gate A.
- Payload phải dùng file path thật và không tạo bản sao bí mật.
- Khi OS báo drop accepted, app ghi `sent_to_fl`, không ghi `used_in_project`.
- Nếu không hỗ trợ target, giữ selection và đưa fallback Open in Folder/Copy Path.
- Không vẽ vùng “DROP HERE” giả bên trong FL Studio.

### 4.9 Source và License Guard

- Vendor, pack, source URL, purchase date, order ID và license type.
- Evidence attachment/reference, checksum và note.
- Pack-level inheritance và per-file override.
- Status verified/unknown/restricted/needs-review.
- Project asset/license report CSV/JSON trước; PDF thuộc bản sau.
- Ứng dụng quản lý bằng chứng, không tự đưa kết luận pháp lý.

### 4.10 Missing, Duplicate và Safety Lab

- Missing detection, locate replacement, rescan và path alias.
- Exact duplicate bằng cryptographic hash; near-duplicate tách riêng và không dùng để xóa.
- Chọn canonical file, xem locations và project/memory references.
- Dry-run hiển thị file, path, size, hash, tác động và điều kiện không đạt.
- MVP chỉ report/simulate; apply hard-link là tính năng advanced sau kiểm chứng riêng.
- Mọi thay đổi filesystem cần backup/manifest/log/rollback policy và xác nhận cụ thể.

### 4.11 Reliability và Diagnostics

- Atomic database writes, WAL, migrations và integrity check.
- Backup tự động/thủ công; restore được test thật.
- Crash recovery và job resume.
- Local logs có redaction; export support bundle theo lựa chọn người dùng.
- Safe mode, rebuild search index và rebuild waveform cache.
- Installer/uninstaller không xóa sample; uninstall hỏi giữ hay xóa app data.

## 5. Mục tiêu hiệu năng

Đây là budget nghiệm thu, phải đo trên máy thật trước khi tuyên bố đạt:

- Cold start mục tiêu 2–3 giây trên SSD với database đã tạo.
- Warm search P95 dưới 150 ms với 100.000 bản ghi.
- Preview local bắt đầu mục tiêu dưới 250 ms.
- Cuộn 100.000 kết quả không giật nhờ virtualization.
- UI không bị khóa khi scan, hash hoặc tạo waveform.
- Idle CPU gần 0 khi không scan/phát; memory có budget và cache có giới hạn.
- Mất điện/crash giữa job không làm hỏng database hoặc mất lịch sử đã commit.

## 6. Định nghĩa hoàn thành

Một tính năng chỉ được đánh dấu Done khi:

1. Có dữ liệu thật và không hard-code.
2. Có loading, empty, success, error và recovery state phù hợp.
3. Có unit/integration/E2E test tương ứng với mức rủi ro.
4. Có log hoặc bằng chứng test.
5. Không làm thay đổi file nguồn ngoài phạm vi người dùng xác nhận.
6. Tài liệu và migration được cập nhật.
