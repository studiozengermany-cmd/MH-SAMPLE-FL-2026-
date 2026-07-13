# MH Sample FL

MH Sample FL là ứng dụng desktop local-first dành cho producer sử dụng FL Studio để quản lý thư viện sample, tìm và nghe nhanh, ghi nhớ sample đã dùng theo ngữ cảnh dự án, theo dõi nguồn/license và xử lý file thiếu hoặc trùng lặp theo quy trình an toàn.

## Quyết định chính thức

1. Đây là dự án greenfield, được xây mới hoàn toàn.
2. Không sao chép, merge hoặc kế thừa code từ bất kỳ dự án SampleGuard/Sample FL cũ nào.
3. Tên sản phẩm chính thức từ ngày 12/07/2026 là **MH Sample FL**.
4. Giai đoạn 1 chỉ xây **ứng dụng desktop độc lập**.
5. VST3 thuộc giai đoạn 2 và chỉ bắt đầu sau khi ứng dụng desktop đã ổn định, có người dùng thật và được phê duyệt riêng.
6. Không cloud mặc định, không bắt buộc tài khoản, API key hay gói trả phí.
7. Không tự động xóa, di chuyển, đổi tên, hard-link hoặc sửa file âm thanh gốc.
8. Mọi số liệu và trạng thái trên UI phải có nguồn dữ liệu thật; cấm fake UI, placeholder và dữ liệu demo giả làm dữ liệu thật.

## Giá trị cốt lõi

- **Find:** tìm sample nhanh trong nhiều thư mục và ổ đĩa.
- **Preview:** nghe, xem waveform và metadata mà không sửa file gốc.
- **Remember:** lưu project, role, style, note và lịch sử quyết định của producer.
- **Protect:** phát hiện file missing/trùng và đánh giá tác động trước mọi thao tác.
- **Prove:** lưu nguồn gốc, license, hóa đơn hoặc tài liệu chứng minh.
- **Integrate:** kéo file từ ứng dụng desktop sang FL Studio bằng cơ chế hệ điều hành; không giả vờ là integration sâu khi chưa có bằng chứng.

## Trạng thái hiện tại

`v0.1.0-alpha / DESKTOP REDESIGN IN PROGRESS` — source hiện có cây folder thật, fast discovery + deep analysis, SQLite search, BPM/key provenance, tempo-sync preview, waveform + vùng trim xuất WAV mới, Project Memory, exact duplicate report, backup/export và workspace dark studio kéo resize. Runtime Windows/FL Studio của bản redesign vẫn chờ evidence mới. VST3 chưa được triển khai và vẫn bị khóa bằng policy gate.

Xem trạng thái test chính xác tại [Implementation Status](docs/09-IMPLEMENTATION-STATUS.md).

## Chạy ứng dụng khi phát triển

Yêu cầu Node.js 24 trở lên.

```bash
npm install
npm run dev
```

Kiểm tra toàn bộ unit/integration test và production renderer build:

```bash
npm run check
```

Đóng gói bộ cài Windows NSIS:

```bash
npm run dist:win
```

GitHub Actions cũng tự chạy quy trình Windows này và xuất file cài đặt dưới dạng build artifact.

Build Windows redesign: [Windows Build #24 — 10 test, NSIS và smoke launch thành công](https://github.com/studiozengermany-cmd/MH-SAMPLE-FL-2026-/actions/runs/29214548160). Tải artifact `MH-Sample-FL-Windows-8e45bcee609a1dd71402ab23ee4a895872f10070` từ trang run. Đây là bản cần nghiệm thu UI/scan/audio/drag thật trên máy anh; chưa tự động coi là đạt FL Studio.

## Tài liệu chính

- [Đặc tả tổng thể](docs/00-MASTER-SPEC.md)
- [Kiến trúc app-first](docs/01-APP-FIRST-ARCHITECTURE.md)
- [Mô hình dữ liệu](docs/02-DATA-MODEL.md)
- [Đặc tả UI và hành vi](docs/03-UX-FUNCTIONAL-SPEC.md)
- [Kế hoạch code và vận hành](docs/04-IMPLEMENTATION-PLAN.md)
- [Kiểm thử và nghiệm thu](docs/05-TEST-ACCEPTANCE.md)
- [Lộ trình VST3 giai đoạn sau](docs/06-VST3-PHASE-2.md)
- [Nhật ký quyết định](docs/07-DECISION-LOG.md)
- [Cam kết thực thi và truy vết yêu cầu](docs/08-EXECUTION-GOVERNANCE.md)
- [Trạng thái triển khai và bằng chứng](docs/09-IMPLEMENTATION-STATUS.md)

## Cấu trúc source hiện tại

```text
MH-Sample-FL/
├─ src/
│  ├─ main/                    # Electron main, SQLite, indexer, filesystem
│  ├─ preload/                 # IPC bridge có context isolation
│  └─ renderer/                # React/TypeScript UI, waveform và workflow
├─ tests/
│  ├─ database.test.cjs
│  ├─ indexer.test.cjs
│  └─ utils.test.cjs
├─ .github/workflows/          # Test và đóng gói Windows
└─ docs/
```

Thư mục VST3/JUCE không tồn tại trong codebase. Chỉ ứng dụng desktop đang được triển khai.

## Chức năng v0.1.0-alpha

- Chọn và quét thư mục sample thật; giữ cây folder cha–con/folder rỗng, không gộp root.
- Hai pha discovery/analyze, SHA-256, metadata audio, BPM/key provenance, watcher, cancel và progress thật.
- SQLite WAL + FTS5, tìm kiếm, filter, sort, favorite, rating, tags và notes.
- Preview audio qua protocol nội bộ, waveform thật, tempo sync theo BPM project và trim xuất WAV mới; không ghi đè nguồn.
- Project Workspace và Project Memory tách `sent_to_fl` khỏi `user_confirmed`.
- Native desktop drag bridge qua Electron với vùng kéo riêng và fallback; cần nghiệm thu trực tiếp trên FL Studio Windows.
- Sidebar, results/inspector, Project Memory và bảy cột bảng kéo resize; layout persist và Reset Layout.
- License/source metadata.
- Exact duplicate report chỉ đọc/mô phỏng; không xóa hoặc hard-link.
- Backup SQLite và export JSON.
- UI tiếng Việt, desktop-first, có loading/empty/error states.
