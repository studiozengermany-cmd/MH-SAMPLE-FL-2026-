import { useEffect, useRef, useState } from "react";

function drawWaveform(canvas: HTMLCanvasElement, buffer: AudioBuffer, color = "#2bd6c4") {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(canvas.clientWidth, 300);
  const height = Math.max(canvas.clientHeight, 96);
  canvas.width = width * ratio; canvas.height = height * ratio;
  const ctx = canvas.getContext("2d")!; ctx.scale(ratio, ratio); ctx.clearRect(0, 0, width, height);
  const data = buffer.getChannelData(0); const step = Math.max(1, Math.floor(data.length / width));
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x < width; x++) {
    let min = 1, max = -1;
    const start = x * step;
    for (let i = 0; i < step && start + i < data.length; i++) { const value = data[start + i]; if (value < min) min = value; if (value > max) max = value; }
    ctx.moveTo(x, (1 + min) * height / 2); ctx.lineTo(x, (1 + max) * height / 2);
  }
  ctx.stroke();
}

export default function WaveformPlayer({ sample, autoplayToken }: { sample: Sample | null; autoplayToken: number }) {
  const audioRef = useRef<HTMLAudioElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false); const [current, setCurrent] = useState(0); const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    setError(""); setCurrent(0); setDuration(0); setPlaying(false);
    if (!sample?.audioUrl || !canvasRef.current) return;
    let cancelled = false;
    fetch(sample.audioUrl).then((r) => { if (!r.ok) throw new Error("Không đọc được file âm thanh"); return r.arrayBuffer(); })
      .then(async (bytes) => { const context = new AudioContext(); const buffer = await context.decodeAudioData(bytes); if (!cancelled && canvasRef.current) drawWaveform(canvasRef.current, buffer); await context.close(); })
      .catch(() => !cancelled && setError("Không thể tạo waveform cho file này."));
    return () => { cancelled = true; };
  }, [sample?.id]);

  useEffect(() => {
    if (!autoplayToken || !audioRef.current || !sample) return;
    audioRef.current.play().then(() => { setPlaying(true); window.mh.samples.previewed(sample.id); }).catch(() => setError("Trình phát chưa thể bắt đầu."));
  }, [autoplayToken]);

  const toggle = () => {
    const audio = audioRef.current; if (!audio || !sample) return;
    if (audio.paused) audio.play().then(() => { setPlaying(true); window.mh.samples.previewed(sample.id); }).catch(() => setError("Không phát được sample."));
    else { audio.pause(); setPlaying(false); }
  };
  const seek = (event: React.ChangeEvent<HTMLInputElement>) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); };
  const time = (seconds:number) => `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,"0")}.${String(Math.floor((seconds%1)*1000)).padStart(3,"0")}`;

  return <section className="wave-card">
    <canvas ref={canvasRef} className="waveform" aria-label="Waveform của sample" />
    {!sample && <div className="wave-empty">Chọn một sample để nghe và xem waveform thật.</div>}
    {sample && <>
      <audio ref={audioRef} src={sample.audioUrl} onTimeUpdate={(e)=>setCurrent(e.currentTarget.currentTime)} onLoadedMetadata={(e)=>setDuration(e.currentTarget.duration)} onEnded={()=>setPlaying(false)} onError={()=>setError("File âm thanh bị thiếu, hỏng hoặc không được hỗ trợ.")} />
      <div className="transport">
        <button className="play-main" onClick={toggle} aria-label={playing ? "Tạm dừng" : "Phát"}>{playing ? "Ⅱ" : "▶"}</button>
        <span className="time">{time(current)} <i>/ {time(duration || (sample.duration_ms||0)/1000)}</i></span>
        <input className="seek" type="range" min="0" max={duration || 0} step="0.001" value={Math.min(current,duration||0)} onChange={seek} aria-label="Vị trí phát" />
        <span className="preview-only">Nghe thử — không sửa file gốc</span>
      </div>
    </>}
    {error && <div className="inline-error">{error}</div>}
  </section>;
}

