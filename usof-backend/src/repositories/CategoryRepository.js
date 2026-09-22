const { Category } = require('../entities/Category');

class CategoryRepository {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Maps database row object to Category entity instance.
     * @private
     */
    #mapToEntity(row) {
        if (!row) return null;
        return new Category({
            id: row.id,
            title: row.title,
            description: row.description
        });
    }

    /**
     * Creates a new category.
     * @param {Object} categoryData
     * @returns {Promise<number>} ID of newly created category.
     */
    async create({ title, description = null }) {
        if (!title) {
            throw new Error('[CategoryRepository.create] Title cannot be null or empty');
        }

        try {
            const [result] = await this.pool.query(
                `INSERT INTO usof_database.categories (title, description)
                 VALUES (?, ?)`,
                [title, description]
            );

            return result.insertId;
        } catch (error) {
            console.error('[CategoryRepository.create] Error creating category: ', error.message);
            throw error;
        }
    }

    /**
     * Gets all categories from database.
     * @returns {Promise<Category[]>}
     */
    async getAll() {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, title, description 
                 FROM usof_database.categories`
            );

            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[CategoryRepository.getAll] Error fetching categories: ', error.message);
            throw error;
        }
    }

    /**
     * Gets category by ID.
     * @param {number} id - Category ID.
     * @returns {Promise<Category|null>}
     */
    async getById(id) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, title, description 
                 FROM usof_database.categories 
                 WHERE id = ?`,
                [id]
            );

            return this.#mapToEntity(rows[0]);
        } catch (error) {
            console.error('[CategoryRepository.getById] Error fetching category by id: ', error.message);
            throw error;
        }
    }

    /**
     * Finds a category by its title.
     * @param {string} title 
     * @returns {Promise<Category|null>}
     */
    async findByTitle(title) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, title, description 
                 FROM usof_database.categories 
                 WHERE title = ?`,
                [title]
            );

            return this.#mapToEntity(rows[0]);
        } catch (error) {
            console.error('[CategoryRepository.findByTitle] Error fetching category by title: ', error.message);
            throw error;
        }
    }

    /**
     * Updates specific category field.
     * @param {number} id 
     * @param {string} column 
     * @param {any} value 
     * @returns {Promise<boolean>}
     */
    async updateCategoryData(id, column, value) {
        const allowedColumns = ['title', 'description'];
        if (!allowedColumns.includes(column)) {
            throw new Error(`[CategoryRepository.updateCategoryData] Invalid update column: ${column}`);
        }

        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.categories
                 SET ${column} = ?
                 WHERE id = ?`,
                [value, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[CategoryRepository.updateCategoryData] Error updating category: ', error.message);
            throw error;
        }
    }

    /**
     * Updates full category entity state.
     * @param {Category} category 
     * @returns {Promise<boolean>}
     */
    async save(category) {
        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.categories 
                 SET title = ?, description = ?
                 WHERE id = ?`,
                [category.title, category.description, category.id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[CategoryRepository.save] Error updating category: ', error.message);
            throw error;
        }
    }

    /**
     * Deletes category record by ID.
     * @param {number} id - Category ID.
     * @returns {Promise<boolean>}
     */
    async deleteCategory(id) {
        try {
            const [result] = await this.pool.query(
                `DELETE FROM usof_database.categories WHERE id = ?`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[CategoryRepository.deleteCategory] Error deleting category: ', error.message);
            throw error;
        }
    }
}

module.exports = CategoryRepository;