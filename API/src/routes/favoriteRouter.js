const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

function createFavoriteRouter(favoriteController) {
    const router = express.Router();

    router.get(
        '/users/favorites',
        authMiddleware,
        (req, res) => favoriteController.getMine(req, res)
    );

    router.post(
        '/posts/:post_id/favorite',
        authMiddleware,
        (req, res) => favoriteController.add(req, res)
    );

    router.delete(
        '/posts/:post_id/favorite',
        authMiddleware,
        (req, res) => favoriteController.remove(req, res)
    );

    return router;
}

module.exports = createFavoriteRouter;
