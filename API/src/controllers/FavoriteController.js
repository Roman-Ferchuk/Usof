const ALLOWED_SORT = ['date', 'likes', 'added'];

class FavoriteController {
    constructor(favoriteService) {
        this.favoriteService = favoriteService;
    }

    #handleError(res, error) {
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        
        console.error('[FavoriteController]', error);
        return res.status(500).json({ message: 'Internal server error' });
    }

    async add(req, res) {
        try {
            const postId = Number(req.params.post_id);
            if (!Number.isInteger(postId)) {
                return res.status(400).json({ message: 'Invalid post id' });
            }

            await this.favoriteService.add(req.user, postId);
            return res.status(201).json({ message: 'Post added to favorites' });
        } catch (error) {
            return this.#handleError(res, error);
        }
    };

    async remove(req, res) {
        try {
            const postId = Number(req.params.post_id);
            if (!Number.isInteger(postId)) {
                return res.status(400).json({ message: 'Invalid post id' });
            }

            await this.favoriteService.remove(req.user, postId);
            return res.status(200).json({ message: 'Post removed from favorites' });
        } catch (error) {
            return this.#handleError(res, error);
        }
    };

    async getMine(req, res) {
        try {
            const { sort = 'added', categoryIds, dateFrom, dateTo } = req.query;
            const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
            const offset = Math.max(Number(req.query.offset) || 0, 0);

            if (!ALLOWED_SORT.includes(sort)) {
                return res.status(400).json({ message: `sort must be one of: ${ALLOWED_SORT.join(', ')}` });
            }

            let parsedCategoryIds = null;
            if (categoryIds) {
                parsedCategoryIds = String(categoryIds).split(',').map(Number);
                if (parsedCategoryIds.some(id => !Number.isInteger(id))) {
                    return res.status(400).json({ message: 'categoryIds must be comma-separated integers' });
                }
            }

            for (const [name, value] of Object.entries({ dateFrom, dateTo })) {
                if (value && isNaN(new Date(value).getTime())) {
                    return res.status(400).json({ message: `Invalid ${name}` });
                }
            }

            const posts = await this.favoriteService.getMyFavorites(req.user, {
                limit,
                offset,
                sort,
                categoryIds: parsedCategoryIds,
                dateFrom,
                dateTo
            });

            return res.status(200).json(posts);
        } catch (error) {
            return this.#handleError(res, error);
        }
    };
}

module.exports = FavoriteController;