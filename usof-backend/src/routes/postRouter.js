const express = require('express');
const authenticate = require('../middlewares/authMiddleware');
const optionalAuthenticate = require('../middlewares/optionalAuthenticateMiddleware');
const upload = require('../middlewares/uploadMiddleware'); 

/**
 * Creates and configures post express router.
 * @param {PostController} postController - Instance of PostController.
 * @returns {express.Router} Configured router for post endpoints.
 */
function createPostRouter(postController) {
    const router = express.Router();

    /**
     * @route GET /api/posts
     * @desc Get all posts with filters and pagination
     * @access Public / Optional Auth
     */
    router.get(
        '/',
        optionalAuthenticate,
        (req, res) => postController.getPosts(req, res)
    );

    /**
     * @route GET /api/posts/:post_id
     * @desc Get post by ID
     * @access Public / Optional Auth
     */
    router.get(
        '/:post_id',
        optionalAuthenticate,
        (req, res) => postController.getPostById(req, res)
    );

    /**
     * @route GET /api/posts/:post_id/comments
     * @desc Get comments under a post
     * @access Public / Optional Auth
     */
    router.get(
        '/:post_id/comments',
        optionalAuthenticate,
        (req, res) => postController.getPostComments(req, res)
    );

    /**
     * @route POST /api/posts/:post_id/comments
     * @desc Create a comment under a post
     * @access Private
     */
    router.post(
        '/:post_id/comments',
        authenticate,
        (req, res) => postController.createComment(req, res)
    );

    /**
     * @route GET /api/posts/:post_id/categories
     * @desc Get post categories
     * @access Public
     */
    router.get(
        '/:post_id/categories',
        (req, res) => postController.getPostCategories(req, res)
    );

    /**
     * @route GET /api/posts/:post_id/like
     * @desc Get post likes/dislikes
     * @access Public
     */
    router.get(
        '/:post_id/like',
        (req, res) => postController.getPostLikes(req, res)
    );

    /**
     * @route POST /api/posts
     * @desc Create a new post
     * @access Private
     */
    router.post(
        '/',
        authenticate,
        upload.array('images', 5), 
        (req, res) => postController.createPost(req, res)
    );

    /**
     * @route POST /api/posts/:post_id/like
     * @desc Reaction toggle (like/dislike)
     * @access Private
     */
    router.post(
        '/:post_id/like',
        authenticate,
        (req, res) => postController.togglePostLike(req, res)
    );

    /**
     * @route PATCH /api/posts/:post_id
     * @desc Update post details
     * @access Private
     */
    router.patch(
        '/:post_id',
        authenticate,
        (req, res) => postController.updatePost(req, res)
    );

    /**
     * @route PATCH /api/posts/:post_id/lock
     * @desc Lock or unlock a post (Admin only)
     * @access Private (Admin)
     */
    router.patch(
        '/:post_id/lock',
        authenticate,
        (req, res) => postController.updatePostLock(req, res)
    );

    /**
     * @route DELETE /api/posts/:post_id
     * @desc Delete post
     * @access Private
     */
    router.delete(
        '/:post_id',
        authenticate,
        (req, res) => postController.deletePost(req, res)
    );

    /**
     * @route DELETE /api/posts/:post_id/like
     * @desc Delete a like under a post
     * @access Private
     */
    router.delete(
        '/:post_id/like',
        authenticate,
        (req, res) => postController.deletePostLike(req, res)
    );

    return router;
}

module.exports = createPostRouter;