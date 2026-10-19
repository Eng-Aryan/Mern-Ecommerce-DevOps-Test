import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg, fmtDate } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Loader } from '../../components/Loader.jsx';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);

  const load = () => api.get('/admin/users').then((r) => setUsers(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);

  const act = async (fn, msg) => { try { await fn(); toast.success(msg); load(); } catch (e) { toast.error(errMsg(e)); } };

  if (!users) return <Loader />;
  return (
    <>
      <h1>Customers</h1>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{fmtDate(u.createdAt)}</td>
                <td>{u.isAdmin ? <span className="pill">Admin</span> : 'Customer'}</td>
                <td className="actions">
                  {u._id !== me._id && (
                    <>
                      <button className="btn small ghost" onClick={() => act(() => api.put(`/admin/users/${u._id}`, { isAdmin: !u.isAdmin }), 'Role updated')}>
                        {u.isAdmin ? 'Remove admin' : 'Make admin'}
                      </button>
                      <button className="btn small danger" onClick={() => window.confirm(`Delete ${u.name}?`) && act(() => api.delete(`/admin/users/${u._id}`), 'User deleted')}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
