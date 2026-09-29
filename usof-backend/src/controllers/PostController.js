/**
 * Controller class handling HTTP requests related to posts, comments, reactions, and subscriptions.
 */
class PostController {
    /**
     * Creates an instance of PostController.
     * @param {Object} postService - Instance of PostService.
     * @param {Object} likeService - Instance of LikeService.
     * @param {Object} commentService - Instance of CommentService.
     * @param {Object} subscriptionService - Instance of SubscriptionService.
     */
    constructor(
        postService,
        likeService,
        commentService,
        subscriptionService
    ) {
        this.postService = postService;
        this.likeService = likeService;
        this.commentService = commentService;
        this.subscriptionService = subscriptionService;
    }

    /**
     * Gets paginated posts with filters.
     * @route GET /api/posts
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async getPosts(req, res) {
        try {
            const { page, limit, sort, categoryIds, dateFrom, dateTo, status } = req.query;
            const parsedCategories = categoryIds 
                ? (Array.isArray(categoryIds) ? categoryIds.map(Number) : categoryIds.split(',').map(Number))
                : null;

            const posts = await this.postService.getPosts({
                page,
                limit,
                sort,
                categoryIds: parsedCategories,
                dateFrom,
                dateTo,
                status,
                userId: req.user ? req.user.id : null,
                role: req.user ? req.user.role : null
            });

            return res.status(200).json(posts);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Gets a single post by ID.
     * @route GET /api/posts/:post_id
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async getPostById(req, res) {
        try {
            const { post_id } = req.params;
            const post = await this.postService.getPostById(post_id, {
                userId: req.user ? req.user.id : null,
                role: req.user ? req.user.role : null
            });

            return res.status(200).json(post);
        } catch (error) {
            const statusCode = error.message === 'Post not found' ? 404 : 403;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Gets all comments for a post.
     * @route GET /api/posts/:post_id/comments
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async getPostComments(req, res) {
        try {
            const { post_id } = req.params;

            const postComments = await this.commentService.getCommentsByPostId(post_id, {
                userId: req.user ? req.user.id : null,
                role: req.user ? req.user.role : null
            });

            return res.status(200).json(postComments);
        } catch (error) {
            const statusCode = error.message === 'Post not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Creates a new comment under a post.
     * @route POST /api/posts/:post_id/comments
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async createNewComment(req, res) {
        try {
            const { post_id } = req.params;

            const comment = await this.commentService.createComment({
                postId: post_id,
                authorId: req.user.id,
                content: req.body.content,
                role: req.user.role
            });

            return res.status(201).json(comment);
        } catch (error) {
            let statusCode = 400;
            if (error.message === 'Post not found') statusCode = 404;
            if (error.message === 'Post is locked') statusCode = 403;

            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Gets categories associated with a post.
     * @route GET /api/posts/:post_id/categories
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async getPostCategories(req, res) {
        try {
            const { post_id } = req.params;
            const categories = await this.postService.getPostCategories(post_id);

            return res.status(200).json(categories);
        } catch (error) {
            const statusCode = error.message === 'Post not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Gets reactions/likes on a post.
     * @route GET /api/posts/:post_id/like
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async getPostLikes(req, res) {
        try {
            const { post_id } = req.params;
            const likes = await this.likeService.getPostLikes(post_id);

            return res.status(200).json(likes);
        } catch (error) {
            const statusCode = error.message === 'Post not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Creates a new post.
     * @route POST /api/posts
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async createPost(req, res) {
        try {
            const categories = req.body.categories ? 
                (Array.isArray(req.body.categories) ? req.body.categories : [req.body.categories]) : [];
            const images = req.files ? req.files.map(file => file.path) : [];

            const post = await this.postService.createPost({
                authorId: req.user.id,
                title: req.body.title,
                content: req.body.content,
                categories: categories,
                images: images
            });

            return res.status(201).json(post);
        } catch (error) {
            const statusCode = error.message === 'Post not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Toggles reaction (like/dislike) on a post.
     * @route POST /api/posts/:post_id/like
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async togglePostLike(req, res) {
        try {
            const { post_id } = req.params;

            const result = await this.likeService.togglePostLike({
                postId: post_id,
                authorId: req.user.id,
                type: req.body.type
            });

            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.message === 'Post not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Updates an existing post.
     * @route PATCH /api/posts/:post_id
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async updatePost(req, res) {
        try {
            const { post_id } = req.params;

            const post = await this.postService.updatePost({
                postId: post_id,
                data: req.body,
                userId: req.user.id,
                userRole: req.user.role
            });

            return res.status(200).json(post);
        } catch (error) {
            const statusCode = error.message === 'Post not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Updates post lock status (Admin only).
     * @route PATCH /api/posts/:post_id/lock
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async updatePostLock(req, res) {
        try {
            const { post_id } = req.params;
            const { locked } = req.body;

            const updatedPost = await this.postService.updatePostLock(
                post_id,
                locked,
                req.user.role
            );

            return res.status(200).json(updatedPost);
        } catch (error) {
            let statusCode = 400;
            if (error.message === 'Post not found') statusCode = 404;
            if (error.message.includes('Only admin')) statusCode = 403;

            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Deletes a post.
     * @route DELETE /api/posts/:post_id
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async deletePost(req, res) {
        try {
            const { post_id } = req.params;

            const result = await this.postService.deletePost({
                postId: post_id,
                userId: req.user.id,
                userRole: req.user.role
            });

            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.message === 'Post not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Deletes a like/reaction from a post.
     * @route DELETE /api/posts/:post_id/like
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async deletePostLike(req, res) {
        try {
            const { post_id } = req.params;
            const userId = req.user.id;

            const result = await this.likeService.deletePostLike(post_id, userId);

            return res.status(200).json({ 
                message: 'Like successfully removed',
                result 
            });
        } catch (error) {
            let statusCode = 400;
            if (error.message === 'Post not found' || error.message === 'Like not found') {
                statusCode = 404;
            }

            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Subscribes the authenticated user to post updates.
     * @route POST /api/posts/:post_id/subscribe
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async subscribeToPost(req, res) {
        try {
            const { post_id } = req.params;
            const result = await this.subscriptionService.subscribe(post_id, {
                userId: req.user.id,
                role: req.user.role
            });
            return res.status(201).json(result);
        } catch (error) {
            const statusCode = error.message === 'Post not found' ? 404
                : error.message === 'Post is inactive' ? 403 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Unsubscribes the authenticated user from post updates.
     * @route DELETE /api/posts/:post_id/subscribe
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async unsubscribeFromPost(req, res) {
        try {
            const { post_id } = req.params;
            const result = await this.subscriptionService.unsubscribe(post_id, req.user.id);
            return res.status(200).json(result);
        } catch (error) {
            const statusCode = error.message === 'Subscription not found' ? 404 : 400;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Gets the current user's subscription status for a post.
     * @route GET /api/posts/:post_id/subscribe
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async getSubscriptionStatus(req, res) {
        try {
            const { post_id } = req.params;
            const result = await this.subscriptionService.getStatus(post_id, req.user.id);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = PostController;