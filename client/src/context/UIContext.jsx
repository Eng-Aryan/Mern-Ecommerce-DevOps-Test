import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from '../components/Modal.jsx';

const Ctx = createContext(null);
export const useUI = () => useContext(Ctx);

// Shared UI state: mobile menu, search overlay and a promise-based confirm dialog.
export function UIProvider({ children }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  // const ok = await confirm({ title, message, confirmLabel, danger })
  const confirm = useCallback((opts) => new Promise((resolve) => { resolver.current = resolve; setDialog(opts); }), []);
  const close = (v) => { resolver.current?.(v); setDialog(null); };

  return (
    <Ctx.Provider value={{ menu, setMenu, search, setSearch, confirm }}>
      {children}
      <Modal open={Boolean(dialog)} onClose={() => close(false)} title={dialog?.title || 'Are you sure?'} small>
        {dialog?.message && <p>{dialog.message}</p>}
        <div className="row end">
          <button className="btn ghost" onClick={() => close(false)}>Cancel</button>
          <button className={`btn ${dialog?.danger ? 'danger-solid' : ''}`} autoFocus onClick={() => close(true)}>{dialog?.confirmLabel || 'Confirm'}</button>
        </div>
      </Modal>
    </Ctx.Provider>
  );
}
