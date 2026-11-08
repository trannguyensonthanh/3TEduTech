/**
 * Auth routes
 */
const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const authValidation = require('./auth.validation');
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

/**
 * Register a new user
 */
router.post(
  '/register',
  validate(authValidation.register),
  authController.register
);

/**
 * Login user
 */
router.post('/login', validate(authValidation.login), authController.login);

/**
 * Logout user
 */
/* [SỬA] Bỏ authenticate. Đăng xuất không phải thao tác đặc quyền: nó chỉ xóa
   cookie và thu hồi đúng thẻ làm mới được gửi kèm. Khi còn authenticate, một
   phiên có access token đã hết hạn sẽ nhận 401 và thẻ làm mới KHÔNG bao giờ bị
   thu hồi — đúng tình huống cần thu hồi nhất. */
router.post('/logout', authController.logout);

/**
 * Refresh authentication tokens
 */
router.post(
  '/refresh-tokens',
  validate(authValidation.refreshTokens),
  authController.refreshTokens
);

/**
 * Verify email
 */
router.get(
  '/verify-email',
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

/**
 * Request password reset
 */
router.post(
  '/request-password-reset',
  validate(authValidation.requestPasswordReset),
  authController.requestPasswordReset
);

/**
 * Reset password
 */
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword
);

/**
 * Change password
 */
router.post(
  '/change-password',
  authenticate,
  validate(authValidation.changePassword),
  authController.changePassword
);

/**
 * Register instructor
 */
router.post(
  '/register/instructor',
  validate(authValidation.registerInstructor),
  authController.registerInstructor
);

/**
 * Get Google Client ID
 */
router.get('/google/client-id', authController.getGoogleClientId);

/**
 * Login with Google
 */
router.post(
  '/google/login',
  validate(authValidation.googleLogin),
  authController.loginWithGoogle
);

/**
 * Login with Facebook
 */
router.post(
  '/facebook/login',
  validate(authValidation.facebookLogin),
  authController.loginWithFacebook
);

/**
 * Complete Facebook registration
 */
router.post(
  '/facebook/complete-registration',
  validate(authValidation.completeFacebookRegistration),
  authController.completeFacebookRegistration
);

module.exports = router;
