# VST3 — Giai đoạn 2, chưa triển khai

## Điều kiện được phép bắt đầu

VST3 chỉ được mở dự án khi:

1. Ứng dụng desktop hoàn thành private beta và dùng ổn định.
2. Schema, stable IDs và application commands/queries đã ổn định.
3. Desktop-to-FL workflow có dữ liệu thực tế chứng minh nhu cầu plugin.
4. Có quyết định riêng về ngân sách C++/JUCE, QA host và support.
5. Chủ dự án phê duyệt bằng ADR mới.

## Vai trò dự kiến

- Search/preview nhẹ ngay trong FL Studio.
- Hiển thị crates và Project Memory.
- Lưu project UUID và UI state trong plugin state.
- Gửi commands/queries tới local engine qua IPC.
- Không index, hash, scan hoặc ghi database nặng trong audio callback.

## Không được giả định trước

- Plugin kéo file sang mọi target của FL ổn định.
- Host cung cấp đường dẫn `.flp` chuẩn.
- Plugin tự biết sample đã nằm trong arrangement.
- Plugin có thể mở database trực tiếp mà không có rủi ro locking/crash.

## Gates VST3 tương lai

- JUCE shell load/save/reopen không crash.
- Plugin state persistence qua save/new version/autosave/clone.
- IPC disconnect/reconnect không treo FL.
- Idle CPU/memory thấp và không audio dropout.
- Drag/drop host-specific test matrix.
- Installer/update không sửa plugin khi FL đang chạy.

Không tạo code, folder hay dependency VST3 trong giai đoạn ứng dụng desktop.

