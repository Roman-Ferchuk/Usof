class FavoriteService {
    constructor(favoriteRepository, postRepository, postImageRepository) {
        this.favoriteRepository = favoriteRepository;
        this.postRepository = postRepository;
        this.postImageRepository = postImageRepository;
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
        const posts = await this.favoriteRepository.getByUserIdWithFilters(user.id, filters);
        const imagesByPost = await this.postImageRepository.getImagesForPosts(posts.map((post) => post.id));

        return Promise.all(posts.map(async (post) => ({
            ...post,
            categories: await this.postRepository.getCategories(post.id),
            images: imagesByPost.get(post.id) || []
        })));
    }
}

module.exports = FavoriteService;