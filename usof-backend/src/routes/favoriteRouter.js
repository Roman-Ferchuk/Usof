const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

function createFavoriteRouter(favoriteController) {
    const router = express.Router();

    router.get(
        '/users/favorites',
        authMiddleware,
        favoriteController.getMine
    );

    router.post(
        '/posts/:post_id/favorite',
        authMiddleware,
        favoriteController.add
    );

    router.delete(
        '/posts/:post_id/favorite',
        authMiddleware,
        favoriteController.remove
    );

    return router;
};

module.exports = createFavoriteRouter;