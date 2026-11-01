import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { imgUrl } from '../api.js';
import Icon from './Icon.jsx';

// Auto-advancing banner slider. Swipe on touch screens, arrows and dots elsewhere.
export default function HeroCarousel({ slides }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(null);
  const n = slides.length;
  const go = (k) => setI((k + n) % n);

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6500);
    return () => clearInterval(t);
  }, [n, paused]);

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); touch.current = null; }}>
      {slides.map((s, k) => (
        <div key={s._id || k} className={`slide ${k === i ? 'on' : ''}`} aria-hidden={k !== i} style={s.image ? { '--img': `url("${imgUrl(s.image)}")` } : undefined}>
          <div className="container slide-inner">
            <h1>{s.title}</h1>
            {s.subtitle && <p>{s.subtitle}</p>}
            <div className="row wrap">
              <Link to={s.link || '/shop'} className="btn accent big" tabIndex={k === i ? 0 : -1}>{s.cta || 'Shop now'}</Link>
            </div>
          </div>
        </div>
      ))}
      {n > 1 && (
        <>
          <button className="hero-arrow l" onClick={() => go(i - 1)} aria-label="Previous slide"><Icon name="left" /></button>
          <button className="hero-arrow r" onClick={() => go(i + 1)} aria-label="Next slide"><Icon name="right" /></button>
          <div className="dots">{slides.map((_, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} />)}</div>
        </>
      )}
    </section>
  );
}
