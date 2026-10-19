import { Router } from 'express';
import { protect, admin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as products from '../controllers/productController.js';
import * as orders from '../controllers/orderController.js';
import * as payment from '../controllers/paymentController.js';
import * as adminCtrl from '../controllers/adminController.js';
import * as wishlist from '../controllers/wishlistController.js';

const router = Router();

// auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', protect, auth.me);
router.put('/auth/profile', protect, auth.updateProfile);

// products
router.get('/products', products.getProducts);
router.get('/products/categories', products.getCategories);
router.get('/products/:id', products.getProduct);
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

// payment
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
router.get('/admin/orders', orders.allOrders);
router.put('/admin/orders/:id', orders.updateOrderStatus);
router.get('/admin/users', adminCtrl.listUsers);
router.put('/admin/users/:id', adminCtrl.updateUser);
router.delete('/admin/users/:id', adminCtrl.deleteUser);
router.get('/admin/coupons', adminCtrl.listCoupons);
router.post('/admin/coupons', adminCtrl.createCoupon);
router.put('/admin/coupons/:id', adminCtrl.updateCoupon);
router.delete('/admin/coupons/:id', adminCtrl.deleteCoupon);

export default router;
