import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, admin, optionalAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as products from '../controllers/productController.js';
import * as orders from '../controllers/orderController.js';
import * as payment from '../controllers/paymentController.js';
import * as adminCtrl from '../controllers/adminController.js';
import * as wishlist from '../controllers/wishlistController.js';
import * as content from '../controllers/contentController.js';

const router = Router();
const limit = (minutes, max, message) => rateLimit({ windowMs: minutes * 60 * 1000, max, message: { message } });

// auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/forgot-password', limit(60, 10, 'Too many reset requests. Try again later'), auth.forgotPassword);
router.post('/auth/reset-password/:token', limit(60, 20, 'Too many attempts. Try again later'), auth.resetPassword);
router.get('/auth/me', protect, auth.me);
router.put('/auth/profile', protect, auth.updateProfile);
router.post('/auth/addresses', protect, auth.addAddress);
router.put('/auth/addresses/:id', protect, auth.updateAddress);
router.delete('/auth/addresses/:id', protect, auth.deleteAddress);

// storefront content
router.get('/settings', content.publicSettings);
router.get('/banners', content.publicBanners);
router.post('/newsletter', limit(60, 15, 'Too many sign-ups from this address'), content.subscribe);
router.post('/contact', limit(60, 10, 'Too many messages. Please try again later'), content.contact);

// products (specific paths first, then :id)
router.get('/products', products.getProducts);
router.get('/products/suggest', products.suggest);
router.get('/products/categories', products.getCategories);
router.get('/products/brands', products.getBrands);
router.get('/products/by-ids', products.getByIds);
router.get('/products/:id', optionalAuth, products.getProduct);
router.post('/products', protect, admin, products.createProduct);
router.put('/products/:id', protect, admin, products.updateProduct);
router.delete('/products/:id', protect, admin, products.deleteProduct);
router.post('/products/:id/reviews', protect, products.createReview);

// wishlist
router.get('/wishlist', protect, wishlist.getWishlist);
router.post('/wishlist/:productId', protect, wishlist.toggleWishlist);

// orders
router.post('/orders/quote', orders.quote);
router.post('/orders', protect, orders.createOrder);
router.get('/orders/mine', protect, orders.myOrders);
router.get('/orders/:id', protect, orders.getOrder);
router.put('/orders/:id/cancel', protect, orders.cancelOrder);

// payment (the Stripe webhook is mounted in server.js because it needs the raw body)
router.get('/payment/config', payment.config);
router.post('/payment/session/:orderId', protect, payment.createSession);
router.post('/payment/confirm/:orderId', protect, payment.confirmPayment);

// uploads
router.post('/upload', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose an image to upload' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// admin
router.use('/admin', protect, admin);
router.get('/admin/stats', adminCtrl.stats);

router.get('/admin/products', products.adminList);
router.get('/admin/products/export', products.exportProducts);
router.post('/admin/products/bulk', products.bulk);
router.post('/admin/products/:id/duplicate', products.duplicateProduct);

router.get('/admin/orders', orders.allOrders);
router.get('/admin/orders/export', orders.exportOrders);
router.put('/admin/orders-bulk', orders.bulkUpdateOrders);
router.put('/admin/orders/:id', orders.updateOrderStatus);

router.get('/admin/users', adminCtrl.listUsers);
router.get('/admin/users/export', adminCtrl.exportUsers);
router.get('/admin/users/:id', adminCtrl.getUser);
router.put('/admin/users/:id', adminCtrl.updateUser);
router.delete('/admin/users/:id', adminCtrl.deleteUser);

router.get('/admin/coupons', adminCtrl.listCoupons);
router.post('/admin/coupons', adminCtrl.createCoupon);
router.put('/admin/coupons/:id', adminCtrl.updateCoupon);
router.delete('/admin/coupons/:id', adminCtrl.deleteCoupon);

router.get('/admin/reviews', products.adminReviews);
router.delete('/admin/reviews/:productId/:reviewId', products.deleteReview);

router.get('/admin/categories', content.adminCategories);
router.post('/admin/categories', content.createCategory);
router.put('/admin/categories/:id', content.updateCategory);
router.delete('/admin/categories/:id', content.deleteCategory);

router.get('/admin/banners', content.listBanners);
router.post('/admin/banners', content.createBanner);
router.put('/admin/banners/:id', content.updateBanner);
router.delete('/admin/banners/:id', content.deleteBanner);

router.get('/admin/messages', content.listMessages);
router.put('/admin/messages/:id', content.updateMessage);
router.delete('/admin/messages/:id', content.deleteMessage);

router.get('/admin/subscribers', content.listSubscribers);
router.get('/admin/subscribers/export', content.exportSubscribers);
router.delete('/admin/subscribers/:id', content.deleteSubscriber);

router.get('/admin/settings', content.publicSettings);
router.put('/admin/settings', content.updateSettings);

export default router;
