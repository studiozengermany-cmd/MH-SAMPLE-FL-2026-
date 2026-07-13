import { useEffect, useRef, useState } from "react";

function drawWaveform(canvas: HTMLCanvasElement, buffer: AudioBuffer, selection?: [number, number]) {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(canvas.clientWidth, 320);
  const height = Math.max(canvas.clientHeight, 118);
  canvas.width = width * ratio; canvas.height = height * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#43e5dd"); gradient.addColorStop(1, "#168d94");
  const data = buffer.getChannelData(0); const step = Math.max(1, Math.floor(data.length / width));
  ctx.strokeStyle = gradient; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x < width; x += 1) {
    let min = 1; let max = -1; const start = x * step;
    for (let index = 0; index < step && start + index < data.length; index += 1) {
      const value = data[start + index]; if (value < min) min = value; if (value > max) max = value;
    }
    ctx.moveTo(x + .5, (1 + min) * height / 2); ctx.lineTo(x + .5, (1 + max) * height / 2);
  }
  ctx.stroke();
  if (selection) {
    const startX = selection[0] / buffer.duration * width; const endX = selection[1] / buffer.duration * width;
    ctx.fillStyle = "rgba(3, 9, 13, .62)"; ctx.fillRect(0, 0, startX, height); ctx.fillRect(endX, 0, width - endX, height);
    ctx.strokeStyle = "#f7b84b"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(startX, height); ctx.moveTo(endX, 0); ctx.lineTo(endX, height); ctx.stroke();
  }
}

function encodeWav(buffer: AudioBuffer, startSeconds: number, endSeconds: number) {
  const start = Math.max(0, Math.floor(startSeconds * buffer.sampleRate));
  const end = Math.min(buffer.length, Math.ceil(endSeconds * buffer.sampleRate));
  const frames = Math.max(0, end - start); const channels = buffer.numberOfChannels;
  const bytes = new ArrayBuffer(44 + frames * channels * 2); const view = new DataView(bytes);
  const write = (offset: number, text: string) => [...text].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, 36 + frames * channels * 2, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, frames * channels * 2, true);
  let offset = 44;
  for (let frame = start; frame < end; frame += 1) for (let channel = 0; channel < channels; channel += 1) {
    const value = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[frame]));
    view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true); offset += 2;
  }
  return bytes;
}

const time = (seconds:number) => `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,"0")}.${String(Math.floor((seconds%1)*1000)).padStart(3,"0")}`;

export default function WaveformPlayer({ sample, autoplayToken, projectBpm, onNotice }: { sample: Sample | null; autoplayToken: number; projectBpm?: number; onNotice?: (message:string)=>void }) {
  const audioRef = useRef<HTMLAudioElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null); const decodedRef = useRef<AudioBuffer|null>(null);
  const [playing, setPlaying] = useState(false); const [current, setCurrent] = useState(0); const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [trimOpen, setTrimOpen] = useState(false);
  const [trimIn, setTrimIn] = useState(0); const [trimOut, setTrimOut] = useState(0); const [sync, setSync] = useState(false); const [targetBpm, setTargetBpm] = useState<number>(projectBpm || sample?.bpm_original || 0);

  useEffect(() => {
    setError(""); setCurrent(0); setDuration(0); setPlaying(false); setTrimOpen(false); setTrimIn(0); setTrimOut(0); decodedRef.current = null;
    const audio = audioRef.current; if (audio) { audio.pause(); audio.currentTime = 0; }
    if (!sample?.audioUrl || !canvasRef.current) return;
    let cancelled = false; setLoading(true);
    fetch(sample.audioUrl).then((response) => { if (!response.ok) throw new Error("AUDIO_READ_FAILED"); return response.arrayBuffer(); })
      .then(async (bytes) => {
        const context = new AudioContext(); const buffer = await context.decodeAudioData(bytes.slice(0));
        if (!cancelled) { decodedRef.current = buffer; setDuration(buffer.duration); setTrimOut(buffer.duration); if (canvasRef.current) drawWaveform(canvasRef.current, buffer); }
        await context.close();
      })
      .catch(() => !cancelled && setError("Không giải mã được file. Hãy thử Mở thư mục để kiểm tra file gốc."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [sample?.id]);

  useEffect(() => { if (projectBpm) setTargetBpm(projectBpm); else if (sample?.bpm_original) setTargetBpm(sample.bpm_original); }, [projectBpm, sample?.id]);

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    const original = sample?.bpm_original || 0; const target = targetBpm || 0;
    audio.playbackRate = sync && original && target ? Math.max(.5, Math.min(2, target / original)) : 1;
    audio.preservesPitch = true;
  }, [sync, targetBpm, sample?.bpm_original]);

  useEffect(() => {
    if (!autoplayToken || !audioRef.current || !sample) return;
    audioRef.current.play().then(() => { setPlaying(true); window.mh.samples.previewed(sample.id); }).catch(() => setError("Windows chưa cho phép bắt đầu phát sample."));
  }, [autoplayToken]);

  useEffect(() => { if (decodedRef.current && canvasRef.current) drawWaveform(canvasRef.current, decodedRef.current, trimOpen ? [trimIn, trimOut] : undefined); }, [trimOpen, trimIn, trimOut]);

  const toggle = () => {
    const audio = audioRef.current; if (!audio || !sample) return;
    if (audio.paused) audio.play().then(() => { setPlaying(true); window.mh.samples.previewed(sample.id); }).catch(() => setError("Không phát được sample này."));
    else { audio.pause(); setPlaying(false); }
  };
  const previewTrim = () => { const audio = audioRef.current; if (!audio) return; audio.currentTime = trimIn; audio.play().then(()=>setPlaying(true)); };
  const saveTrim = async () => {
    if (!sample || !decodedRef.current || trimOut <= trimIn) return;
    const output = await window.mh.samples.saveTrimmed(sample.id, encodeWav(decodedRef.current, trimIn, trimOut), `-${time(trimIn).replace(/[:.]/g,"")}-${time(trimOut).replace(/[:.]/g,"")}`);
    if (output) onNotice?.(`Đã tạo WAV mới: ${output}`);
  };

  return <section className="wave-card">
    <div className="wave-stage"><canvas ref={canvasRef} className="waveform" aria-label="Waveform thật của sample đang chọn" />
      {!sample && <div className="wave-empty"><b>Chọn một sample</b><span>Waveform, BPM, key và vùng cắt sẽ tự nạp tại đây.</span></div>}
      {loading && <div className="wave-loading">Đang giải mã waveform…</div>}
    </div>
    {sample && <>
      <audio ref={audioRef} src={sample.audioUrl} onTimeUpdate={(event)=>{const value=event.currentTarget.currentTime;setCurrent(value);if(trimOpen&&value>=trimOut){event.currentTarget.pause();setPlaying(false);}}} onLoadedMetadata={(event)=>setDuration(event.currentTarget.duration)} onEnded={()=>setPlaying(false)} onError={()=>setError("File bị thiếu, hỏng hoặc định dạng chưa được Windows hỗ trợ.")} />
      <div className="transport">
        <button className="transport-primary" onClick={toggle} aria-label={playing ? "Tạm dừng" : "Phát sample"}>{playing ? "Ⅱ" : "▶"}</button>
        <span className="timecode">{time(current)} <i>/ {time(duration || (sample.duration_ms||0)/1000)}</i></span>
        <input className="seek" type="range" min="0" max={duration || 0} step="0.001" value={Math.min(current,duration||0)} onChange={(event)=>{if(audioRef.current)audioRef.current.currentTime=Number(event.target.value);}} aria-label="Vị trí phát" />
        <button className={trimOpen?"tool-button active":"tool-button"} onClick={()=>setTrimOpen(value=>!value)} aria-pressed={trimOpen}>Cắt vùng</button>
        <label className="tempo-target"><span>Tempo đích</span><input type="number" min="40" max="300" step="1" value={targetBpm||""} onChange={event=>setTargetBpm(Number(event.target.value))} aria-label="Tempo đích để sync"/><b>BPM</b></label>
        <label className="sync-control"><input type="checkbox" checked={sync} onChange={event=>setSync(event.target.checked)} disabled={!sample.bpm_original||!targetBpm}/><span>Sync tempo</span></label>
      </div>
      {trimOpen && <div className="trim-editor">
        <div className="trim-field"><label>In</label><input type="number" min="0" max={trimOut} step="0.001" value={trimIn.toFixed(3)} onChange={event=>setTrimIn(Math.min(Number(event.target.value),trimOut-.001))}/></div>
        <input className="trim-range in" type="range" min="0" max={duration} step="0.001" value={trimIn} onChange={event=>setTrimIn(Math.min(Number(event.target.value),trimOut-.001))} aria-label="Điểm bắt đầu vùng cắt"/>
        <input className="trim-range out" type="range" min="0" max={duration} step="0.001" value={trimOut} onChange={event=>setTrimOut(Math.max(Number(event.target.value),trimIn+.001))} aria-label="Điểm kết thúc vùng cắt"/>
        <div className="trim-field"><label>Out</label><input type="number" min={trimIn} max={duration} step="0.001" value={trimOut.toFixed(3)} onChange={event=>setTrimOut(Math.max(Number(event.target.value),trimIn+.001))}/></div>
        <button className="tool-button" onClick={previewTrim}>Nghe vùng</button><button className="tool-button primary" onClick={saveTrim}>Xuất WAV mới</button>
      </div>}
    </>}
    {error && <div className="inline-error" role="alert">{error}</div>}
  </section>;
}

export { encodeWav };
