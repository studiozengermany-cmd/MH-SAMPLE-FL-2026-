# Cam kết thực thi và truy vết yêu cầu

## 1. Cam kết sở hữu

MH Sample FL không phải tài liệu “gợi ý cho một AI khác tự đoán”. Người lập đặc tả phải chịu trách nhiệm duy trì tính nhất quán giữa yêu cầu, kiến trúc, kế hoạch code, kết quả kiểm thử và trạng thái công bố.

Không một chức năng nào được xem là hoàn thành chỉ vì giao diện đã xuất hiện hoặc code đã build. Mỗi chức năng phải chứng minh được hành vi, an toàn dữ liệu, trạng thái lỗi và khả năng phục hồi đúng như đặc tả.

## 2. Chuỗi truy vết bắt buộc

```text
Requirement ID
    → GitHub Issue
    → Architecture/Data decision
    → Code/Commit/PR
    → Automated tests
    → Manual evidence khi cần
    → Acceptance result
    → Chủ dự án phê duyệt
```

Thiếu bất kỳ mắt xích nào thì trạng thái tối đa là `IN PROGRESS` hoặc `UNVERIFIED`, không được ghi `DONE`.

## 3. Mã yêu cầu nền tảng

### Ràng buộc dự án

- `GOV-001`: Dự án greenfield; không kế thừa code cũ.
- `GOV-002`: Chỉ thao tác trong repository MH Sample FL mới.
- `GOV-003`: Không fake UI, hard-code dữ liệu vận hành hoặc placeholder giả hoàn thành.
- `GOV-004`: Mọi thay đổi phạm vi phải có ADR và phê duyệt của chủ dự án.
- `GOV-005`: Mọi tuyên bố tested/done phải có evidence.

### Ứng dụng desktop

- `APP-001`: Ứng dụng chạy độc lập, không phụ thuộc VST3.
- `APP-002`: Chạy local-first, không bắt buộc Internet/tài khoản/API key.
- `APP-003`: Database, cache và backup có thể đặt trên ổ do người dùng chọn.
- `APP-004`: UI tiếng Việt mặc định và có đầy đủ loading/empty/error/recovery states.
- `APP-005`: Background jobs không khóa UI.

### Thư viện và dữ liệu

- `LIB-001`: Chỉ scan thư mục người dùng đã chọn.
- `LIB-002`: Add/remove index không sửa hoặc xóa file nguồn.
- `LIB-003`: Index tăng dần, có pause/resume/cancel/retry và crash recovery.
- `LIB-004`: Hỗ trợ Unicode, đường dẫn dài và ổ bị ngắt kết nối.
- `LIB-005`: Tất cả trạng thái Indexed/Pending/Missing/Error lấy từ dữ liệu thật.
- `LIB-006`: Mọi root phải giữ nguyên cây thư mục cha–con, bao gồm folder rỗng; cấm gộp folder con thành một danh sách phẳng.
- `LIB-007`: Fast discovery phải đưa folder/file vào UI trước deep metadata/hash; progress tách `discovered` và `analyzed`.

### Search và audio

- `SEA-001`: Search/filter/sort đúng dữ liệu và đạt performance budget đã đo.
- `SEA-002`: Virtual list cho thư viện lớn và không giữ inspector cũ khi selection mất.
- `AUD-001`: Waveform sinh từ file thật.
- `AUD-002`: Chỉ một sample phát tại một thời điểm.
- `AUD-003`: Gain/normalize chỉ nghe thử và không đổi checksum file gốc.
- `AUD-004`: Decode error/unsupported có thông báo và không làm app crash.
- `AUD-005`: BPM/key phải ghi giá trị, nguồn và confidence; không có bằng chứng thì hiển thị `Chưa xác minh`.
- `AUD-006`: Preview tempo-sync dùng BPM project và không sửa file nguồn.
- `AUD-007`: Vùng In/Out tự nạp sample đang chọn, nghe được vùng và chỉ xuất thành file WAV mới theo đường dẫn người dùng xác nhận.

### Giao diện và thao tác

- `UX-001`: Màn hình thư viện bám bố cục mockup đã duyệt: Local Crate, results, sample inspector, waveform, Project Memory và vùng drag rõ ràng.
- `UX-002`: Sidebar, chiều cao results/inspector, chiều rộng Project Memory và từng cột bảng có thể kéo đổi kích thước, được lưu và có Reset Layout.
- `UX-003`: Icon outline đồng nhất; không emoji, số liệu giả, card trang trí hoặc giao diện SaaS/AI chung chung.

### Project Memory

- `MEM-001`: Mọi memory event có source, confidence và timestamp.
- `MEM-002`: Preview, sent-to-FL, confirmed usage và verified reference là bốn loại riêng.
- `MEM-003`: `sent_to_fl` không được hiển thị thành `used_in_project`.
- `MEM-004`: Có project workspace, role, style, note và manifest export.

### Desktop-to-FL

- `FLW-001`: Native drag từ desktop app phải pass Technical Gate A trước khi quảng bá.
- `FLW-002`: Drop rejected không làm mất selection hoặc tạo usage giả.
- `FLW-003`: Có fallback Open in Folder và Copy Path.
- `FLW-004`: Test trên target FL Studio được ghi rõ; không suy rộng sang target chưa test.

### Safety và license

- `SAF-001`: Source audio read-only mặc định.
- `SAF-002`: MVP duplicate chỉ report/simulate, không auto-delete/hard-link.
- `SAF-003`: Exact duplicate chỉ được kết luận sau hash verification.
- `SAF-004`: Mọi hành động filesystem tương lai cần dry-run, scope, confirm, log và rollback policy.
- `LIC-001`: Source/license/evidence có provenance; không tự kết luận pháp lý.

## 4. Trạng thái chuẩn

- `PROPOSED`: mới đề xuất, chưa duyệt.
- `APPROVED`: yêu cầu đã duyệt, chưa code.
- `IN PROGRESS`: đang code hoặc test.
- `IMPLEMENTED / UNVERIFIED`: có code nhưng chưa đủ bằng chứng.
- `VERIFIED`: test và evidence đạt.
- `ACCEPTED`: chủ dự án nghiệm thu.
- `BLOCKED`: có nguyên nhân, người chịu trách nhiệm và bước gỡ chặn.
- `REJECTED`: không đạt hoặc bị loại khỏi phạm vi.

Chỉ `ACCEPTED` mới được ghi là hoàn thành đối với người dùng.

## 5. Cổng cứng VST3

`VST-GATE-000` mặc định là `BLOCKED BY POLICY` trong toàn bộ giai đoạn ứng dụng desktop.

Không được scaffold JUCE, thêm dependency VST SDK, tạo plugin shell hoặc dành sprint triển khai VST3 cho tới khi tất cả điều kiện sau đạt:

1. App Milestone 1–9 được `ACCEPTED` hoặc có danh sách ngoại lệ do chủ dự án ký duyệt.
2. Không còn blocker/critical liên quan mất dữ liệu, corrupt DB, sai usage hoặc crash FL.
3. Backup/restore, crash recovery, index/search, audio preview và desktop drag có evidence thật.
4. Private beta chứng minh nhu cầu mở workflow trong host.
5. Có ADR mới nêu mục tiêu, phạm vi, ngân sách, rủi ro và rollback của VST3.
6. Chủ dự án ra quyết định rõ ràng “Mở giai đoạn VST3”.

Trước quyết định đó, mọi yêu cầu VST3 chỉ được ghi vào tài liệu tương lai, không được đưa vào codebase hoặc Definition of Done của ứng dụng.

## 6. Báo cáo mỗi milestone

Mỗi checkpoint phải có:

- Requirement IDs trong phạm vi.
- File/code đã thay đổi.
- Tests đã chạy và kết quả.
- Tests chưa chạy và lý do.
- Performance measurements nếu có.
- Rủi ro/dữ liệu chưa xác minh.
- Screenshot/log/report làm bằng chứng.
- Quyết định tiếp tục, sửa hoặc dừng.

## 7. Quyền thay đổi đặc tả

Đặc tả có thể được sửa khi thực nghiệm chứng minh giả định sai, nhưng không được âm thầm đổi yêu cầu để hợp thức hóa code. Mọi thay đổi phải:

1. Nêu yêu cầu cũ.
2. Nêu bằng chứng vấn đề.
3. Nêu lựa chọn và hệ quả.
4. Cập nhật ADR, tests và backlog.
5. Được chủ dự án duyệt trước khi coi là baseline mới.
