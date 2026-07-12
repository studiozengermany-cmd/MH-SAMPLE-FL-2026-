import { useCallback, useEffect, useMemo, useState } from "react";
import WaveformPlayer from "./WaveformPlayer";

type Route = "library" | "projects" | "safety";
const formatBytes = (value=0) => { const units=["B","KB","MB","GB","TB"]; let n=value,i=0; while(n>=1024&&i<units.length-1){n/=1024;i++;} return `${n.toFixed(i?1:0)} ${units[i]}`; };
const formatDuration = (ms?:number) => ms ? `${(ms/1000).toFixed(ms<10000?2:1)}s` : "—";

function Badge({children,tone="neutral"}:{children:React.ReactNode;tone?:string}) { return <span className={`badge ${tone}`}>{children}</span>; }

export default function App() {
  const [boot,setBoot]=useState<Bootstrap|null>(null); const [roots,setRoots]=useState<LibraryRoot[]>([]); const [projects,setProjects]=useState<Project[]>([]);
  const [samples,setSamples]=useState<Sample[]>([]); const [selected,setSelected]=useState<Sample|null>(null); const [selectedRoot,setSelectedRoot]=useState<number|undefined>();
  const [query,setQuery]=useState(""); const [extension,setExtension]=useState(""); const [favoriteOnly,setFavoriteOnly]=useState(false); const [sort,setSort]=useState("relevance");
  const [route,setRoute]=useState<Route>("library"); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  const [progress,setProgress]=useState<Record<number,ScanProgress>>({}); const [autoplayToken,setAutoplayToken]=useState(0); const [currentProjectId,setCurrentProjectId]=useState<number|undefined>();
  const [duplicates,setDuplicates]=useState<DuplicateGroup[]>([]); const [settingsOpen,setSettingsOpen]=useState(false); const [projectName,setProjectName]=useState("");

  const refreshBootstrap=useCallback(async()=>{ const data=await window.mh.app.bootstrap(); setBoot(data); setRoots(data.roots); setProjects(data.projects); if(!currentProjectId&&data.projects[0]) setCurrentProjectId(data.projects[0].id); },[currentProjectId]);
  const runSearch=useCallback(async()=>{ setLoading(true); try{ const rows=await window.mh.samples.search({query,rootId:selectedRoot,extension:extension||undefined,favorite:favoriteOnly,sort,available:"available",limit:500}); setSamples(rows); if(selected&&!rows.some(x=>x.id===selected.id))setSelected(null); setError(""); }catch(e){setError(e instanceof Error?e.message:"Không tìm kiếm được.");}finally{setLoading(false);} },[query,selectedRoot,extension,favoriteOnly,sort,selected?.id]);

  useEffect(()=>{ refreshBootstrap().then(runSearch).catch(()=>setError("Không khởi tạo được ứng dụng.")); const off=window.mh.app.onProgress((p)=>{setProgress(x=>({...x,[p.rootId]:p})); if(["indexed","error","cancelled"].includes(p.status)){refreshBootstrap();runSearch();}}); return off;},[]);
  useEffect(()=>{const timer=setTimeout(runSearch,180);return()=>clearTimeout(timer);},[query,selectedRoot,extension,favoriteOnly,sort]);
  useEffect(()=>{ if(route==="safety") window.mh.safety.duplicates().then(setDuplicates).catch(()=>setError("Không tải được báo cáo trùng lặp.")); },[route]);

  const selectSample=async(id:number,play=false)=>{const detail=await window.mh.samples.get(id);setSelected(detail);if(play)setAutoplayToken(Date.now());};
  const updateSelected=async(patch:Partial<Sample>)=>{if(!selected)return;const next=await window.mh.samples.update(selected.id,patch);setSelected(next);setSamples(list=>list.map(x=>x.id===next.id?{...x,...next}:x));};
  const addFolder=async()=>{const root=await window.mh.library.addFolder();if(root){setRoots(await window.mh.library.roots());setSelectedRoot(root.id);setNotice(`Đang quét ${root.display_name}`);}};
  const createProject=async()=>{if(!projectName.trim())return;const project=await window.mh.projects.create({name:projectName.trim()});setProjects(await window.mh.projects.list());setCurrentProjectId(project.id);setProjectName("");setNotice("Đã tạo project workspace.");};
  const confirmUsage=async()=>{if(!selected||!currentProjectId)return;await window.mh.projects.addMemory({project_id:currentProjectId,sample_id:selected.id,event_type:"user_confirmed",source:"manual_confirmation",confidence:1,role:"",style_context:"",producer_note:""});setSelected(await window.mh.samples.get(selected.id));setNotice("Đã ghi nhận: người dùng xác nhận sample được sử dụng.");};
  const stats=boot?.stats || {total:0,available:0,missing:0,size_bytes:0};
  const selectedProject=projects.find(p=>p.id===currentProjectId);

  return <main className="app-shell">
    <aside className="sidebar panel">
      <div className="brand"><div className="shield">M</div><div><strong>MH Sample</strong><span>FL · Local First</span></div></div>
      <nav className="main-nav" aria-label="Điều hướng chính">
        <button className={route==="library"?"active":""} onClick={()=>setRoute("library")}><span>⌕</span> Thư viện</button>
        <button className={route==="projects"?"active":""} onClick={()=>setRoute("projects")}><span>◫</span> Dự án</button>
        <button className={route==="safety"?"active":""} onClick={()=>setRoute("safety")}><span>◇</span> Kiểm tra an toàn</button>
      </nav>
      <div className="section-title"><span>Local Crate</span><button onClick={addFolder} title="Thêm thư mục">＋</button></div>
      <div className="root-list">
        <button className={!selectedRoot?"root active":"root"} onClick={()=>setSelectedRoot(undefined)}><span className="root-avatar all">A</span><span><b>Tất cả sample</b><small>{stats.available||0} sẵn sàng</small></span></button>
        {roots.map((root,i)=><button key={root.id} className={selectedRoot===root.id?"root active":"root"} onClick={()=>setSelectedRoot(root.id)}>
          <span className={`root-avatar c${i%5}`}>{root.display_name[0]?.toUpperCase()}</span><span className="root-copy"><b>{root.display_name}</b><small>{root.file_count} file · {formatBytes(root.size_bytes)}</small></span>
          <Badge tone={root.status==="indexed"?"success":root.status==="error"?"danger":"warning"}>{progress[root.id]?.status||root.status}</Badge>
        </button>)}
      </div>
      <div className="health">
        <div className="health-top"><div className="donut" style={{"--pct":`${stats.total?((stats.available||0)/stats.total)*100:0}%`} as React.CSSProperties}><b>{stats.total||0}</b><small>Samples</small></div>
          <div><p><i className="dot green"/> Indexed <b>{stats.available||0}</b></p><p><i className="dot red"/> Missing <b>{stats.missing||0}</b></p><p><i className="dot cyan"/> Size <b>{formatBytes(stats.size_bytes||0)}</b></p></div></div>
        <button className="secondary wide" onClick={()=>selectedRoot&&window.mh.library.rescan(selectedRoot)} disabled={!selectedRoot}>↻ Quét lại thư mục đang chọn</button>
      </div>
    </aside>

    <section className="workspace">
      <header className="topbar panel">
        <div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm sample, pack, tag hoặc ghi chú…" aria-label="Tìm kiếm sample"/>{query&&<button onClick={()=>setQuery("")}>×</button>}</div>
        <select value={extension} onChange={e=>setExtension(e.target.value)} aria-label="Lọc định dạng"><option value="">Mọi định dạng</option>{["wav","aif","aiff","flac","mp3","ogg","m4a"].map(x=><option key={x}>{x}</option>)}</select>
        <button className={favoriteOnly?"filter active":"filter"} onClick={()=>setFavoriteOnly(x=>!x)}>★ Yêu thích</button>
        <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sắp xếp"><option value="relevance">Liên quan</option><option value="name">Tên A–Z</option><option value="recent">Mới cập nhật</option><option value="usage">Đã sử dụng</option><option value="rating">Đánh giá</option></select>
        <button className="icon-btn" onClick={()=>setSettingsOpen(true)} title="Cài đặt">⚙</button>
      </header>

      {notice&&<button className="notice" onClick={()=>setNotice("")}>{notice}<span>×</span></button>}
      {error&&<div className="error-banner">{error}<button onClick={()=>setError("")}>×</button></div>}

      {route==="library"&&<LibraryView samples={samples} selected={selected} loading={loading} onSelect={selectSample} onUpdate={updateSelected} autoplayToken={autoplayToken} currentProject={selectedProject} currentProjectId={currentProjectId} projects={projects} setCurrentProjectId={setCurrentProjectId} confirmUsage={confirmUsage}/>} 
      {route==="projects"&&<ProjectsView projects={projects} currentProjectId={currentProjectId} setCurrentProjectId={setCurrentProjectId} projectName={projectName} setProjectName={setProjectName} createProject={createProject}/>} 
      {route==="safety"&&<SafetyView groups={duplicates}/>} 
    </section>

    <footer className="statusbar"><span><i className="dot green"/> Local-first · dữ liệu nằm trên máy</span><span>{Object.values(progress).some(x=>x.status==="scanning")?"Đang lập chỉ mục nền":"Sẵn sàng"}</span><span>MH Sample FL v0.1.0 · VST3 chưa triển khai</span></footer>
    {settingsOpen&&<SettingsModal close={()=>setSettingsOpen(false)} setNotice={setNotice}/>} 
  </main>;
}

function LibraryView({samples,selected,loading,onSelect,onUpdate,autoplayToken,currentProject,currentProjectId,projects,setCurrentProjectId,confirmUsage}:{samples:Sample[];selected:Sample|null;loading:boolean;onSelect:(id:number,play?:boolean)=>void;onUpdate:(p:Partial<Sample>)=>void;autoplayToken:number;currentProject?:Project;currentProjectId?:number;projects:Project[];setCurrentProjectId:(id:number)=>void;confirmUsage:()=>void}){
  return <div className="library-layout">
    <section className="results panel">
      <div className="results-head"><div><b>{samples.length}</b> kết quả <small>{loading?"· đang tải":"· dữ liệu thật trong SQLite"}</small></div></div>
      <div className="table-head"><span>Tên file</span><span>Loại</span><span>Pack / nguồn</span><span>Lịch sử</span><span>Thời lượng</span></div>
      <div className="table-scroll">{loading&&<div className="empty">Đang tìm kiếm…</div>}{!loading&&!samples.length&&<div className="empty"><b>Chưa có sample phù hợp</b><span>Thêm thư mục hoặc thay đổi bộ lọc.</span></div>}
        {samples.map(sample=><div key={sample.id} className={selected?.id===sample.id?"sample-row selected":"sample-row"} onClick={()=>onSelect(sample.id)} draggable={Boolean(sample.available)} onDragStart={()=>window.mh.samples.startDrag(sample.id,currentProjectId)}>
          <span className="file-cell"><button onClick={e=>{e.stopPropagation();onSelect(sample.id,true)}} aria-label={`Nghe ${sample.filename}`}>▶</button><span><b>{sample.filename}</b><small>{sample.tags?.join(" · ")||sample.category||"Chưa gắn tag"}</small></span></span>
          <span><Badge tone="cyan">{sample.extension.toUpperCase()}</Badge></span><span>{sample.pack||sample.root_name}</span>
          <span><b className="usage">{sample.confirmed_usage_count}</b> xác nhận · {sample.sent_to_fl_count} gửi FL</span><span>{formatDuration(sample.duration_ms)}</span>
        </div>)}
      </div>
    </section>
    <div className="detail-grid">
      <section className="detail panel">
        <div className="detail-title"><div><h2>{selected?.filename||"Chưa chọn sample"}</h2>{selected&&<p>{selected.sample_rate?`${(selected.sample_rate/1000).toFixed(1)} kHz · `:""}{selected.bit_depth?`${selected.bit_depth}-bit · `:""}{selected.channels===1?"Mono":selected.channels===2?"Stereo":""} · {formatBytes(selected.size_bytes)}</p>}</div>
          {selected&&<div className="actions"><button className={selected.favorite?"star on":"star"} onClick={()=>onUpdate({favorite:selected.favorite?0:1})}>★</button><button className="secondary" onClick={()=>window.mh.samples.openFolder(selected.id)}>Mở thư mục</button><button className="secondary" onClick={()=>window.mh.samples.copyPath(selected.id)}>Copy path</button></div>}
        </div>
        <WaveformPlayer sample={selected} autoplayToken={autoplayToken}/>
        {selected&&<SampleEditor sample={selected} onUpdate={onUpdate}/>} 
      </section>
      <aside className="memory panel">
        <div className="memory-title"><div><h3>Project Memory</h3><p>Phân biệt rõ “gửi sang FL” và “đã dùng”.</p></div></div>
        <label className="field">Project hiện tại<select value={currentProjectId||""} onChange={e=>setCurrentProjectId(Number(e.target.value))}><option value="">Chưa chọn project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        {selected?.memories?.length?<div className="memory-list">{selected.memories.slice(0,5).map(m=><article key={m.id}><div><b>{m.project_name}</b><Badge tone={m.event_type==="user_confirmed"?"success":"warning"}>{m.event_type==="user_confirmed"?"Đã xác nhận":"Đã gửi FL"}</Badge></div><p>{m.role||m.style_context||"Chưa ghi vai trò"}</p><small>{m.source} · độ tin cậy {Math.round(m.confidence*100)}%</small></article>)}</div>:<div className="empty compact">Sample chưa có lịch sử dự án.</div>}
        <div className="memory-actions"><button className="primary wide" onClick={confirmUsage} disabled={!selected||!currentProject}>Xác nhận đã dùng trong project</button><small>Chỉ bấm khi anh xác nhận sample thực sự được sử dụng.</small></div>
      </aside>
    </div>
  </div>;
}

function SampleEditor({sample,onUpdate}:{sample:Sample;onUpdate:(p:Partial<Sample>)=>void}){
  const [tags,setTags]=useState(sample.tags.join(", ")); const [note,setNote]=useState(sample.note||""); const [license,setLicense]=useState<Partial<LicenseRecord>>(sample.license||{});
  useEffect(()=>{setTags(sample.tags.join(", "));setNote(sample.note||"");setLicense(sample.license||{});},[sample.id]);
  const saveTags=async()=>{await window.mh.samples.setTags(sample.id,tags.split(","));};
  const saveLicense=async()=>{await window.mh.samples.saveLicense(sample.id,license);};
  return <div className="editor-grid">
    <label className="field">Tag<input value={tags} onChange={e=>setTags(e.target.value)} onBlur={saveTags} placeholder="kick, one-shot, warehouse"/></label>
    <label className="field">Pack / nguồn<input value={sample.pack||""} onChange={e=>onUpdate({pack:e.target.value})} placeholder="Tên pack"/></label>
    <label className="field span2">Ghi chú producer<textarea value={note} onChange={e=>setNote(e.target.value)} onBlur={()=>onUpdate({note})} placeholder="Ví dụ: dùng tốt cho tone Am, cắt low-end 30Hz…"/></label>
    <div className="license-box span2"><h4>Nguồn và giấy phép</h4><div className="license-grid"><input value={license.vendor||""} onChange={e=>setLicense({...license,vendor:e.target.value})} placeholder="Vendor"/><input value={license.pack_name||""} onChange={e=>setLicense({...license,pack_name:e.target.value})} placeholder="Tên pack"/><select value={license.license_type||"unknown"} onChange={e=>setLicense({...license,license_type:e.target.value})}><option value="unknown">Chưa rõ license</option><option value="royalty_free">Royalty-free</option><option value="commercial">Commercial</option><option value="restricted">Hạn chế</option></select><button className="secondary" onClick={saveLicense}>Lưu license</button></div></div>
  </div>;
}

function ProjectsView({projects,currentProjectId,setCurrentProjectId,projectName,setProjectName,createProject}:{projects:Project[];currentProjectId?:number;setCurrentProjectId:(id:number)=>void;projectName:string;setProjectName:(s:string)=>void;createProject:()=>void}){
  const [memories,setMemories]=useState<MemoryEntry[]>([]); useEffect(()=>{window.mh.projects.memories(currentProjectId?{projectId:currentProjectId}:{}).then(setMemories);},[currentProjectId]);
  return <div className="route-panel panel"><div className="route-head"><div><h2>Dự án và trí nhớ producer</h2><p>Không trộn preview, gửi sang FL và xác nhận sử dụng.</p></div><div className="create-inline"><input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Tên project mới"/><button className="primary" onClick={createProject}>Tạo project</button></div></div>
    <div className="project-chips">{projects.map(p=><button key={p.id} className={currentProjectId===p.id?"active":""} onClick={()=>setCurrentProjectId(p.id)}><b>{p.name}</b><small>{p.style||"Chưa gắn style"}</small></button>)}</div>
    <div className="memory-table"><div className="memory-row head"><span>Sample</span><span>Project</span><span>Sự kiện</span><span>Nguồn</span><span>Thời gian</span></div>{memories.map(m=><div className="memory-row" key={m.id}><span>{m.sample_name}</span><span>{m.project_name}</span><span><Badge tone={m.event_type==="user_confirmed"?"success":"warning"}>{m.event_type}</Badge></span><span>{m.source} · {Math.round(m.confidence*100)}%</span><span>{new Date(m.occurred_at).toLocaleString("vi-VN")}</span></div>)}</div>
    {!projects.length&&<div className="empty"><b>Chưa có project workspace</b><span>Tạo project để bắt đầu ghi nhớ quyết định sử dụng sample.</span></div>}
  </div>;
}

function SafetyView({groups}:{groups:DuplicateGroup[]}){const saved=useMemo(()=>groups.reduce((sum,g)=>sum+(g.total_size-(g.samples[0]?.size_bytes||0)),0),[groups]);return <div className="route-panel panel"><div className="route-head"><div><h2>Kiểm tra trùng lặp an toàn</h2><p>Chỉ báo cáo và mô phỏng. Không file nào bị xóa, di chuyển hoặc hard-link.</p></div><div className="safe-summary"><b>{groups.length}</b> nhóm exact duplicate · có thể xem xét {formatBytes(saved)}</div></div>
  <div className="duplicate-list">{groups.map(g=><article key={g.exact_hash}><div className="duplicate-head"><div><Badge tone="success">SHA-256 trùng khớp</Badge><b>{g.file_count} file · {formatBytes(g.total_size)}</b></div><code>{g.exact_hash.slice(0,24)}…</code></div>{g.samples.map((s,i)=><div className="duplicate-file" key={s.id}><Badge tone={i===0?"cyan":"neutral"}>{i===0?"Ứng viên giữ":"Bản trùng"}</Badge><span><b>{s.filename}</b><small>{s.path}</small></span><em>{formatBytes(s.size_bytes)}</em></div>)}</article>)}</div>
  {!groups.length&&<div className="empty"><b>Chưa phát hiện exact duplicate</b><span>Kết quả chỉ xuất hiện sau khi file đã được hash thành công.</span></div>}</div>}

function SettingsModal({close,setNotice}:{close:()=>void;setNotice:(s:string)=>void}){const [busy,setBusy]=useState(false);const action=async(fn:()=>Promise<string>,label:string)=>{setBusy(true);try{const path=await fn();setNotice(`${label}: ${path}`);close();}finally{setBusy(false);}};return <div className="modal-backdrop" onMouseDown={close}><section className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h2>Cài đặt và dữ liệu</h2><button onClick={close}>×</button></div><div className="setting-row"><div><b>Sao lưu SQLite</b><p>Tạo bản sao database có thể phục hồi.</p></div><button className="secondary" disabled={busy} onClick={()=>action(window.mh.settings.backup,"Đã sao lưu")}>Tạo backup</button></div><div className="setting-row"><div><b>Xuất báo cáo JSON</b><p>Xuất roots, samples, projects, memories và duplicate report.</p></div><button className="secondary" disabled={busy} onClick={()=>action(window.mh.settings.exportSnapshot,"Đã xuất")}>Xuất dữ liệu</button></div><div className="policy"><b>VST3 đang bị khóa</b><p>Ứng dụng desktop phải hoàn thành nghiệm thu trước. Phiên bản này không chứa JUCE, VST SDK hoặc plugin shell.</p></div></section></div>}

