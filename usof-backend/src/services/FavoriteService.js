class FavoriteService {
    constructor(favoriteRepository, postRepository) {
        this.favoriteRepository = favoriteRepository;
        this.postRepository = postRepository;
    }

    async #getAccessiblePost(postId, user) {
        const post = await this.postRepository.getById(postId);
        const canView = post && (
            post.status === 'active' ||
            post.authorId === user.id ||
            user.role === 'admin'
        );

        if (!canView) {
            const error = new Error('Post not found');
            error.status = 404;
            throw error;
        }
        return post;
    }

    async add(user, postId) {
        await this.#getAccessiblePost(postId, user);

        const added = await this.favoriteRepository.add(user.id, postId);
        if (!added) {
            const error = new Error('Post is already in favorites');
            error.status = 409;
            throw error;
        }
    }

    async remove(user, postId) {
        const removed = await this.favoriteRepository.remove(user.id, postId);
        if (!removed) {
            const error = new Error('Post is not in favorites');
            error.status = 404;
            throw error;
        }
    }

    async getMyFavorites(user, filters) {
        return this.favoriteRepository.getByUserIdWithFilters(user.id, filters);
    }
}

module.exports = FavoriteService;