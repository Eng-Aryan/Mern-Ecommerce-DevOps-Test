import { useEffect } from 'react';
import Icon from './Icon.jsx';

// Slide-in panel. side: 'left' | 'right' | 'bottom'
export default function Drawer({ open, onClose, side = 'right', title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('lock');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('lock'); };
  }, [open, onClose]);
  return (
    <div className={`overlay drawer-wrap ${open ? 'open' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()} aria-hidden={!open}>
      <aside className={`drawer ${side}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="drawer-body">{open && children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </div>
  );
}
