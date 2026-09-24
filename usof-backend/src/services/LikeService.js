class LikeService {
    constructor(
        postRepository,
        commentRepository,
        likeRepository
    ) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
    }

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
            postId,
            commentId: null,
            type
        });

        const newLike = await this.likeRepository.getById(likeId);
        return {
            action: 'created',
            data: newLike
        };
    }

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

        const existingLike = await this.likeRepository.getByUserAndComment(authorId, comment);

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
            postId: null,
            commentId: commentId,
            type
        });

        const newLike = await this.likeRepository.getById(likeId);
        return { action: 'created', data: newLike };
    }

    async getPostLikes(postId) {
        this.#validateId(postId);

        const post = await this.postRepository.getById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        return this.likeRepository.getByTarget('post', postId);
    }

    async getCommentLikes(commentId) {
        this.#validateId(commentId);

        const comment = await this.commentRepository.getById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        return this.likeRepository.getByTarget('comment', commentId);
    }

    async deleteCommentLike(commentId, userId) {
        this.#validateId(commentId);
        this.#validateId(userId);

        const existingLike = await this.likeRepository.getByUserAndComment(userId, commentId);
        if (!existingLike) {
            throw new Error('Like not found');
        }

        return this.likeRepository.delete(existingLike.id);
    }

    #validateId(id) { 
        if (id === undefined 
            || id === null 
            || !Number.isInteger(Number(id)) 
            || Number(id) <= 0 
        ) { 
            throw new Error('Invalid ID'); 
        } 
    }

    #validateLikeType(type) {
        if (!['like', 'dislike'].includes(type)) {
            throw new Error('Like type must be like or dislike'); 
        }
    }
}