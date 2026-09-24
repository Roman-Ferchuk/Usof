class CommentService {
    /**
     * Creates an instance of CommentService.
     * @param {Object} commentRepository - Repository for managing comment entity persistence.
     * @param {Object} postRepository - Repository for retrieving and managing post entities.
     */
    constructor(
        commentRepository,
        postRepository
        //likeRepository
    ) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        //this.likeRepository = likeRepository;
    }

    /**
     * Creates a new comment under a specific post.
     * @param {Object} params - Parameters for creating a comment.
     * @param {number|string} params.postId - The ID of the post to comment on.
     * @param {number|string} params.authorId - The ID of the user creating the comment.
     * @param {string} params.content - Content of the comment.
     * @returns {Promise<Object>} The newly created comment object.
     * @throws {Error} If post is missing, inactive, locked, or if validations fail.
     */
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

    /**
     * Retrieves a single comment by ID while applying access control rules.
     * @param {number|string} commentId - The ID of the comment to retrieve.
     * @param {Object} [options] - Context options for access control.
     * @param {number|string|null} [options.userId=null] - The ID of the requesting user.
     * @param {string|null} [options.role=null] - The role of the requesting user (e.g., 'admin').
     * @returns {Promise<Object>} The comment entity instance.
     * @throws {Error} If comment does not exist or if the user lacks permission to view it.
     */
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

    /**
     * Retrieves all visible comments for a specified post based on user role and ownership.
     * @param {number|string} postId - The ID of the post whose comments are being fetched.
     * @param {Object} [options] - Context options for access control.
     * @param {number|string|null} [options.userId=null] - The ID of the requesting user.
     * @param {string|null} [options.role=null] - The role of the requesting user (e.g., 'admin').
     * @returns {Promise<Array<Object>>} List of visible comments.
     * @throws {Error} If the post is not found.
     */
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

    /**
     * Updates the status of a comment (e.g., 'active' or 'inactive').
     * @param {Object} params - Parameters for updating status.
     * @param {number|string} params.commentId - The ID of the comment to update.
     * @param {string} params.status - The target status ('active' or 'inactive').
     * @returns {Promise<Object>} The updated comment entity instance.
     * @throws {Error} If comment is not found or update operation fails.
     */
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

    /**
     * Toggles the lock status on a comment (Admin only).
     * @param {Object} params - Parameters for updating lock state.
     * @param {number|string} params.commentId - The ID of the comment.
     * @param {boolean} params.locked - Lock status boolean.
     * @param {string} params.userRole - The role of the executing user.
     * @returns {Promise<Object>} The updated comment entity instance.
     * @throws {Error} If non-admin attempts lock, or comment is missing/fails to update.
     */
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

    /**
     * Deletes a comment by ID if the requester is the owner or an admin.
     * @param {Object} params - Parameters for deletion.
     * @param {number|string} params.commentId - The ID of the comment to delete.
     * @param {number|string} params.userId - The ID of the requesting user.
     * @param {string} params.userRole - The role of the requesting user.
     * @returns {Promise<boolean>} Resolves to true on successful deletion.
     * @throws {Error} If user lacks permissions or deletion fails.
     */
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

    /**
     * Checks if a specific user has permissions to modify a given comment.
     * @param {Object|null} comment - The comment object to check permissions for.
     * @param {number|string} userId - The ID of the user requesting modification.
     * @param {string} userRole - The role of the requesting user.
     * @returns {boolean} True if authorized, otherwise false.
     */
    canModifyComment(comment, userId, userRole) {
        if (!comment) {
            return false;
        }

        if (userRole === 'admin') {
            return true;
        }

        return Number(userId) === Number(comment.authorId);
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
     * Validates that content string is non-empty.
     * @param {any} content - Value to validate.
     * @throws {Error} If content is not a non-empty string.
     */
    #validateContent(content) {
        if (typeof content !== 'string'
            || content.trim().length < 1
        ) {
            throw new Error('Comment content cannot be empty');
        }
    }

    /**
     * Validates that comment status matches allowed enumerated values.
     * @param {string} status - Status string to validate.
     * @throws {Error} If status is not 'active' or 'inactive'.
     */
    #validateStatus(status) {
        if (!['active', 'inactive'].includes(status)) {
            throw new Error('Comment status must be active or inactive');
        }
    }
}

module.exports = CommentService;