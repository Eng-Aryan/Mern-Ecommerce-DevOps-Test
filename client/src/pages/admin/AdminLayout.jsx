import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="container admin">
      <aside className="admin-nav">
        <h3>Admin</h3>
        <NavLink end to="/admin">Dashboard</NavLink>
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/users">Customers</NavLink>
        <NavLink to="/admin/coupons">Coupons</NavLink>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
