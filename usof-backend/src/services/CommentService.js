class CommentService {
    constructor(
        commentRepository,
        postRepository
        //likeRepository
    ) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        //this.likeRepository = likeRepository;
    }

    async createComment({
        postId,
        authorId,
        content
    }) {
        this.#validateId(postId);
        this.#validateId(authorId);
        this.#validateContent(content);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        if (post.status !== 'active') {
            throw new Error('Cannot create comment under inactive post');
        }

        if (post.locked) {
            throw new Error('Post is locked');
        }

        const commentId = await this.commentRepository.create({
            postId,
            authorId,
            content: content.trim()
        });

        return this.getCommentById(commentId);
    }

    async getCommentById(
        commentId,
        {
            userId = null,
            role = null
        } = {}
    ) {
        this.#validateId(commentId);
        
        const comment = await this.commentRepository.getById(commentId);

        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.status === 'active') {
            return comment;
        }

        if (role === 'admin') {
            return comment;
        }
        
        const isOwner = userId !== null && Number(comment.authorId) === Number(userId);
        if (isOwner) {
            return comment;
        }

        throw new Error('Comment is inactive');
    }

    async getCommentsByPostId(
        postId,
        {
            userId = null,
            role = null
        } = {}
    ) {
        this.#validateId(postId);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        const comments = await this.commentRepository.getAllCommentsUnderPostById(postId);

        if (role === 'admin') {
            return comments;
        }

        return comments.filter(comment => {
            if (comment.status === 'active') {
                return true;
            }

            return (
                userId !== null &&
                Number(comment.authorId) === Number(userId)
            );
        });
    }

    async updateCommentStatus({
        commentId,
        status
    }) {
        this.#validateId(commentId);
        this.#validateStatus(status);

        const comment = await this.commentRepository.getById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }
        
        const updated = await this.commentRepository.updateCommentStatus(commentId, status);
        if (!updated) {
            throw new Error('Failed to update comment status');
        }

        return this.commentRepository.getById(commentId);
    }

    async updateCommentLock({
        commentId,
        locked,
        userRole
    }) {
        this.#validateId(commentId);

        if (userRole !== 'admin') {
            throw new Error('Only admin can lock or unlock comments');
        }

        if (typeof locked !== 'boolean') {
            throw new Error('Locked must be a boolean');
        }

        const comment = await this.commentRepository.getById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        const updated = await this.commentRepository.updateCommentLock(commentId, locked);
        if (!updated) {
            throw new Error('Failed to update comment lock');
        }

        return this.commentRepository.getById(commentId);
    }

    async deleteComment({
        commentId,
        userId,
        userRole
    }) {
        this.#validateId(commentId);
        this.#validateId(userId);

        const comment = await this.commentRepository.getById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        const isOwner = comment.authorId === userId;
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new Error('Forbidden');
        }

        const deleted = await this.commentRepository.deleteComment(commentId);

        if (!deleted) {
            throw new Error('Failed to delete comment');
        }

        return true;
    }

    canModifyComment(comment, userId, userRole) {
        if (!comment) {
            return false;
        }

        if (userRole === 'admin') {
            return true;
        }

        return Number(userId) === Number(comment.authorId);
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

    #validateContent(content) {
        if (typeof content !== 'string'
            || content.trim().length < 1
        ) {
            throw new Error('Comment content cannot be empty');
        }
    }

    #validateStatus(status) {
        if (!['active', 'inactive'].includes(status)) {
            throw new Error('Comment status must be active or inactive');
        }
    }
}

module.exports = CommentService;