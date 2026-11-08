// file: src/api/carts/carts.validation.js

const Joi = require('joi');

/**
 * Validation for adding a course to cart
 */
const addCourseToCart = {
  body: Joi.object().keys({
    // [SỬA] Thêm .positive(): trước đây courseId âm (-5) lọt qua validation
    // rồi mới bị service trả 404 — tầng kiểm tra đầu vào bỏ sót.
    courseId: Joi.number().integer().positive().required(),
  }),
};

/**
 * Validation for removing a course from cart
 */
const removeCourseFromCart = {
  params: Joi.object().keys({
    // [SỬA] Thêm .positive(): trước đây courseId âm (-5) lọt qua validation
    // rồi mới bị service trả 404 — tầng kiểm tra đầu vào bỏ sót.
    courseId: Joi.number().integer().positive().required(),
  }),
};

/**
 * Validation for clearing the cart
 */
const clearCart = {};

module.exports = {
  addCourseToCart,
  removeCourseFromCart,
  clearCart,
};
