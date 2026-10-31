const express = require('express');

/**
 * @param {StatsController} statsController
 * @returns {express.Router} Mounted at /api.
 */
function createStatsRouter(statsController) {
    const router = express.Router();

    router.get('/stats', (req, res) => statsController.getOverview(req, res));
    router.post('/posts/:post_id/view', (req, res) => statsController.recordView(req, res));

    return router;
}

module.exports = createStatsRouter;
