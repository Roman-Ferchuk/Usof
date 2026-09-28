const express = require('express');
const authenticate = require('../middleware/authMiddleware'); 
const optionalAuthenticate = require('../middlewares/optionalAuthenticateMiddleware');
const requireRole = require('../middleware/roleMiddleware');

/**
 * Creates and configures comment express router.
 * @param {CommentController} commentController - Instance of CommentController.
 * @returns {express.Router} Configured router for comment endpoints.
 */
function createCommentRouter(commentController) {
    const router = express.Router();

    /**
     * @route GET /api/comments/:comment_id
     * @desc Get specified comment data
     * @access Public / Optional Auth
     */
    router.get(
        '/:comment_id',
        optionalAuthenticate,
        (req, res) => commentController.getCommentById(req, res)
    );

    /**
     * @route GET /api/comments/:comment_id/like
     * @desc Get all likes under the specified comment
     * @access Public
     */
    router.get(
        '/:comment_id/like',
        (req, res) => commentController.getCommentLikes(req, res)
    );

    /**
     * @route POST /api/comments/:comment_id/like
     * @desc Create or toggle a reaction (like/dislike) under a comment
     * @access Private
     */
    router.post(
        '/:comment_id/like',
        authenticate,
        (req, res) => commentController.toggleCommentLike(req, res)
    );

    /**
     * @route PATCH /api/comments/:comment_id
     * @desc Update specified comment data (change status to active/inactive)
     * @access Private
     */
    router.patch(
        '/:comment_id',
        authenticate, 
        (req, res) => commentController.updateCommentStatus(req, res)
    );

    /**
     * @route PATCH /api/comments/:comment_id/lock
     * @desc Lock or unlock a comment (Admin only)
     * @access Private (Admin)
     */
    router.patch(
        '/:comment_id/lock',
        authenticate,
        requireRole('admin'),
        (req, res) => commentController.updateCommentLock(req, res)
    );

    /**
     * @route DELETE /api/comments/:comment_id
     * @desc Delete a comment
     * @access Private
     */
    router.delete(
        '/:comment_id',
        authenticate, 
        (req, res) => commentController.deleteComment(req, res)
    );

    /**
     * @route DELETE /api/comments/:comment_id/like
     * @desc Delete a like under a comment
     * @access Private
     */
    router.delete(
        '/:comment_id/like',
        authenticate, 
        (req, res) => commentController.deleteCommentLike(req, res)
    );

    return router;
}

module.exports = createCommentRouter;