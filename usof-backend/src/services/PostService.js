/**
 * Service handling business logic for posts, their categories, images, and permissions.
 */
class PostService {
    /**
     * Creates an instance of PostService.
     * @param {Object} repositories - Injection object containing repository instances.
     * @param {Object} repositories.postRepository - Repository for post entity persistence.
     * @param {Object} repositories.categoryRepository - Repository for category data access.
     * @param {Object} repositories.postImageRepository - Repository for post image handling.
     */
    constructor({ 
        postRepository, 
        categoryRepository, 
        postImageRepository 
    }) { 
        this.postRepository = postRepository; 
        this.categoryRepository = categoryRepository; 
        this.postImageRepository = postImageRepository; 
    }

    /**
     * Creates a new post with optional categories and images.
     * @param {Object} params - Post creation parameters.
     * @param {number|string} params.authorId - ID of the user creating the post.
     * @param {string} params.title - Title of the post.
     * @param {string} params.content - Main body content.
     * @param {number[]} [params.categories=[]] - Array of category IDs to associate.
     * @param {string[]} [params.images=[]] - Array of image file paths.
     * @returns {Promise<Object>} Created post entity.
     * @throws {Error} If validation fails or specified categories do not exist.
     */
    async createPost({
        authorId,
        title,
        content,
        categories = [],
        images = []
    }) {
        this.#validateId(authorId);
        this.#validateTitle(title);
        this.#validateContent(content);
        this.#validateCategories(categories);

        await this.#validateCategoriesExist(categories);

        const postId = await this.postRepository.create({
            authorId,
            title: title.trim(),
            content: content.trim(),
            status: 'active'
        });

        if (categories.length > 0) {
            await this.postRepository.addCategories(postId, categories);
        }

        if (images.length > 0) {
            await this.postImageRepository.createMany({
                postId,
                imagePaths: images
            });
        }

        return await this.getPostById(postId, {
            userId: authorId,
            role: 'user'
        });
    }

    /**
     * Fetches paginated posts based on filters, sorting, and user role/permissions.
     * @param {Object} options - Filtering and pagination options.
     * @param {number|string} [options.page=1] - Current page index.
     * @param {number|string} [options.limit=10] - Number of items per page.
     * @param {string} [options.sort='likes'] - Sorting strategy ('likes' | 'date').
     * @param {number[]} [options.categoryIds=null] - Optional category filter IDs.
     * @param {Date|string} [options.dateFrom=null] - Lower bound date filter.
     * @param {Date|string} [options.dateTo=null] - Upper bound date filter.
     * @param {string} [options.status=null] - Filter post status ('active' | 'inactive').
     * @param {number|string} [options.userId=null] - Context user ID requesting posts.
     * @param {string} [options.role=null] - Role of requesting user ('user' | 'admin').
     * @returns {Promise<Object>} Paginated result object containing metadata and post list.
     * @throws {Error} If pagination or status parameters are invalid.
     */
    async getPosts({
        page = 1,
        limit = 10,
        sort = 'likes',
        categoryIds = null,
        dateFrom = null,
        dateTo = null,
        status = null,
        userId = null,
        role = null
    }) {
        this.#validatePagination(page, limit);

        if (status) {
            this.#validateStatus(status);
        }

        const offset = (Number(page) - 1) * Number(limit);

        const posts = await this.postRepository.getAllWithFilters({
            limit: Number(limit),
            offset,
            sort,
            categoryIds,
            dateFrom,
            dateTo,
            status,
            userId: userId ? Number(userId) : null,
            role
        });

        return {
            page: Number(page),
            limit: Number(limit),
            data: posts
        };
    }

    /**
     * Retrieves a single post by ID with status visibility checks.
     * @param {number|string} postId - ID of the target post.
     * @param {Object} [context={}] - Requesting user context.
     * @param {number|string} [context.userId=null] - Requesting user ID.
     * @param {string} [context.role=null] - Requesting user role.
     * @returns {Promise<Object>} The target post object.
     * @throws {Error} If post doesn't exist or is inactive and requester isn't owner/admin.
     */
    async getPostById(
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

        if (post.status === 'active') {
            return post;
        }

        const isOwner = userId !== null && Number(post.authorId) === Number(userId);
        const isAdmin = role === 'admin';

        if (!isOwner && !isAdmin) { 
            throw new Error('Post is inactive');
        }

        return post;
    }

    /**
     * Gets all categories associated with a specific post.
     * @param {number|string} postId - ID of the post.
     * @returns {Promise<Object[]>} Array of associated category entities.
     * @throws {Error} If post ID is invalid or post does not exist.
     */
    async getPostCategories(postId) {
        this.#validateId(postId);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        return this.postRepository.getCategories(postId);
    }

    /**
     * Gets all images attached to a specific post.
     * @param {number|string} postId - ID of the post.
     * @returns {Promise<Object[]>} Array of attached image entities/paths.
     * @throws {Error} If post ID is invalid or post does not exist.
     */
    async getPostImages(postId) {
        this.#validateId(postId);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        return this.postImageRepository.getImagesInPost(postId);
    }

    /**
     * Updates an existing post with strict role permission enforcement.
     * @param {Object} params - Update parameters.
     * @param {number|string} params.postId - ID of the post to update.
     * @param {Object} params.data - Attributes to update (title, content, status, categories).
     * @param {number|string} params.userId - ID of the requesting user.
     * @param {string} params.userRole - Role of the requesting user ('user' | 'admin').
     * @returns {Promise<Object>} The updated post instance.
     * @throws {Error} If non-owner/non-admin attempts update, or admin tries editing content.
     */
    async updatePost({
        postId,
        data,
        userId,
        userRole
    }) {
        this.#validateId(postId);
        this.#validateId(userId);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        const isOwner = Number(post.authorId) === Number(userId); 
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new Error('Forbidden');
        }

        if (data.title !== undefined) {
            this.#validateTitle(data.title);

            if (data.title.trim() !== post.title) {
                post.title = data.title.trim();
            }
        }

        if (data.content !== undefined) {
            if (isAdmin && !isOwner) {
                throw new Error('Admin cannot edit post content');
            }

            this.#validateContent(data.content);

            if (data.content.trim() !== post.content) {
                post.content = data.content.trim();
            }
        }

        if (data.status !== undefined) {
            if (!isAdmin) {
                throw new Error('Only admin can change post status');
            }

            this.#validateStatus(data.status);

            if (data.status !== post.status) {
                post.status = data.status;
            }
        }

        await this.postRepository.save(post);

        if (data.categories !== undefined) {
            this.#validateCategories(data.categories);
            await this.#validateCategoriesExist(data.categories);

            await this.#replaceCategories(postId, data.categories);
        }

        return this.postRepository.getById(postId);
    }

    /**
     * Updates the locked status of a post (Admin only).
     * @param {number|string} postId - ID of the target post.
     * @param {boolean} locked - New lock state.
     * @param {string} userRole - Role of requesting user.
     * @returns {Promise<Object>} Updated post entity.
     * @throws {Error} If requester is not admin or lock value is non-boolean.
     */
    async updatePostLock(postId, locked, userRole) {
        this.#validateId(postId);

        if (userRole !== 'admin') {
            throw new Error('Only admin can change locked of post');
        }

        if (typeof locked !== 'boolean') {
            throw new Error('Locked must be a boolean value');
        }

        const post = await this.postRepository.getById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        const updated = await this.postRepository.updatePostLock(postId, locked);
        if (!updated) {
            throw new Error('Failed to update locked');
        }

        return this.postRepository.getById(postId);
    }

    /**
     * Directly updates a post's status.
     * @param {number|string} postId - Target post ID.
     * @param {string} status - New status ('active' | 'inactive').
     * @returns {Promise<Object>} Updated post entity.
     * @throws {Error} If post isn't found or DB operation fails.
     */
    async updatePostStatus(postId, status) {
        this.#validateId(postId);
        this.#validateStatus(status);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        const updated = await this.postRepository.updatePostData(postId, 'status', status);
        
        if (!updated) {
            throw new Error('Failed to update post status');
        }

        return this.postRepository.getById(postId);
    }

    /**
     * Deletes a post and its associated images.
     * @param {number|string} postId - ID of post to delete.
     * @param {number|string} userId - Requesting user ID.
     * @param {string} userRole - Requesting user role.
     * @returns {Promise<boolean>} True on success.
     * @throws {Error} If user lacks permission or deletion fails.
     */
    async deletePost(
        postId,
        userId,
        userRole
    ) {
        this.#validateId(postId);
        this.#validateId(userId);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        const isOwner = Number(userId) === Number(post.authorId);
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new Error('Forbidden');
        }

        await this.postImageRepository.deleteByPostId(postId);
        const deleted = await this.postRepository.deletePost(postId);

        if (!deleted) {
            throw new Error('Failed to delete post');
        }

        return true;
    }

    /**
     * Checks if a specified user has rights to modify a post.
     * @param {Object} post - Post entity.
     * @param {number|string} userId - User ID to check.
     * @param {string} userRole - User role to check.
     * @returns {boolean} True if user is post author or an admin.
     */
    canModifyPost(post, userId, userRole) {
        if (!post) {
            return false;
        }

        if (userRole === 'admin') {
            return true;
        }

        return Number(userId) === Number(post.authorId);
    }

    /**
     * Validates integer database ID format.
     * @private
     * @param {any} id - Value to validate.
     * @throws {Error} If ID is missing, not an integer, or <= 0.
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
     * Validates post title length.
     * @private
     * @param {string} title - Title string to check.
     * @throws {Error} If title length is outside 3..255 range.
     */
    #validateTitle(title) {
        if (typeof title !== 'string' 
            || title.trim().length < 3 
            || title.trim().length > 255
        ) { 
            throw new Error('Title must contain from 3 to 255 characters'); 
        }
    }

    /**
     * Validates non-empty post content.
     * @private
     * @param {string} content - Content string to check.
     * @throws {Error} If content is empty or invalid.
     */
    #validateContent(content) {
        if (typeof content !== 'string'
            || content.trim().length < 1
        ) {
            throw new Error('Post content cannot be empty');
        }
    }

    /**
     * Validates category array and inner IDs.
     * @private
     * @param {Array} categories - Array of category IDs.
     * @throws {Error} If parameter isn't an array or contains invalid IDs.
     */
    #validateCategories(categories) {
        if (!Array.isArray(categories)) { 
            throw new Error('Categories must be an array'); 
        } 
        
        for (const categoryId of categories) { 
            this.#validateId(categoryId);
        }
    }

    /**
     * Validates status string.
     * @private
     * @param {string} status - Status value.
     * @throws {Error} If status is not 'active' or 'inactive'.
     */
    #validateStatus(status) {
        if (!['active', 'inactive'].includes(status)) { 
            throw new Error('Post status must be active or inactive'); 
        } 
    }

    /**
     * Validates pagination parameters.
     * @private
     * @param {number|string} page - Page number.
     * @param {number|string} limit - Items per page.
     * @throws {Error} If values are non-integers or <= 0.
     */
    #validatePagination(page, limit) {
        if (!Number.isInteger(Number(page)) || Number(page) < 1) {
            throw new Error('Page must be a positive integer');
        }

        if (!Number.isInteger(Number(limit)) || Number(limit) < 1) {
            throw new Error('Limit must be a positive integer');
        }
    }

    /**
     * Verifies that provided category IDs exist in storage.
     * @private
     * @param {number[]} categoryIds - Category IDs array.
     * @returns {Promise<void>}
     * @throws {Error} If any category does not exist.
     */
    async #validateCategoriesExist(categoryIds) {
        for (const categoryId of categoryIds) {
            const category = await this.categoryRepository.getById(categoryId);

            if (!category) {
                throw new Error(`Category ${categoryId} not found`);
            }
        }
    }

    /**
     * Replaces existing post categories with new ones.
     * @private
     * @param {number|string} postId - Post ID.
     * @param {number[]} categories - New category IDs.
     * @returns {Promise<void>}
     */
    async #replaceCategories(postId, categories) {
        if (!categories || categories.length === 0) {
            return;
        }

        await this.postRepository.removeCategories(postId);
        await this.postRepository.addCategories(postId, categories);
    }
}

module.exports = PostService;