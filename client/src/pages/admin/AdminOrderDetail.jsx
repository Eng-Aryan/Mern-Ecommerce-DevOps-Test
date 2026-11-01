import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, money, shortId, fmtDate, fmtDateTime } from '../../api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Summary from '../../components/Summary.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader, ErrorBox } from '../../components/Loader.jsx';
import { PageHeader, Card, Thumb } from './ui.jsx';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const s = useSettings();
  const [o, setO] = useState(null);
  const [error, setError] = useState('');
  const [ship, setShip] = useState({ carrier: '', trackingNumber: '' });
  const [note, setNote] = useState('');

  const apply = (order) => { setO(order); setShip({ carrier: order.carrier || '', trackingNumber: order.trackingNumber || '' }); setNote(order.adminNote || ''); };
  useEffect(() => { api.get(`/orders/${id}`).then((r) => apply(r.data)).catch((e) => setError(errMsg(e))); }, [id]);

  const update = async (patch, msg = 'Order updated') => {
    try { const { data } = await api.put(`/admin/orders/${id}`, patch); apply({ ...data, user: o.user }); toast.success(msg); } catch (e) { toast.error(errMsg(e)); }
  };

  if (error) return <ErrorBox message={error} />;
  if (!o) return <Loader />;
  const a = o.shippingAddress;

  return (
    <>
      <PageHeader title={`Order #${shortId(o._id)}`} sub={`Placed ${fmtDateTime(o.createdAt)}`}>
        <Link to="/admin/orders" className="btn ghost small"><Icon name="arrowLeft" size={16} /> Orders</Link>
        <button className="btn ghost small" onClick={() => window.print()}><Icon name="printer" size={16} /> Print</button>
      </PageHeader>

      <div className="ad-cols form-cols">
        <div className="stack">
          <Card title="Items">
            {o.items.map((i) => (
              <div className="mini-row" key={i._id}>
                <Thumb src={i.image} name={i.name} />
                <span className="grow"><Link to={`/admin/products/${i.product}`}>{i.name}</Link><small className="muted">{i.variantLabel ? `${i.variantLabel} · ` : ''}{i.sku || ''}</small></span>
                <span className="muted">{i.qty} × {money(i.price)}</span><strong>{money(i.qty * i.price)}</strong>
              </div>
            ))}
            <Summary q={o} />
          </Card>

          <Card title="Shipping">
            <form className="form flat" onSubmit={(e) => { e.preventDefault(); update(ship, 'Tracking saved'); }}>
              <div className="fields">
                <label>Carrier<input list="carriers" value={ship.carrier} onChange={(e) => setShip({ ...ship, carrier: e.target.value })} placeholder="DHL, FedEx, local courier…" /><datalist id="carriers"><option>DHL</option><option>FedEx</option><option>UPS</option><option>Aramex</option></datalist></label>
                <label>Tracking number<input value={ship.trackingNumber} onChange={(e) => setShip({ ...ship, trackingNumber: e.target.value })} /></label>
              </div>
              <div className="row wrap">
                <button className="btn small">Save tracking</button>
                {o.status === 'Processing' && <button type="button" className="btn small ghost" onClick={() => update({ status: 'Shipped', ...ship }, 'Marked as shipped')}><Icon name="truck" size={16} /> Mark as shipped</button>}
                {o.status === 'Shipped' && <button type="button" className="btn small ghost" onClick={() => update({ status: 'Delivered' }, 'Marked as delivered')}><Icon name="check" size={16} /> Mark as delivered</button>}
              </div>
              <p className="small muted">Customers are emailed when an order is marked shipped or delivered (if email is set up).</p>
            </form>
          </Card>

          <Card title="History">
            <ul className="timeline">{[...(o.statusHistory || [])].reverse().map((h, k) => <li key={k}><b>{h.status}</b><span>{h.note}</span><time className="muted small">{fmtDateTime(h.at)}</time></li>)}</ul>
          </Card>
        </div>

        <div className="stack">
          <Card title="Status">
            <div className="row between"><StatusBadge status={o.status} /><select value={o.status} onChange={(e) => update({ status: e.target.value })} aria-label="Order status">{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></div>
            <label className="check"><input type="checkbox" checked={o.isPaid} onChange={(e) => update({ isPaid: e.target.checked }, e.target.checked ? 'Marked as paid' : 'Marked as unpaid')} /> {o.isPaid ? `Paid ${fmtDate(o.paidAt)}` : 'Mark as paid'}</label>
            <p className="small muted">Payment: {o.paymentMethod === 'COD' ? 'Pay on delivery' : 'Card (Stripe)'}{o.paymentResult?.id && <><br />Reference: <code>{o.paymentResult.id}</code></>}</p>
            <p className="small muted">Cancelling returns the items to stock. Delivered pay-on-delivery orders are marked paid automatically.</p>
          </Card>
          <Card title="Customer">
            <p><Link to={`/admin/users/${o.user?._id}`}><strong>{o.user?.name || 'Deleted user'}</strong></Link><br />{o.user?.email && <a href={`mailto:${o.user.email}`}>{o.user.email}</a>}{o.user?.phone && <><br />{o.user.phone}</>}</p>
            <h3>Ship to</h3>
            <p>{a.fullName}<br />{a.address}<br />{a.city}, {a.postalCode}<br />{a.country}{a.phone && <><br />{a.phone}</>}</p>
            {o.customerNote && <><h3>Customer note</h3><p className="notice info">{o.customerNote}</p></>}
          </Card>
          <Card title="Internal note">
            <textarea rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only staff can see this" maxLength={1000} />
            <button className="btn small ghost" onClick={() => update({ adminNote: note }, 'Note saved')}>Save note</button>
          </Card>
        </div>
      </div>
      <p className="print-only small">{s.storeName} · Packing slip / invoice</p>
    </>
  );
}
