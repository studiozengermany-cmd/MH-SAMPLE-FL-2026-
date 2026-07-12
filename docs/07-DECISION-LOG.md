# Nhật ký quyết định

## ADR-001 — Đổi tên thành MH Sample FL

- Ngày: 12/07/2026
- Trạng thái: Accepted
- Quyết định: tên chính thức là **MH Sample FL**; các tên SampleGuard FL/Sample FL cũ chỉ còn giá trị lịch sử nghiên cứu.

## ADR-002 — Greenfield tuyệt đối

- Ngày: 12/07/2026
- Trạng thái: Accepted
- Quyết định: tạo repository/thư mục mới; không copy, merge hoặc sửa repository cũ vì trạng thái cũ không đáng tin cậy.
- Hệ quả: code mới phải chứng minh từ đầu; tài liệu cũ chỉ là nguồn yêu cầu.

## ADR-003 — Ứng dụng trước, VST3 sau

- Ngày: 12/07/2026
- Trạng thái: Accepted
- Quyết định: desktop app là giai đoạn 1; VST3 bị loại khỏi MVP và chỉ mở bằng phê duyệt riêng sau private beta.
- Hệ quả: Project Memory giai đoạn app phải dùng provenance trung thực; không phụ thuộc plugin state.

## ADR-004 — Local-first, không API bắt buộc

- Ngày: 12/07/2026
- Trạng thái: Accepted
- Quyết định: core chạy offline, không tài khoản/API key/cloud bắt buộc; telemetry opt-in nếu sau này có.

## ADR-005 — File nguồn read-only mặc định

- Ngày: 12/07/2026
- Trạng thái: Accepted
- Quyết định: MVP không xóa, di chuyển, đổi tên, hard-link hoặc ghi đè sample. Safety Lab chỉ report và simulate.

## ADR-006 — Không nói quá mức về usage

- Ngày: 12/07/2026
- Trạng thái: Accepted
- Quyết định: preview, sent-to-FL, confirmed usage và verified reference là các event khác nhau; UI và count phải tách riêng.

## ADR-007 — Truy vết và trách nhiệm thực thi

- Ngày: 12/07/2026
- Trạng thái: Accepted
- Quyết định: mọi feature phải đi đủ chuỗi Requirement → Issue → Code → Test → Evidence → Approval; thiếu một mắt xích không được ghi Done.
- Hệ quả: `docs/08-EXECUTION-GOVERNANCE.md` là quy tắc bắt buộc cho toàn bộ quá trình triển khai.

## ADR-008 — Khóa VST3 bằng policy gate

- Ngày: 12/07/2026
- Trạng thái: Accepted
- Quyết định: `VST-GATE-000` bị khóa cho tới khi ứng dụng desktop hoàn tất nghiệm thu nền tảng và chủ dự án mở giai đoạn bằng quyết định riêng.

## Quyết định đang chờ Gate

- Shell cuối cùng: Tauri hay phương án khác, sau Gate A.
- Audio decoder/player libraries, sau Gate B.
- File watcher strategy chi tiết và optional USN, sau prototype.
- Near-duplicate/similar-sound, sau khi exact duplicate MVP ổn định.
