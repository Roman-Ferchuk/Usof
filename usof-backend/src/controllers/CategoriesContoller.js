/**
 * Controller handling HTTP requests for categories and associated posts.
 */
class CategoryController {
    /**
     * Creates an instance of CategoryController.
     * @param {Object} services - Injection object containing service instances.
     * @param {Object} services.categoryService - Instance of CategoryService.
     * @param {Object} services.postService - Instance of PostService.
     */
    constructor(
        categoryService, 
        postService
    ) {
        this.categoryService = categoryService;
        this.postService = postService;
    }

    /**
     * Gets all categories.
     * @route GET /api/categories
     */
    async getAllCategories(req, res) {
        try {
            const categories = await this.categoryService.getAllCategories();

            res.status(200).json(categories);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Gets a single category by ID.
     * @route GET /api/categories/:category_id
     */
    async getCategoryById(req, res) {
        try {
            const { category_id } = req.params;

            const category = await this.categoryService.getCategoryById(category_id);

            return res.status(200).json(category);
        } catch (error) {
            const statusCode = error.message === 'Category not found' ? 404 : 403;
            return res.status(statusCode).json({ error: error.message });
        }
    }

    /**
     * Gets paginated posts belonging to a specific category.
     * @route GET /api/categories/:category_id/posts
     */
    async getPostsByCategory(req, res) {
        try {
            const { page = 1, limit = 10, sort = 'likes' } = req.query;
            const { category_id } = req.params;

            await this.categoryService.getCategoryById(category_id);
            
            const posts = await this.postService.getPosts({
                page,
                limit,
                sort,
                categoryIds: [Number(category_id)],
                userId: req.user ? req.user.id : null,
                role: req.user ? req.user.role : null
            });

            return res.status(200).json(posts);
        } catch (error) {
            if (error.message === 'Category not found' || error.message === 'Invalid ID') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Creates a new category.
     * @route POST /api/categories
     */
    async createCategory(req, res) {
        try {
            const { title, description } = req.body;

            const category = await this.categoryService.createCategory({ title, description });

            return res.status(201).json(category);
        } catch (error) {
            if (error.message.includes('already exists') || error.message.includes('required')) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Updates an existing category by ID.
     * @route PATCH /api/categories/:category_id
     */
    async updateCategory(req, res) {
        try {
            const { category_id } = req.params;

            const result = this.categoryService.updateCategory(
                category_id,
                {
                    title: req.body.title,
                    description: req.body.description
                }
            );

            return res.status(200).json(result);
        } catch (error) {
            if (error.message.includes('already exists') || error.message.includes('required')) {
                return res.status(400).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }

    /**
     * Deletes a category by ID.
     * @route DELETE /api/categories/:category_id
     */
    async deleteCategory(req, res) {
        try {
            const { category_id } = req.params;

            const result = this.categoryService.deleteCategory(category_id);

            return res.status(200).json(result);
        } catch (error) {
            let statusCode = 400;
            if (error.message.includes('not found')) {
                statusCode = 404;
            }

            return res.status(statusCode).json({ error: error.message });
        }
    }
}

module.exports = CategoryController;