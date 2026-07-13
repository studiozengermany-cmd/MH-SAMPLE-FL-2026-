interface LibraryRoot { id:number; path:string; display_name:string; status:string; file_count:number; size_bytes:number; last_scan_at?:string; last_error?:string; }
interface LibraryFolder { id:number; stable_id:string; root_id:number; parent_id?:number; path:string; relative_path:string; name:string; depth:number; available:number; direct_sample_count:number; total_sample_count:number; children:LibraryFolder[]; }
interface Project { id:number; stable_id:string; name:string; project_path?:string; style:string; bpm?:number; musical_key:string; note:string; }
interface MemoryEntry { id:number; project_id:number; sample_id:number; event_type:string; role:string; style_context:string; producer_note:string; source:string; confidence:number; occurred_at:string; project_name:string; sample_name:string; }
interface LicenseRecord { vendor:string; pack_name:string; source_url:string; purchase_date:string; order_reference:string; license_type:string; commercial_status:string; evidence_path:string; note:string; }
interface Sample {
  id:number; stable_id:string; root_id:number; folder_id?:number; path:string; filename:string; extension:string; size_bytes:number; duration_ms?:number;
  sample_rate?:number; bit_depth?:number; channels?:number; codec?:string; available:number; favorite:number; rating:number;
  category:string; pack:string; note:string; preview_count:number; sent_to_fl_count:number; confirmed_usage_count:number;
  root_name:string; folder_name?:string; folder_relative_path?:string; tags:string[]; exact_hash?:string; audioUrl?:string; memories?:MemoryEntry[]; license?:LicenseRecord|null;
  bpm_original?:number; bpm_confidence?:number; musical_key?:string; key_confidence?:number; analysis_source:string;
}
interface DuplicateGroup { exact_hash:string; file_count:number; total_size:number; samples:Array<Pick<Sample,"id"|"filename"|"path"|"size_bytes">>; }
interface Bootstrap { roots:LibraryRoot[]; stats:{total:number;available:number;missing:number;size_bytes:number}; projects:Project[]; settings:any; }
interface ScanProgress { rootId:number; status:string; processed:number; discovered?:number; analyzed?:number; folders?:number; bytes:number; errors:number; message?:string; }

interface Window {
  mh: {
    app:{ bootstrap:()=>Promise<Bootstrap>; onProgress:(cb:(data:ScanProgress)=>void)=>()=>void };
    library:{ addFolder:()=>Promise<LibraryRoot|null>; roots:()=>Promise<LibraryRoot[]>; tree:(id:number)=>Promise<LibraryFolder[]>; rescan:(id:number)=>Promise<any>; cancel:(id:number)=>Promise<boolean> };
    samples:{ search:(params:any)=>Promise<Sample[]>; get:(id:number)=>Promise<Sample|null>; update:(id:number,patch:Partial<Sample>)=>Promise<Sample>; setTags:(id:number,tags:string[])=>Promise<Sample>; previewed:(id:number)=>void; openFolder:(id:number)=>Promise<void>; copyPath:(id:number)=>Promise<boolean>; startDrag:(id:number,projectId?:number)=>void; saveTrimmed:(id:number,wavBytes:ArrayBuffer,suffix?:string)=>Promise<string|null>; saveLicense:(id:number,data:Partial<LicenseRecord>)=>Promise<LicenseRecord> };
    projects:{ list:()=>Promise<Project[]>; create:(data:Partial<Project>)=>Promise<Project>; memories:(filters:any)=>Promise<MemoryEntry[]>; addMemory:(data:any)=>Promise<MemoryEntry> };
    safety:{ duplicates:()=>Promise<DuplicateGroup[]> };
    settings:{ get:()=>Promise<any>; update:(patch:any)=>Promise<any>; backup:()=>Promise<string>; exportSnapshot:()=>Promise<string> };
  }
}
