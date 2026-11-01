import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import MobileTabBar from './components/MobileTabBar.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
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
import { Auth, ForgotPassword, ResetPassword } from './pages/Auth.jsx';
import Wishlist from './pages/Wishlist.jsx';
import { About, Contact, FAQ, ShippingReturns, Privacy, Terms } from './pages/Pages.jsx';
import NotFound from './pages/NotFound.jsx';

// Admin screens are code-split so shoppers never download them.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail.jsx'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories.jsx'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners.jsx'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews.jsx'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages.jsx'));
const AdminSubscribers = lazy(() => import('./pages/admin/AdminSubscribers.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'));

const guard = (el, adminOnly) => <ProtectedRoute adminOnly={adminOnly}>{el}</ProtectedRoute>;

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const routes = (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/checkout" element={guard(<Checkout />)} />
        <Route path="/order/:id" element={guard(<OrderPage />)} />
        <Route path="/orders" element={guard(<MyOrders />)} />
        <Route path="/account" element={guard(<Account />)} />
        <Route path="/wishlist" element={guard(<Wishlist />)} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/shipping-returns" element={<ShippingReturns />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/admin" element={guard(<AdminLayout />, true)}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );

  // the admin panel has its own shell, so the storefront header/footer stay out of it
  if (isAdmin) return routes;

  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <Navbar />
      <main id="main">{routes}</main>
      <Footer />
      <CartDrawer />
      <MobileTabBar />
      <InstallPrompt />
    </>
  );
}
