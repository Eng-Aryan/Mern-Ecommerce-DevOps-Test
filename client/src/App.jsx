import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { Loader } from './components/Loader.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import ProductPage from './pages/ProductPage.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderPage from './pages/OrderPage.jsx';
import MyOrders from './pages/MyOrders.jsx';
import Account from './pages/Account.jsx';
import Auth from './pages/Auth.jsx';
import Wishlist from './pages/Wishlist.jsx';
import NotFound from './pages/NotFound.jsx';

// Admin screens are code-split so shoppers never download them.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons.jsx'));

const guard = (el, adminOnly) => <ProtectedRoute adminOnly={adminOnly}>{el}</ProtectedRoute>;

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <Navbar />
      <main id="main">
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/register" element={<Auth mode="register" />} />
            <Route path="/checkout" element={guard(<Checkout />)} />
            <Route path="/order/:id" element={guard(<OrderPage />)} />
            <Route path="/orders" element={guard(<MyOrders />)} />
            <Route path="/account" element={guard(<Account />)} />
            <Route path="/wishlist" element={guard(<Wishlist />)} />
            <Route path="/admin" element={guard(<AdminLayout />, true)}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductForm />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="coupons" element={<AdminCoupons />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
