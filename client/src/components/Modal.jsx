import { useEffect } from 'react';
import Icon from './Icon.jsx';

// Centered dialog (also used as a bottom sheet on phones via CSS).
export default function Modal({ open, onClose, title, children, small, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('lock');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('lock'); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${small ? 'small' : ''} ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
