class CategoryService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * Creates a new category ensuring the title is unique.
     * @param {Object} categoryData
     * @param {string} categoryData.title - Category title.
     * @param {string} [categoryData.description] - Category description.
     * @returns {Promise<Object>} Created category instance or ID.
     */
    async createCategory({ 
        title, 
        description 
    }) {
        if (!title || !title.trim()) {
            throw new Error('Category title is required');
        }

        const normalizedTitle = title.trim(); 
        const existingCategory = await this.categoryRepository.findByTitle(normalizedTitle);

        if (existingCategory) {
            throw new Error(`Category ${title} already exists`);
        }

        const categoryId = await this.categoryRepository.create({
            title: normalizedTitle,
            description: description ? description.trim() : null
        });

        return await this.categoryRepository.getById(categoryId);
    }

    /**
     * Retrieves all categories.
     * @returns {Promise<Category[]>} List of all categories.
     */
    async getAllCategories() {
        return await this.categoryRepository.getAll();
    }

    /**
     * Retrieves a single category by its ID.
     * @param {number|string} id - Category ID.
     * @returns {Promise<Category>} Category entity.
     */
    async getCategoryById(categoryId) {
        this.#validateId(categoryId);

        const category = await this.categoryRepository.getById(categoryId);
        if (!category) {
            throw new Error(`Category not found`);
        }
        return category;
    }

    /**
     * Updates category details.
     * @param {number|string} id - Category ID.
     * @param {Object} updateData - Data to update.
     * @param {string} [updateData.title] - New category title.
     * @param {string} [updateData.description] - New category description.
     * @returns {Promise<Category>} Updated category entity.
     */
    async updateCategory(categoryId, { title, description }) {
        this.#validateId(categoryId);

        const category = await this.categoryRepository.getById(categoryId);

        if (!category) {
            throw new Error('Category not found');
        }

        if (title !== undefined) {
            const normalizedTitle = title.trim();
            if (!normalizedTitle) {
                throw new Error('Category title cannot be empty');
            }

            if (normalizedTitle !== category.title) {
                const existingCategory = await this.categoryRepository.findByTitle(normalizedTitle);
                if (existingCategory) {
                    throw new Error(`Category with title "${normalizedTitle}" already exists`);
                }
                await this.categoryRepository.updateCategoryData(categoryId, 'title', normalizedTitle);
            }
        }

        if (description !== undefined) {
            await this.categoryRepository.updateCategoryData(categoryId, 'description', description ? String(description).trim() : null);
        }

        return await this.categoryRepository.getById(categoryId);
    }

    /**
     * Deletes a category by ID.
     * @param {number|string} id - Category ID.
     * @returns {Promise<boolean>} True if deleted successfully.
     */
    async deleteCategory(categoryId) {
        this.#validateId(categoryId);

        const category = await this.categoryRepository.getById(categoryId);
        if (!category) {
            throw new Error(`Category with ID ${categoryId} not found`);
        }

        return await this.categoryRepository.deleteCategory(categoryId);
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
}

module.exports = CategoryService;