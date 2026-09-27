const express = require('express');

const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddware');

const upload = require('../middlewares/uploadMiddleware');

/**
 * Initializes Express router for user management endpoints.
 * @param {Object} userController - Instance of UserController handling user endpoints.
 * @returns {express.Router} Express router populated with user endpoints.
 */
function createUserRouter(userController) {
    const router = express.Router();

    /**
     * @route GET /api/users
     * @desc Get all registered user profiles.
     * @access Private (Admin only)
     */
    router.get(
        '/',
        authenticate,
        requireRole('admin'),
        (req, res) => userController.getAllUsers(req, res)
    );

    /**
     * @route GET /api/users/:user_id
     * @desc Get specific user profile details by user ID.
     * @access Private (Authenticated users)
     */
    router.get(
        '/:user_id',
        authenticate,
        (req, res) => userController.getUserById(req, res)
    );

    /**
     * @route POST /api/users
     * @desc Create a new user profile with specified role.
     * @access Private (Admin only)
     */
    router.post(
        '/',
        authenticate,
        requireRole('admin'),
        (req, res) => userController.createUser(req, res)
    );

    /**
     * @route PATCH /api/users/avatar
     * @desc Upload and update user avatar image.
     * @access Private (Account owner or Admin)
     */
    router.patch(
        '/avatar',
        authenticate,
        upload.single('avatar'),
        (req, res) => userController.updateAvatar(req, res)
    );

    /**
     * @route PATCH /api/users/:user_id
     * @desc Update user profile information.
     * @access Private (Account owner or Admin)
     */
    router.patch(
        '/:user_id',
        authenticate,
        (req, res) => userController.updateProfile(req, res)
    );

    /**
     * @route PATCH /api/users/:user_id/role
     * @desc Change the system role of a specified user.
     * @access Private (Admin only)
     */
    router.patch(
        '/:user_id/role',
        authenticate,
        requireRole('admin'),
        (req, res) => userController.changeRole(req, res)
    );

    /**
     * @route DELETE /api/users/:user_id
     * @desc Delete user record permanently.
     * @access Private (Account owner or Admin)
     */
    router.delete(
        '/:user_id',
        authenticate,
        (req, res) => userController.deleteUser(req, res)
    );

    return router;
}

module.exports = createUserRouter;