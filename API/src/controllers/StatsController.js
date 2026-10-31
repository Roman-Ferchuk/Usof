/**
 * Public statistics and the view counter.
 */
class StatsController {
    /** @param {StatsRepository} statsRepository */
    constructor(statsRepository) {
        this.statsRepository = statsRepository;
    }

    /** @route GET /api/stats */
    async getOverview(req, res) {
        try {
            return res.status(200).json(await this.statsRepository.getOverview());
        } catch (error) {
            console.error('[StatsController.getOverview]', error.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /** @route POST /api/posts/:post_id/view */
    async recordView(req, res) {
        const postId = Number(req.params.post_id);
        if (!Number.isInteger(postId) || postId <= 0) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        try {
            const counted = await this.statsRepository.recordView(postId);
            return counted
                ? res.status(204).end()
                : res.status(404).json({ error: 'Post not found' });
        } catch (error) {
            console.error('[StatsController.recordView]', error.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = StatsController;
