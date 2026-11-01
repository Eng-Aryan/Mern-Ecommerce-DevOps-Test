import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { money, imgUrl } from '../api.js';
import useDebounce from '../hooks/useDebounce.js';
import Icon from './Icon.jsx';

// Search field with instant suggestions (products and categories).
export default function SearchBox({ onDone, autoFocus, className = '' }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [open, setOpen] = useState(false);
  const term = useDebounce(q.trim(), 220);
  const navigate = useNavigate();
  const box = useRef(null);

  useEffect(() => {
    if (term.length < 2) { setRes(null); return; }
    let alive = true;
    api.get('/products/suggest', { params: { q: term } }).then((r) => alive && setRes(r.data)).catch(() => {});
    return () => { alive = false; };
  }, [term]);

  useEffect(() => {
    const away = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const go = (e) => {
    e?.preventDefault();
    navigate(q.trim() ? `/shop?keyword=${encodeURIComponent(q.trim())}` : '/shop');
    setOpen(false); setQ(''); onDone?.();
  };
  const done = () => { setOpen(false); setQ(''); onDone?.(); };
  const has = res && (res.products.length || res.categories.length);

  return (
    <div className={`searchbox ${className}`} ref={box}>
      <form onSubmit={go} role="search">
        <Icon name="search" size={18} className="lead" />
        <input value={q} autoFocus={autoFocus} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          placeholder="Search packs, boots, stoves…" aria-label="Search products" autoComplete="off" enterKeyHint="search" type="search" />
      </form>
      {open && term.length >= 2 && res && (
        <div className="suggest" role="listbox">
          {!has && <p className="muted pad">No matches for “{term}”</p>}
          {res.categories.map((c) => <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} onClick={done} className="sg-cat"><Icon name="grid" size={16} /> {c} <span className="muted small">category</span></Link>)}
          {res.products.map((p) => (
            <Link key={p._id} to={`/product/${p._id}`} onClick={done} className="sg-item" role="option">
              {p.images?.[0] ? <img src={imgUrl(p.images[0])} alt="" /> : <span className="img-fallback">{p.name[0]}</span>}
              <span className="grow"><strong>{p.name}</strong><small className="muted">{p.category}</small></span>
              <span className="price">{money(p.price)}</span>
            </Link>
          ))}
          {has && <button className="sg-all" onClick={go}>See all results for “{term}” <Icon name="arrowRight" size={16} /></button>}
        </div>
      )}
    </div>
  );
}
