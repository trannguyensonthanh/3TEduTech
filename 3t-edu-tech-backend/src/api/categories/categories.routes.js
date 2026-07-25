// Category and Course routes

const express = require('express');
const validate = require('../../middlewares/validation.middleware');
const categoryValidation = require('./categories.validation');
const categoryController = require('./categories.controller');
const {
  authenticate,
  authorize,
} = require('../../middlewares/auth.middleware');
const Roles = require('../../core/enums/Roles');
const { cache } = require('../../middlewares/cache.middleware');

const router = express.Router();
const courseValidation = require('../courses/courses.validation');
const courseController = require('../courses/courses.controller');

/**
 * Get all categories
 */
router.get(
  '/',
  validate(categoryValidation.getCategories),
  cache(86400),
  categoryController.getCategories
);

/**
 * Create a new category
 */
router.post(
  '/',
  authenticate,
  authorize([Roles.ADMIN, Roles.SUPERADMIN]),
  validate(categoryValidation.createCategory),
  categoryController.createCategory
);

/**
 * Get, update, or delete a category by ID
 */
router
  .route('/:categoryId')
  .get(validate(categoryValidation.getCategory), cache(86400), categoryController.getCategory)
  .patch(
    authenticate,
    authorize([Roles.ADMIN, Roles.SUPERADMIN]),
    validate(categoryValidation.updateCategory),
    categoryController.updateCategory
  )
  .delete(
    authenticate,
    authorize([Roles.ADMIN, Roles.SUPERADMIN]),
    validate(categoryValidation.deleteCategory),
    categoryController.deleteCategory
  );

/**
 * Get category by slug
 */
router.get(
  '/slug/:categorySlug',
  validate(categoryValidation.getCategoryBySlug),
  cache(86400),
  categoryController.getCategoryBySlug
);

/**
 * Get courses by category slug
 */
router.get(
  '/:categorySlug/courses',
  validate(courseValidation.getCoursesByCategorySlug),
  courseController.getCoursesByCategorySlug
);

module.exports = router;
