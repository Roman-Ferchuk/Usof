const express = require('express');

const { authenticate } = require('../middleware/authMiddleware');

/**
 * Initializes Express router for authentication endpoints.
 * @param {Object} authController - Instance of AuthController handling requests.
 * @returns {express.Router} Express router populated with auth routes.
 */
function createAuthRouter(authController) {
    const router = express.Router();

    /**
     * @route POST /api/auth/register
     * @desc Register a new user account and request email confirmation.
     * @access Public
     */
    router.post(
        '/register',
        (req, res) => authController.register(req, res)
    );

    /**
     * @route GET /api/auth/confirm-email/:confirm_token
     * @desc Confirm user email address via email confirmation token.
     * @access Public
     */
    router.get(
        '/confirm-email/:confirm_token',
        (req, res) => authController.confirmEmail(req, res)
    );

    /**
     * @route POST /api/auth/login
     * @desc Authenticate user and issue JWT token.
     * @access Public
     */
    router.post(
        '/login',
        (req, res) => authController.login(req, res)
    );

    /**
     * @route POST /api/auth/logout
     * @desc Log out user session.
     * @access Private (Authenticated users)
     */
    router.post(
        '/logout',
        authenticate,
        (req, res) => authController.logout(req, res)
    );

    /**
     * @route POST /api/auth/password-reset
     * @desc Send password reset link to user's email.
     * @access Public
     */
    router.post(
        '/password-reset',
        (req, res) => authController.requestPasswordReset(req, res)
    );

    /**
     * @route POST /api/auth/password-reset/:confirm_token
     * @desc Reset account password using token from email.
     * @access Public
     */
    router.post(
        '/password-reset/:confirm_token',
        (req, res) => authController.resetPassword(req, res)
    );

    return router;
}

module.exports = createAuthRouter;