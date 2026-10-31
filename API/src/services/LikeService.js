class LikeService {
    /**
     * Creates an instance of LikeService.
     * @param {Object} postRepository - Repository for post operations.
     * @param {Object} commentRepository - Repository for comment operations.
     * @param {Object} likeRepository - Repository for managing reactions/likes.
     */
    constructor(
        likeRepository,
        postRepository,
        commentRepository
    ) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
    }

    /**
     * Toggles a user's reaction ('like' or 'dislike') on a post (creates, updates, or removes reaction).
     * @param {Object} params - Parameters for toggling post reaction.
     * @param {number|string} params.postId - The ID of the post.
     * @param {number|string} params.authorId - The ID of the user reacting.
     * @param {'like'|'dislike'} params.type - The type of reaction.
     * @returns {Promise<Object>} Result object indicating action taken ('removed', 'updated', or 'created') and payload.
     * @throws {Error} If post is missing, inactive, locked, or inputs are invalid.
     */
    async togglePostLike({ postId, authorId, type }) {
        this.#validateId(postId);
        this.#validateId(authorId);
        this.#validateLikeType(type);

        const post = await this.postRepository.getById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        if (post.status !== 'active') {
            throw new Error('Not allowed to create like under an inactive post');
        }

        if (post.locked) {
            throw new Error('Post is locked. Forbidden');
        }

        const existingLike = await this.likeRepository.getByUserAndPost(authorId, postId);

        if (existingLike) {
            if (existingLike.type === type) {
                await this.likeRepository.delete(existingLike.id);
                return { 
                    action: 'removed',
                    message: 'Reaction canceled'
                };
            }

            await this.likeRepository.updateType(existingLike.id, type);
            const updatedLike = await this.likeRepository.getById(existingLike.id);
            return {
                action: 'updated',
                data: updatedLike
            };
        }

        const likeId = await this.likeRepository.create({
            authorId,
            targetType: 'post',
            targetId: Number(postId),
            type
        });

        const newLike = await this.likeRepository.getById(likeId);
        return {
            action: 'created',
            data: newLike
        };
    }

    /**
     * Toggles a user's reaction ('like' or 'dislike') on a comment (creates, updates, or removes reaction).
     * @param {Object} params - Parameters for toggling comment reaction.
     * @param {number|string} params.commentId - The ID of the comment.
     * @param {number|string} params.authorId - The ID of the user reacting.
     * @param {'like'|'dislike'} params.type - The type of reaction.
     * @returns {Promise<Object>} Result object indicating action taken ('removed', 'updated', or 'created') and payload.
     * @throws {Error} If comment is missing, inactive, locked, or inputs are invalid.
     */
    async toggleCommentLike({ commentId, authorId, type }) {
        this.#validateId(commentId);
        this.#validateId(authorId);
        this.#validateLikeType(type);

        const comment = await this.commentRepository.getById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.status !== 'active') {
            throw new Error('Not allowed to create like under an inactive comment');
        }

        if (comment.locked) {
            throw new Error('Comment is locked. Forbidden');
        }

        const existingLike = await this.likeRepository.getByUserAndComment(authorId, commentId);

        if (existingLike) {
            if (existingLike.type === type) {
                await this.likeRepository.delete(existingLike.id);
                return { 
                    action: 'removed',
                    message: 'Reaction canceled'
                };
            }

            await this.likeRepository.updateType(existingLike.id, type);
            const updatedLike = await this.likeRepository.getById(existingLike.id);
            return {
                action: 'updated',
                data: updatedLike
            };
        }

        const likeId = await this.likeRepository.create({
            authorId,
            targetType: 'comment',
            targetId: Number(commentId),
            type
        });

        const newLike = await this.likeRepository.getById(likeId);
        return { action: 'created', data: newLike };
    }

    /**
     * Retrieves all reactions associated with a specific post.
     * @param {number|string} postId - The ID of the post.
     * @returns {Promise<Array<Object>>} List of like/dislike entities for the target post.
     * @throws {Error} If post is not found.
     */
    async getPostLikes(postId) {
        this.#validateId(postId);

        const post = await this.postRepository.getById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        return this.likeRepository.getByTarget('post', postId);
    }

    /**
     * Retrieves all reactions associated with a specific comment.
     * @param {number|string} commentId - The ID of the comment.
     * @returns {Promise<Array<Object>>} List of like/dislike entities for the target comment.
     * @throws {Error} If comment is not found.
     */
    async getCommentLikes(commentId) {
        this.#validateId(commentId);

        const comment = await this.commentRepository.getById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        return this.likeRepository.getByTarget('comment', commentId);
    }

    /**
     * Deletes a user's reaction from a comment.
     * @param {number|string} commentId - The ID of the target comment.
     * @param {number|string} userId - The ID of the user whose reaction should be deleted.
     * @returns {Promise<boolean>} True if reaction was deleted.
     * @throws {Error} If reaction is not found.
     */
    async deleteCommentLike(commentId, userId) {
        this.#validateId(commentId);
        this.#validateId(userId);

        const existingLike = await this.likeRepository.getByUserAndComment(userId, commentId);
        if (!existingLike) {
            throw new Error('Like not found');
        }

        return this.likeRepository.delete(existingLike.id);
    }

    /**
     * Deletes a user's reaction from a post.
     * @param {number|string} postId - The ID of the target post.
     * @param {number|string} userId - The ID of the user whose reaction should be deleted.
     * @returns {Promise<boolean>} True if reaction was deleted.
     * @throws {Error} If reaction is not found.
     */
    async deletePostLike(postId, userId) {
        this.#validateId(postId);
        this.#validateId(userId);

        const existingLike = await this.likeRepository.getByUserAndPost(userId, postId);
        if (!existingLike) {
            throw new Error('Like not found');
        }

        return this.likeRepository.delete(existingLike.id);
    }

    /**
     * Validates that an entity identifier is a positive integer.
     * @param {any} id - Value to validate as an ID.
     * @throws {Error} If value is invalid or non-positive.
     */
    #validateId(id) { 
        if (id === undefined 
            || id === null 
            || !Number.isInteger(Number(id)) 
            || Number(id) <= 0 
        ) { 
            throw new Error('Invalid ID'); 
        } 
    }

    /**
     * Validates that reaction type is either 'like' or 'dislike'.
     * @param {string} type - Reaction type to validate.
     * @throws {Error} If type is invalid.
     */
    #validateLikeType(type) {
        if (!['like', 'dislike'].includes(type)) {
            throw new Error('Like type must be like or dislike'); 
        }
    }
}

module.exports = LikeService;