class PostService {
    constructor({ 
        postRepository, 
        categoryRepository, 
        postImageRepository 
    }) { 
        this.postRepository = postRepository; 
        this.categoryRepository = categoryRepository; 
        this.postImageRepository = postImageRepository; 
    }

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

        return this.getPostById(postId, {
            userId: authorId,
            role: 'user'
        });
    }

    /**
     * Fetches paginated posts based on filters, sorting, and user role/permissions.
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @param {string} [options.sort='likes'] - 'likes' | 'date'
     * @param {number[]} [options.categoryIds]
     * @param {Date|string} [options.dateFrom]
     * @param {Date|string} [options.dateTo]
     * @param {string} [options.status]
     * @param {number} [options.userId]
     * @param {string} [options.role]
     * @returns {Promise<Object>} Paginated post list with metadata.
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

    async getPostCategories(postId) {
        this.#validateId(postId);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        return this.postRepository.getCategories(postId);
    }

    async getPostImages(postId) {
        this.#validateId(postId);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        return this.postImageRepository.getImagesInPost(postId);
    }

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

            if (data.title !== post.title) {
                post.title = data.title;
            }
        }

        if (data.content !== undefined) {
            if (isAdmin && !isOwner) {
                throw new Error('Admin cannot edit post content');
            }

            this.#validateContent(data.content);

            if (data.content !== post.content) {
                post.content = data.content;
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

        this.postRepository.save(post);

        if (data.categories !== undefined) {
            this.#validateCategories(data.categories);
            await this.#validateCategoriesExist(data.categories);

            await this.#replaceCategories(postId, data.categories);
        }

        return this.postRepository.getById(postId);
    }

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

    async updatePostStatus(postId, status) {
        this.#validateId(postId);
        this.#validateStatus(status);

        const post = await this.postRepository.getById(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        const updated = 
            await this.postRepository.updatePostData(postId, 'status', status);
        
        if (!updated) {
            throw new Error('Failed to update post status');
        }

        return this.postRepository.getById(postId);
    }

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

    canModifyPost(post, userId, userRole) {
        if (!post) {
            return false;
        }

        if (userRole === 'admin') {
            return true;
        }

        return Number(userId) === Number(post.authorId);
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

    #validateTitle(title) {
        if (typeof title !== 'string' 
            || title.trim().length < 3 
            || title.trim().length > 255
        ) { 
            throw new Error('Title must contain from 3 to 255 characters'); 
        }
    }

    #validateContent(content) {
        if (typeof content !== 'string'
            || content.trim().length < 1
        ) {
            throw new Error('Post content cannot be empty');
        }
    }

    #validateCategories(categories) {
        if (!Array.isArray(categories)) { 
            throw new Error('Categories must be an array'); 
        }
        
        for (const categoryId of categories) { 
            this.#validateId(categoryId);
        }
    }

    #validateStatus(status) {
        if (!['active', 'inactive'].includes(status)) { 
            throw new Error('Post status must be active or inactive'); 
        } 
    }

    #validatePagination(page, limit) {
        if (!Number.isInteger(Number(page)) || Number(page) < 1) {
            throw new Error('Page must be a positive integer')
        }

        if (!Number.isInteger(Number(limit)) || Number(limit) < 1) {
            throw new Error('Limit must be a positive integer')
        }
    }

    async #validateCategoriesExist(categoryIds) {
        for (const categoryId of categoryIds) {
            const category = await this.categoryRepository.getById(categoryId);

            if (!category) {
                throw new Error(`Category ${categoryId} not found`);
            }
        }
    }

    async #replaceCategories(postId, categories) {
        if (!categories || categories.length === 0) {
            return;
        }

        await this.postRepository.removeCategories(postId);
        await this.postRepository.addCategories(postId, categories);
    }
}

module.exports = PostService;