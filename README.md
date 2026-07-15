# MH Sample FL

> **Trạng thái:** dự án cá nhân đang phát triển, phiên bản `v0.1.0-alpha`. Chưa phải sản phẩm thương mại và chưa được phát hành như một công cụ ổn định cho người dùng cuối.

MH Sample FL được Minh Hiếu xây dựng trước hết để giải quyết nhu cầu thật khi làm nhạc với FL Studio: thư viện sample ngày càng lớn, khó tìm lại âm thanh đã dùng, dễ thất lạc nguồn hoặc license, và khó kiểm tra file thiếu hoặc trùng lặp.

Mục tiêu của dự án là làm một công cụ hữu ích cho công việc cá nhân trước. Khi phần mềm đủ ổn định, an toàn và có kiểm chứng thực tế, dự án có thể được chia sẻ để cộng đồng producer dùng thử. Repository này không dùng để quảng cáo những tính năng chưa tồn tại hoặc chưa được kiểm tra.

## Dự án này đang làm gì?

- Tìm sample trong nhiều thư mục và ổ đĩa.
- Nghe preview, xem waveform và metadata mà không sửa file gốc.
- Ghi nhớ sample đã liên quan đến project nào, vai trò gì và ghi chú của người dùng.
- Lưu thông tin nguồn, license, hóa đơn hoặc tài liệu chứng minh.
- Phát hiện file thiếu và file trùng chính xác theo quy trình chỉ đọc hoặc mô phỏng.
- Kéo file từ ứng dụng desktop sang FL Studio bằng cơ chế của hệ điều hành.

## Nguyên tắc bắt buộc

1. **Local-first:** chức năng chính chạy trên máy người dùng.
2. **Không bắt buộc cloud:** không yêu cầu tài khoản, API key hoặc gói trả phí để dùng phần desktop cốt lõi.
3. **Không phá dữ liệu:** không tự động xóa, di chuyển, đổi tên, hard-link, ghi đè hoặc sửa file âm thanh gốc.
4. **Không dữ liệu giả:** số liệu và trạng thái trên giao diện phải đến từ dữ liệu thật.
5. **Không tuyên bố quá mức:** build thành công không đồng nghĩa tính năng đã được nghiệm thu trong FL Studio.
6. **Desktop trước:** VST3 chưa được triển khai và chỉ được xem xét sau khi ứng dụng desktop đủ ổn định.
7. **Chưa thương mại hóa:** hiện tại đây là dự án phát triển và thử nghiệm cá nhân.

## Trạng thái hiện tại

Mã nguồn hiện có:

- Electron, React và TypeScript.
- SQLite WAL và FTS5 cho tìm kiếm, lọc và sắp xếp.
- Quét thư mục, giữ cấu trúc folder cha–con và folder rỗng.
- SHA-256, metadata âm thanh, BPM/key kèm nguồn suy luận.
- Preview audio, waveform và vùng In/Out để xuất một file WAV mới.
- Project Workspace và Project Memory.
- Báo cáo exact duplicate theo hướng không destructive.
- Backup SQLite và export JSON.
- Quy trình test, build renderer và đóng gói Windows NSIS.

Bằng chứng hiện có của baseline redesign:

- `10/10` automated tests chạy thành công trên Windows CI.
- TypeScript/Vite production build thành công.
- NSIS installer được tạo thành công.
- Packaged application đã qua smoke launch trên Windows runner.

Xem chi tiết tại [Trạng thái triển khai và bằng chứng](docs/09-IMPLEMENTATION-STATUS.md).

### Những phần chưa được phép coi là hoàn thành

- Chưa nghiệm thu đầy đủ bản cài trên máy Windows thật của chủ dự án.
- Chưa xác nhận toàn bộ thao tác scan, preview và audio UI trong điều kiện sử dụng thật.
- Chưa nghiệm thu native drag với Channel Rack, Playlist hoặc Sampler trong FL Studio.
- Chưa performance test với thư viện khoảng 100.000 sample.
- Chưa kiểm thử crash hoặc mất điện thực tế trên Windows.

Các mục này phải giữ trạng thái chưa kiểm chứng cho đến khi có log, ảnh, video hoặc kết quả test thật.

## Chạy khi phát triển

Yêu cầu Node.js 24 trở lên.

```bash
npm install
npm run dev
```

Chạy test và production renderer build:

```bash
npm run check
```

Đóng gói bộ cài Windows NSIS:

```bash
npm run dist:win
```

GitHub Actions cũng chạy quy trình Windows và tạo build artifact. Artifact CI chỉ là bằng chứng kỹ thuật tạm thời, không tự động được coi là bản phát hành chính thức.

## Cấu trúc source

```text
MH-Sample-FL/
├─ src/
│  ├─ main/                    # Electron main, SQLite, indexer, filesystem
│  ├─ preload/                 # IPC bridge có context isolation
│  └─ renderer/                # React/TypeScript UI và workflow
├─ tests/
├─ .github/workflows/
└─ docs/
```

Thư mục VST3/JUCE không tồn tại trong codebase hiện tại.

## Tài liệu chính

- [Đặc tả tổng thể](docs/00-MASTER-SPEC.md)
- [Kiến trúc app-first](docs/01-APP-FIRST-ARCHITECTURE.md)
- [Mô hình dữ liệu](docs/02-DATA-MODEL.md)
- [Đặc tả UI và hành vi](docs/03-UX-FUNCTIONAL-SPEC.md)
- [Kế hoạch code và vận hành](docs/04-IMPLEMENTATION-PLAN.md)
- [Kiểm thử và nghiệm thu](docs/05-TEST-ACCEPTANCE.md)
- [Lộ trình VST3 giai đoạn sau](docs/06-VST3-PHASE-2.md)
- [Nhật ký quyết định](docs/07-DECISION-LOG.md)
- [Truy vết yêu cầu](docs/08-EXECUTION-GOVERNANCE.md)
- [Trạng thái triển khai](docs/09-IMPLEMENTATION-STATUS.md)

## Quyền sử dụng

Repository hiện được công khai để minh bạch quá trình phát triển và kiểm chứng. Package hiện đặt trạng thái `UNLICENSED`; việc repository công khai không tự động cấp quyền sao chép, đóng gói lại hoặc sử dụng thương mại.

## Liên hệ

- Website: https://studiominhhieu.com/
- Email: support@studiominhhieu.com
- GitHub: https://github.com/studiozengermany-cmd
