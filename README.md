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

`PLANNING / GREENFIELD` — repository mới chỉ chứa hồ sơ đặc tả và kế hoạch triển khai. Chưa có code ứng dụng và chưa có VST3.

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

## Cấu trúc code dự kiến

```text
MH-Sample-FL/
├─ apps/
│  └─ desktop/                 # UI desktop và Tauri shell
├─ crates/
│  ├─ mh-domain/               # Quy tắc nghiệp vụ thuần
│  ├─ mh-application/          # Use cases/commands/queries
│  ├─ mh-database/             # SQLite, migrations, repositories
│  ├─ mh-indexer/              # Scan, watcher, hash, job queue
│  ├─ mh-audio/                # Decode, preview, waveform, metadata
│  └─ mh-platform-windows/     # Windows paths, OLE drag, file identity
├─ tests/
│  ├─ fixtures/
│  ├─ integration/
│  └─ e2e/
└─ docs/
```

Các thư mục code chỉ được scaffold sau khi Milestone 0 và Technical Gate A được duyệt.
