import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, fmtDate } from '../../api.js';
import { useUI } from '../../context/UIContext.jsx';
import Pagination from '../../components/Pagination.jsx';
import Rating from '../../components/Rating.jsx';
import Icon from '../../components/Icon.jsx';
import { Loader } from '../../components/Loader.jsx';
import { PageHeader, Thumb } from './ui.jsx';

export default function AdminReviews() {
  const { confirm } = useUI();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const load = () => api.get('/admin/reviews', { params: { page } }).then((r) => setData(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const remove = async (r) => {
    if (!(await confirm({ title: 'Delete this review?', message: `By ${r.name} on ${r.productName}. The product rating is recalculated.`, confirmLabel: 'Delete', danger: true }))) return;
    api.delete(`/admin/reviews/${r.productId}/${r._id}`).then(() => { toast.success('Review deleted'); load(); }).catch((e) => toast.error(errMsg(e)));
  };

  return (
    <>
      <PageHeader title="Reviews" sub={data ? `${data.total} review${data.total === 1 ? '' : 's'}, newest first` : ''} />
      {!data ? <Loader /> : (
        <>
          <div className="review-list">
            {data.reviews.map((r) => (
              <article className="panel review-item" key={r._id}>
                <Thumb src={r.image} name={r.productName} />
                <div className="grow">
                  <div className="row between wrap"><Link to={`/admin/products/${r.productId}`}><strong>{r.productName}</strong></Link><span className="muted small">{fmtDate(r.createdAt)}</span></div>
                  <Rating value={r.rating} /> <span className="small">{r.name}{r.verified && <span className="verified"><Icon name="check" size={12} /> Verified</span>}</span>
                  <p>{r.comment}</p>
                </div>
                <button className="icon-btn danger" onClick={() => remove(r)} aria-label="Delete review"><Icon name="trash" size={18} /></button>
              </article>
            ))}
            {data.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
