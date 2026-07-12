# Quy tắc bắt buộc cho kỹ sư và code agent

## Phạm vi

- Chỉ thao tác bên trong repository `MH-Sample-FL`.
- Không đọc, copy, import, merge hoặc sửa code từ repository/thư mục SampleGuard cũ.
- Tài liệu nguồn cũ chỉ được dùng để hiểu nhu cầu sản phẩm, không phải code mẫu.
- Không tạo VST3, JUCE project hoặc thư mục `plugins/` trong giai đoạn ứng dụng desktop.

## Quy trình trước khi code

1. Đọc `README.md` và toàn bộ tài liệu liên quan đến milestone.
2. Nêu phạm vi file sẽ thay đổi.
3. Viết kế hoạch và acceptance criteria.
4. Chờ duyệt nếu thay đổi kiến trúc, schema, thao tác filesystem hoặc phạm vi milestone.
5. Chỉ code đúng phần đã duyệt.

Mọi feature phải có Requirement ID trong `docs/08-EXECUTION-GOVERNANCE.md`. Commit hoặc pull request không có Requirement ID và acceptance evidence không được coi là hoàn thành.

## Chống phá dữ liệu

- Cấm tự động xóa, di chuyển, đổi tên hoặc ghi đè sample.
- Mọi thao tác rủi ro phải có dry-run, danh sách tác động, xác nhận và log.
- Không dùng lệnh destructive như reset hard, clean cưỡng bức hoặc xóa database nếu chưa được xác nhận rõ.
- Migrations database phải có backup và bài test nâng cấp.
- Source audio mặc định read-only.

## Trung thực chức năng

- Không placeholder, TODO giả hoàn thành hoặc nút không hoạt động trong bản được ghi là “đã xong”.
- Không hard-code số lượng sample, usage count, trạng thái Indexed/Missing hoặc kết quả scan.
- `Sent to FL` không được đổi nghĩa thành `Used in project`.
- Dữ liệu Project Memory phải có `source`, `confidence` và thời điểm ghi nhận.
- Tính năng chưa test phải ghi `UNTESTED`; đã test phải kèm lệnh/log/bằng chứng.
- Không dùng từ `Done`, `Hoàn thành`, `Production-ready` hoặc `Đã vận hành` nếu chưa đi đủ chuỗi Requirement → Issue → Code → Test → Evidence → Approval.

## Chất lượng code

- Domain không phụ thuộc UI framework.
- UI không truy cập filesystem hoặc SQLite trực tiếp; đi qua application commands/queries.
- Background indexing không được khóa UI.
- Không giữ file âm thanh đầy đủ trong RAM nếu không cần.
- Mọi lỗi người dùng có thể gặp phải có mã lỗi, thông báo tiếng Việt và hướng xử lý.
- Viết unit test cho domain; integration test cho database/indexer/audio; E2E cho workflow chính.

## Ngôn ngữ và giao diện

- UI tiếng Việt mặc định; filename, path, tên project và metadata nguyên bản được giữ nguyên.
- Không thêm dashboard, gamification, AI panel hoặc marketplace ngoài phạm vi.
- Không dùng màu làm tín hiệu trạng thái duy nhất.
