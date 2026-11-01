import { useEffect, useRef, useState } from 'react';
import ProductImage from './ProductImage.jsx';
import Icon from './Icon.jsx';
import { imgUrl } from '../api.js';

// Product gallery: swipeable on phones (scroll-snap), thumbnails on desktop, tap to open a full-screen viewer.
export default function Gallery({ images = [], name }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState(false);
  const track = useRef(null);
  const list = images.length ? images : [''];

  useEffect(() => { setActive(0); }, [images.join('|')]); // eslint-disable-line
  useEffect(() => {
    if (!lightbox) return;
    const key = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setActive((a) => (a + 1) % list.length);
      if (e.key === 'ArrowLeft') setActive((a) => (a - 1 + list.length) % list.length);
    };
    document.addEventListener('keydown', key);
    document.body.classList.add('lock');
    return () => { document.removeEventListener('keydown', key); document.body.classList.remove('lock'); };
  }, [lightbox, list.length]);

  const onScroll = () => {
    const el = track.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const select = (k) => {
    setActive(k);
    const el = track.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="gallery">
      <div className="g-track" ref={track} onScroll={onScroll}>
        {list.map((src, k) => (
          <button key={k} className={`g-slide ${k === active ? 'on' : ''}`} onClick={() => src && setLightbox(true)} aria-label="Open image viewer">
            <ProductImage className="gallery-main" src={src} name={name} eager={k === 0} />
          </button>
        ))}
      </div>
      {list.length > 1 && (
        <>
          <div className="g-dots">{list.map((_, k) => <i key={k} className={k === active ? 'on' : ''} />)}</div>
          <div className="thumbs">
            {list.map((src, k) => (
              <button key={k} className={k === active ? 'on' : ''} onClick={() => select(k)} aria-label={`Show image ${k + 1}`}><ProductImage src={src} name={name} /></button>
            ))}
          </div>
        </>
      )}
      {lightbox && (
        <div className="lightbox" onClick={(e) => e.target === e.currentTarget && setLightbox(false)}>
          <button className="icon-btn lb-close" onClick={() => setLightbox(false)} aria-label="Close viewer"><Icon name="x" /></button>
          {list.length > 1 && <button className="icon-btn lb-nav l" onClick={() => setActive((active - 1 + list.length) % list.length)} aria-label="Previous"><Icon name="left" /></button>}
          <img className={zoom ? 'zoom' : ''} src={imgUrl(list[active])} alt={name} onClick={() => setZoom(!zoom)} />
          {list.length > 1 && <button className="icon-btn lb-nav r" onClick={() => setActive((active + 1) % list.length)} aria-label="Next"><Icon name="right" /></button>}
        </div>
      )}
    </div>
  );
}
