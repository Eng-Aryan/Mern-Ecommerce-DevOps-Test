import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg, money, imgUrl } from '../../api.js';
import Icon from '../../components/Icon.jsx';

export const PageHeader = ({ title, children, sub }) => (
  <div className="ad-head"><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div><div className="ad-actions">{children}</div></div>
);

export const Card = ({ title, action, children, className = '' }) => (
  <section className={`panel ${className}`}>{(title || action) && <div className="row between"><h2>{title}</h2>{action}</div>}{children}</section>
);

export const Delta = ({ value }) => value == null ? <span className="delta muted">—</span> : <span className={`delta ${value >= 0 ? 'up' : 'down'}`}><Icon name={value >= 0 ? 'up' : 'down'} size={12} /> {Math.abs(value)}%</span>;

export const StatCard = ({ label, value, change, icon, hint }) => (
  <div className="stat">
    <span className="stat-ico"><Icon name={icon} size={18} /></span>
    <span className="muted">{label}</span>
    <strong>{value}</strong>
    <small>{change !== undefined && <Delta value={change} />} {hint && <span className="muted">{hint}</span>}</small>
  </div>
);

// Upload one or more images to the server; calls onUploaded(url) for each. Also accepts a pasted URL.
export function ImageUpload({ onUploaded, multiple, label = 'Upload image' }) {
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const [url, setUrl] = useState('');
  const upload = async (e) => {
    const files = [...e.target.files];
    setBusy(true);
    for (const file of files) {
      const body = new FormData();
      body.append('image', file);
      try { onUploaded((await api.post('/upload', body)).data.url); } catch (err) { toast.error(errMsg(err)); }
    }
    setBusy(false);
    e.target.value = '';
  };
  return (
    <div className="uploader">
      <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={upload} />
      <button type="button" className="btn ghost small" disabled={busy} onClick={() => input.current.click()}><Icon name="upload" size={16} /> {busy ? 'Uploading…' : label}</button>
      <span className="muted small">or</span>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste image URL" aria-label="Image URL" />
      <button type="button" className="btn ghost small" onClick={() => { if (url.trim()) { onUploaded(url.trim()); setUrl(''); } }}>Add</button>
    </div>
  );
}

export const Thumb = ({ src, name = '' }) => (src ? <img className="thumb-img" src={imgUrl(src)} alt={name} loading="lazy" /> : <span className="thumb-img ph">{name[0]}</span>);

// Revenue chart: smooth area line with hover/touch tooltip. No chart library needed.
export function SalesChart({ series }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 220, pad = { l: 8, r: 8, t: 14, b: 26 };
  const max = Math.max(...series.map((d) => d.sales), 1);
  const x = (i) => pad.l + (series.length === 1 ? 0 : (i / (series.length - 1)) * (W - pad.l - pad.r));
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.sales).toFixed(1)}`).join(' ');
  const area = `${line} L${x(series.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  const every = Math.ceil(series.length / 7);
  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = (e.touches?.[0]?.clientX ?? e.clientX) - r.left;
    setHover(Math.max(0, Math.min(series.length - 1, Math.round((cx / r.width) * (series.length - 1)))));
  };
  const d = hover != null ? series[hover] : null;
  return (
    <div className="chart" onMouseMove={pick} onTouchMove={pick} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Sales over time">
        <defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity=".35" /><stop offset="1" stopColor="var(--primary)" stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} className="grid-line" />)}
        <path d={area} fill="url(#sg)" />
        <path d={line} className="series-line" fill="none" vectorEffect="non-scaling-stroke" />
        {d && <><line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} className="cursor" vectorEffect="non-scaling-stroke" /><circle cx={x(hover)} cy={y(d.sales)} r="5" className="dot-pt" /></>}
      </svg>
      <div className="x-labels">{series.map((s, i) => i % every === 0 && <span key={s.date} style={{ left: `${(i / Math.max(series.length - 1, 1)) * 100}%` }}>{new Date(s.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>)}</div>
      {d && <div className="tip" style={{ left: `${(hover / Math.max(series.length - 1, 1)) * 100}%` }}><b>{money(d.sales)}</b><span>{d.orders} order{d.orders === 1 ? '' : 's'}</span><small>{new Date(d.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</small></div>}
    </div>
  );
}

// Orders-by-status donut chart.
export function Donut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 42, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 100 100" className="donut" role="img" aria-label="Orders by status">
        <circle cx="50" cy="50" r={R} className="donut-bg" />
        {total > 0 && data.map((d) => { const len = (d.value / total) * C; const el = <circle key={d.label} cx="50" cy="50" r={R} fill="none" stroke={d.color} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 50 50)" />; acc += len; return el; })}
        <text x="50" y="49" textAnchor="middle" className="donut-n">{total}</text><text x="50" y="62" textAnchor="middle" className="donut-l">orders</text>
      </svg>
      <ul className="legend">{data.map((d) => <li key={d.label}><i style={{ background: d.color }} />{d.label}<b>{d.value}</b></li>)}</ul>
    </div>
  );
}
