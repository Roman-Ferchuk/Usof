/**
 * Controller class handling HTTP requests related to comments and comment reactions.
 */
class CommentController {
    /**
     * Creates an instance of CommentController.
     * @param {Object} commentService - Instance of CommentService.
     * @param {Object} likeService - Instance of LikeService.
     */
    constructor(commentService, likeService) {
        this.commentService = commentService;
        this.likeService = likeService;
    }

    /**
     * Gets specified comment data by ID.
     * @route GET /api/comments/:comment_id
     */
    async getCommentById(req, res) {
        try {
            const { comment_id } = req.params;
            const comment = await this.commentService.getCommentById(comment_id, {
                userId: req.user ? req.user.id : null,
                role: req.user ? req.user.role : null
            });

            return res.status(200).json(comment);
        } catch (error) {
            let statusCode = 400;
            if (error.message === 'Comment not found') statusCode = 404;
            if (error.message === 'Comment is inactive') statusCode = 403;

            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Gets all likes under the specified comment.
     * @route GET /api/comments/:comment_id/like
     */
    async getCommentLikes(req, res) {
        try {
            const { comment_id } = req.params;
            const likes = await this.likeService.getCommentLikes(comment_id);

            return res.status(200).json(likes);
        } catch (error) {
            const statusCode = error.message === 'Comment not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Toggles reaction (like/dislike) under a comment.
     * @route POST /api/comments/:comment_id/like
     */
    async toggleCommentLike(req, res) {
        try {
            const { comment_id } = req.params;

            const result = await this.likeService.toggleCommentLike({
                commentId: comment_id,
                authorId: req.user.id,
                type: req.body.type
            });

            return res.status(200).json(result);
        } catch (error) {
            let statusCode = 400;
            if (error.message === 'Comment not found') statusCode = 404;
            if (error.message.includes('Forbidden')) statusCode = 403;

            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Updates specified comment status (active/inactive).
     * @route PATCH /api/comments/:comment_id
     */
    async updateCommentStatus(req, res) {
        try {
            const { comment_id } = req.params;
            const { status } = req.body;

            const updatedComment = await this.commentService.updateCommentStatus({
                commentId: comment_id,
                status,
                userId: req.user.id,
                userRole: req.user.role
            });

            return res.status(200).json(updatedComment);
        } catch (error) {
            const statusCode = error.message === 'Comment not found' ? 404
                : error.message === 'Forbidden' ? 403 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Locks or unlocks a comment (Admin only).
     * @route PATCH /api/comments/:comment_id/lock
     */
    async updateCommentLock(req, res) {
        try {
            const { comment_id } = req.params;
            const { locked } = req.body;

            const updatedComment = await this.commentService.updateCommentLock({
                commentId: comment_id,
                locked,
                userRole: req.user.role 
            });

            return res.status(200).json(updatedComment);
        } catch (error) {
            const statusCode = error.message === 'Comment not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Creates a reply to a comment.
     * @route POST /api/comments/:comment_id/reply
     */
    async replyToComment(req, res) {
        try {
            const { comment_id } = req.params;
            const parent = await this.commentService.getCommentById(comment_id, {
                userId: req.user.id,
                role: req.user.role
            });

            const reply = await this.commentService.createComment({
                postId: parent.postId,
                parentId: comment_id,
                authorId: req.user.id,
                content: req.body.content
            });

            return res.status(201).json(reply);
        } catch (error) {
            let statusCode = 400;
            if (error.message.includes('not found')) statusCode = 404;
            if (error.message === 'Comment is inactive' || error.message.includes('locked')) statusCode = 403;

            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Deletes a comment.
     * @route DELETE /api/comments/:comment_id
     */
    async deleteComment(req, res) {
        try {
            const { comment_id } = req.params;

            await this.commentService.deleteComment({
                commentId: comment_id,
                userId: req.user.id,
                userRole: req.user.role
            });

            return res.status(200).json({ message: 'Comment successfully deleted' });
        } catch (error) {
            let statusCode = 400;
            if (error.message === 'Comment not found') statusCode = 404;
            if (error.message === 'Forbidden') statusCode = 403;

            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Deletes a user's reaction from a comment.
     * @route DELETE /api/comments/:comment_id/like
     */
    async deleteCommentLike(req, res) {
        try {
            const { comment_id } = req.params;
            const userId = req.user.id;

            await this.likeService.deleteCommentLike(comment_id, userId);

            return res.status(200).json({ message: 'Like successfully removed' });
        } catch (error) {
            let statusCode = 400;
            if (error.message === 'Comment not found' || error.message === 'Like not found') {
                statusCode = 404;
            }

            return res.status(statusCode).json({ error: error.message });
        }
    }
}

module.exports = CommentController;