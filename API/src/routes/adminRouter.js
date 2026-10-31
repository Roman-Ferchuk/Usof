const express = require('express');

const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

/**
 * Router with admin-panel helper endpoints. Every route requires an authenticated admin.
 * @param {AdminController} adminController
 * @returns {express.Router}
 */
function createAdminRouter(adminController) {
    const router = express.Router();

    router.use(authenticate, requireRole('admin'));

    router.get('/stats', (req, res) => adminController.getStats(req, res));
    router.get('/users', (req, res) => adminController.listUsers(req, res));
    router.get('/posts', (req, res) => adminController.listPosts(req, res));
    router.get('/comments', (req, res) => adminController.listComments(req, res));
    router.get('/likes', (req, res) => adminController.listLikes(req, res));

    router.delete('/likes/:like_id', (req, res) => adminController.deleteLike(req, res));
    router.patch('/users/:user_id/password', (req, res) => adminController.setUserPassword(req, res));
    router.patch('/users/:user_id/confirm-email', (req, res) => adminController.confirmUserEmail(req, res));

    return router;
}

module.exports = createAdminRouter;
