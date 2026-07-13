# MH Sample FL — Desktop Studio Design System

## Nguồn chuẩn

Năm ảnh `MUC TIEU DU AN` do chủ dự án cung cấp là visual baseline. Đây là ứng dụng desktop studio dày thông tin, không phải financial dashboard, SaaS dashboard, newsletter hoặc AI assistant.

## Bố cục

- Local Crate trái: 230–440 px, cây folder thật, kéo resize.
- Workspace phải: top search 67 px; results linh hoạt; inspector 250–620 px; Project Memory 250–480 px.
- Các cột Name, Type, Folder/Pack, BPM, Key, Usage, Duration kéo resize độc lập.
- Kích thước được lưu local; luôn có Reset Layout.
- FL Studio chỉ xuất hiện như ngữ cảnh ngoài app; không nhúng ảnh/khung FL giả.

## Màu và typography

- Background `#070b0f`; surface `#0d1318`; elevated `#11191f`.
- Border `#223039`, border mềm `#18242b`.
- Primary teal `#19c8cf`; teal sáng `#39e2df`.
- Green chỉ trạng thái xác minh/khả dụng; amber cho vùng trim/cảnh báo; rose cho lỗi/missing; purple cho Safety Lab.
- Font hệ thống Windows (`Segoe UI Variable`, `Segoe UI`) để hiển thị tiếng Việt ổn định và không phụ thuộc Internet.
- Tên sample 10.5–12 px; metadata 8–10 px; tiêu đề inspector 17 px. Dense nhưng không dính chữ.

## Thành phần bắt buộc

- Icon SVG outline cùng stroke; cấm emoji/ký tự giả icon.
- Selected row có nền teal tối và vạch focus trái, không glow lớn.
- BPM/key phải đi cùng provenance/confidence; thiếu dữ liệu ghi `Chưa xác minh`.
- Waveform là trọng tâm inspector, không phải card trang trí.
- Vùng `Kéo sample này sang FL Studio` nhìn thấy ngay và có fallback Mở folder/Copy path.
- Resizer có hover/focus rõ; trạng thái control gồm default, hover, focus, active, disabled, loading, error, success.

## Chống giao diện “AI”

- Không gradient tím-xanh trang trí, card bo tròn dày đặc, hero, KPI giả, mascot hoặc copy khoa trương.
- Không hard-code sample count, BPM, key, usage, scan status hoặc “AI detected”.
- Không ghi `Đã dùng` khi chỉ biết người dùng bắt đầu kéo.
- Không cố nhét mọi feature lên một màn; ưu tiên workflow Search → Select → Preview/Sync/Trim → Drag → Memory.

## Checklist nghiệm thu

- [ ] Cây folder giữ đúng hierarchy và folder rỗng.
- [ ] Không tràn chữ/path ở 1280×720, 1600×900 và scale Windows 125%.
- [ ] Pane/cột kéo được, persist và reset được.
- [ ] Focus keyboard nhìn thấy; không dùng màu là tín hiệu duy nhất.
- [ ] Waveform tự nạp selection; BPM/key/source hiển thị trung thực.
- [ ] Trim xuất file mới; file nguồn không đổi.
- [ ] Drag card và fallback hoạt động trên Windows; FL Studio acceptance còn `UNTESTED` cho tới khi có video/log thật.
