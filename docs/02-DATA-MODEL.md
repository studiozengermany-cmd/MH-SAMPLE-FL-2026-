# Mô hình dữ liệu v1

## 1. Quy tắc chung

- ID nội bộ dùng UUID/ULID; path không phải primary key.
- Thời gian lưu UTC và hiển thị theo local timezone.
- Soft state như missing/disabled không được biến thành delete vật lý.
- Mọi migration có version, backup và test nâng cấp.
- Trường `source` và `confidence` bắt buộc cho dữ liệu suy ra/tự động.

## 2. Bảng lõi

### `library_roots`

`id`, `display_name`, `absolute_path`, `volume_id`, `root_type`, `enabled`, `recursive`, `status`, `last_scan_at`, `created_at`, `updated_at`.

### `samples`

`id`, `library_root_id`, `current_path`, `relative_path`, `filename`, `extension`, `file_size`, `modified_at_fs`, `created_at_fs`, `availability_status`, `file_identity`, `exact_hash`, `fingerprint`, `first_indexed_at`, `last_seen_at`.

### `audio_metadata`

`sample_id`, `codec`, `duration_ms`, `sample_rate`, `bit_depth`, `channels`, `bitrate`, `bpm_auto`, `bpm_confidence`, `key_auto`, `key_confidence`, `category_auto`, `category_confidence`, `analysis_version`.

### `waveform_cache`

`sample_id`, `resolution`, `peaks_blob_or_path`, `generated_at`, `generator_version`.

### `sample_user_metadata`

`sample_id`, `favorite`, `rating`, `category_override`, `bpm_override`, `key_override`, `color_label`, `note`, `updated_at`.

### `tags` và `sample_tags`

Tag có `id`, `name`, `normalized_name`, `color`; bảng nối lưu `sample_id`, `tag_id`, `source`, `confidence`, `created_at`.

### `crates` và `crate_items`

Crate có type `manual|smart`; smart crate lưu versioned filter JSON. Item manual lưu sample và thứ tự tùy chọn.

### `projects`

`id`, `name`, `project_path_optional`, `folder_path_optional`, `style`, `bpm`, `musical_key`, `status`, `note`, `created_at`, `updated_at`.

### `project_sample_memories`

`id`, `project_id`, `sample_id`, `event_type`, `role`, `style_context`, `producer_note`, `source`, `confidence`, `occurred_at`, `confirmed_at_optional`.

`event_type` tối thiểu: `previewed`, `sent_to_fl`, `user_confirmed`, `manifest_imported`, `verified_reference`, `removed_by_user`.

### `packs`

`id`, `name`, `vendor`, `source_url`, `purchase_date`, `order_reference`, `note`.

### `licenses` và `license_evidence`

License lưu type, commercial status, attribution, restrictions, status và inheritance scope. Evidence lưu path/reference, checksum, mime type, added_at và note.

### `duplicate_groups` và `duplicate_members`

Group lưu algorithm/version/hash/total size/status. Member lưu sample, canonical candidate flag và reason. Near-duplicate không được dùng chung semantics với exact duplicate.

### `path_history` và `path_aliases`

Lưu old/new path, volume, reason, detected_at và xác nhận của người dùng để hỗ trợ locate/rescan mà không sửa FLP.

### `index_jobs`, `job_items`, `scan_errors`

Job lưu type, scope, status, progress, checkpoint, timestamps và cancellation. Error lưu code, path đã redacted theo policy, retryable và resolution hint.

### `settings`, `schema_migrations`, `backup_snapshots`

Settings phải tách machine settings khỏi user preferences. Backup snapshot lưu version, database checksum, created_at và restore test status.

## 3. Các count không được trộn

- `preview_count`: số lần nghe trong app.
- `sent_to_fl_count`: số drag/drop được OS báo accepted.
- `confirmed_usage_count`: số lần người dùng xác nhận.
- `verified_reference_count`: số reference được công cụ xác minh.

UI phải ghi đúng loại count; không dùng nhãn chung “Used” nếu dữ liệu gồm nhiều nguồn khác nhau.

