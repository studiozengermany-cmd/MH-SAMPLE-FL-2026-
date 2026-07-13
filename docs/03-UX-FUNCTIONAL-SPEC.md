# Đặc tả UI và hành vi

## 1. Ngôn ngữ thiết kế

- Desktop dark studio aesthetic, không phải dashboard SaaS.
- Nền tối, surface phân cấp nhẹ, cyan/teal cho focus và hành động chính.
- Green/amber/rose/purple chỉ dùng cho semantic state.
- Font hỗ trợ tiếng Việt; icon outline đồng nhất; không emoji hoặc neon dư thừa.
- Spacing 8/12/16/24/32 px; control cao 36–44 px; sidebar 260–300 px.
- Desktop từ 1280 px; dưới 1024 px chỉ cần chế độ đọc/collapse hợp lý, không nhồi ba pane.
- Năm ảnh `MUC TIEU DU AN` là visual baseline: độ dày thông tin, Local Crate, table selection, inspector/waveform, Project Memory và vùng drag phải cùng ngôn ngữ studio; phần FL Studio trong ảnh chỉ là bối cảnh workflow, không được nhúng giả vào app.

## 2. App shell

- Title bar, sidebar, top bar, workspace, inspector, status bar.
- Global notification, job monitor, diagnostics và error boundary.
- Mỗi icon-only control có tooltip, aria-label và focus state.

## 3. Routes chính

### Khởi tạo

Chọn data/cache/backup → Add Folder → quyền truy cập → fast index → vào Search. Có thể bỏ qua deep analysis và tiếp tục sau.

### Tìm và nghe

Search → filters → results table → inline preview → inspector → favorite/tag/crate/note → drag/open/copy.

### Lịch sử dự án

Chọn project → xem memories → phân loại theo nguồn/confidence → xác nhận role/style/note → export manifest.

### Library Health

Indexed/Pending/Missing/Error → mở chi tiết root/job → locate/rescan/retry → không có hành động phá hủy mặc định.

### Safety Lab

Chọn scope → scan/hash → exact groups → chọn canonical candidate → simulate → xem report. MVP kết thúc ở report; apply là disabled/absent nếu chưa được phê duyệt.

## 4. Component bắt buộc

- `AppShell`, `TitleBar`, `CrateSidebar`, `LibraryRootItem`, `LibraryHealthSummary`.
- `GlobalSearch`, `FilterDrawer`, `ActiveFilterChips`, `SortMenu`, `ViewSwitcher`.
- `ResultsTable`, `SampleRow`, `InlinePlayer`, `FavoriteButton`, `BulkActionBar`.
- `SampleInspector`, `MetadataStrip`, `TagEditor`, `SourceLicenseCard`.
- `WaveformPlayer`, `TransportControls`, `GainControl`, `OutputDeviceMenu`.
- `TempoKeyStrip`, `TempoSync`, `TrimRegion`, `TrimWavExport`, `DragToFlCard`.
- `ProjectSelector`, `ProjectMemoryPanel`, `MemoryEntry`, `ProvenanceBadge`, `ConfidenceBadge`.
- `DuplicateLab`, `DuplicateGroup`, `SimulationReport`, `PathImpactList`.
- `JobMonitor`, `Toast`, `ConfirmDialog`, `ErrorPanel`, `EmptyState`, `Skeleton`.
- `Settings`, `Diagnostics`, `BackupRestore`, `About`.

## 5. Trạng thái bắt buộc

`idle`, `loading`, `ready`, `empty`, `no-results`, `partial-index`, `scanning`, `paused`, `cancelled`, `permission-denied`, `drive-disconnected`, `missing`, `unsupported`, `decode-error`, `database-error`, `recovering`, `success`, `failed`, `undo-available`.

Không để inspector hiển thị sample cũ khi danh sách hiện tại rỗng hoặc selection đã mất.

## 6. Micro-interactions

- Chỉ một sample được phát; đổi selection dừng/đổi player có chủ đích.
- Search debounce nhưng clear/filter phải phản hồi ngay.
- Favorite có optimistic UI; lưu thất bại phải rollback và báo lỗi.
- Scan progress là dữ liệu thật, có scope và số processed.
- Drag thất bại không được làm mất selection.
- Ellipsis tối thiểu có Open in Folder, Copy Path, View Details; destructive action không giấu trong menu này.

## 7. Keyboard và accessibility

- `Ctrl+K` focus search, `Space` play/pause, mũi tên chọn row, `Enter` mở detail, `Esc` đóng popover.
- Table có semantic headers, focus indicator và sort announcement.
- Sidebar, separator dọc/ngang và từng cột bảng kéo đổi kích thước được; layout lưu local và có `Reset Layout`.
- Player keyboard accessible; trạng thái không chỉ dựa vào màu.
- Contrast, scale 100–200%, reduced motion và screen-reader labels.

## 8. Microcopy trung thực

- `Đã gửi sang FL` thay vì `Đã dùng trong project` nếu chỉ biết drop accepted.
- `Mô phỏng hoàn tất` thay vì `An toàn tuyệt đối`.
- `Không thể xác minh` thay vì bỏ qua lỗi.
- Normalize/Gain ghi rõ `Chỉ nghe thử — không sửa file gốc`.
