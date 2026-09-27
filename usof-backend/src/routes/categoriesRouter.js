const express = require('express');

const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddware');

/**
 * Creates and configures category express router.
 * @param {CategoryController} categoriesController - Instance of CategoryController.
 * @returns {express.Router} Configured router for category endpoints.
 */
function createCategoriesRouter(categoriesController) {
    const router = express.Router();

    /**
     * Get all categories
     * @route GET /api/categories
     * @access Public
     */
    router.get(
        '/',
        (req, res) => categoriesController.getAllCategories(req, res)
    );

    /**
     * Get category by ID
     * @route GET /api/categories/:category_id
     * @access Public
     */
    router.get(
        '/:category_id',
        (req, res) => categoriesController.getCategoryById(req, res)
    );

    /**
     * Get all posts associated with a category
     * @route GET /api/categories/:category_id/posts
     * @access Public
     */
    router.get(
        '/:category_id/posts',
        (req, res) => categoriesController.getPostsByCategory(req, res)
    );

    /**
     * Create a new category
     * @route POST /api/categories
     * @access Private (Admin)
     */
    router.post(
        '/',
        authenticate,
        requireRole('admin'),
        (req, res) => categoriesController.createCategory(req, res)
    );

    /**
     * Update category details
     * @route PATCH /api/categories/:category_id
     * @access Private (Admin)
     */
    router.patch(
        '/:category_id',
        authenticate,
        requireRole('admin'),
        (req, res) => categoriesController.updateCategory(req, res)
    );

    /**
     * Delete a category
     * @route DELETE /api/categories/:category_id
     * @access Private (Admin)
     */
    router.delete(
        '/:category_id',
        authenticate,
        requireRole('admin'),
        (req, res) => categoriesController.deleteCategory(req, res)
    );

    return router; 
}

module.exports = createCategoriesRouter;