const { Post } = require('../entities/Post');
const { Category }= require('../entities/Category')

class PostRepository {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Maps database row object to Post entity instance.
     * @private
     */
    #mapToEntity(row) {
        if (!row) return null;
        return new Post({
            id: row.id,
            authorId: row.author_id,
            title: row.title,
            publishDate: row.publish_date,
            status: row.status,
            content: row.content,
        });
    }

    /**
     * Creates a new post record.
     * @param {Object} postData
     * @returns {Promise<number>} ID of newly created post.
     */
    async create({ authorId, title, publishDate = new Date(), status = 'active', content }) {
        try {
            const [result] = await this.pool.query(
                `INSERT INTO usof_database.posts (author_id, title, publish_date, status, content)
                 VALUES (?, ?, ?, ?, ?)`,
                [authorId, title, publishDate, status, content]
            );

            return result.insertId;
        } catch (error) {
            console.error('[PostRepository.create] Error creating post: ', error.message);
            throw error;
        }
    }

    /**
     * Gets all active posts with pagination.
     * @param {number} limit - Maximum number of posts per page.
     * @param {number} offset - Number of posts to skip.
     * @returns {Promise<Post[]>} Array of Post entities.
     */
    async getAll(limit = 10, offset = 0) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, author_id, title, publish_date, status, content
                 FROM usof_database.posts
                 WHERE status = 'active'
                 ORDER BY publish_date DESC
                 LIMIT ? OFFSET ?`,
                [Number(limit), Number(offset)]
            );

            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[PostRepository.getAll] Error fetching posts: ', error.message);
            throw error;
        }
    }

    async getAllForAdmin(limit = 10, offset = 0) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, author_id, title, publish_date, status, content
                 FROM usof_database.posts
                 ORDER BY publish_date DESC
                 LIMIT ? OFFSET ?`,
                [Number(limit), Number(offset)]
            );

            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[PostRepository.getAllForAdmin] Error fetching posts: ', error.message);
            throw error;
        }
    }

    async getAllWithFilters({
        limit,
        offset,
        sort,
        categoryId,
        dateFrom,
        dateTo,
        status,
        includeInactive
    }) {
        // TODO
    }

    /**
     * Gets post by ID.
     * @param {number} id - Post ID.
     * @returns {Promise<Post|null>}
     */
    async getById(id) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, author_id, title, publish_date, status, content
                 FROM usof_database.posts
                 WHERE id = ?`,
                [id]
            );

            return this.#mapToEntity(rows[0]);
        } catch (error) {
            console.error('[PostRepository.getById] Error fetching post by id: ', error.message);
            throw error;
        }
    }

    // /**
    //  * Gets all posts associated with a specific category ID.
    //  * @param {number} categoryId 
    //  * @returns {Promise<Post[]>}
    //  */
    // async getByCategoryId(categoryId) {
    //     try {
    //         const [rows] = await this.pool.query(
    //             `SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.content
    //              FROM usof_database.posts p
    //              JOIN usof_database.post_categories pc ON p.id = pc.post_id
    //              WHERE pc.category_id = ? AND p.status = 'active'`,
    //             [categoryId]
    //         );

    //         return rows.map(row => this.#mapToEntity(row));
    //     } catch (error) {
    //         console.error('[PostRepository.getByCategoryId] Error fetching posts by category: ', error.message);
    //         throw error;
    //     }
    // }

    /**
     * Updates specific post data field.
     * @param {number} id - Post ID.
     * @param {string} column - Field to update.
     * @param {any} value - New value.
     * @returns {Promise<boolean>}
     */
    async updatePostData(id, column, value) {
        const allowedColumns = ['title', 'content', 'status'];
        if (!allowedColumns.includes(column)) {
            throw new Error(`[PostRepository.updatePostData] Invalid update column: ${column}`);
        }

        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.posts
                 SET ${column} = ?
                 WHERE id = ?`,
                [value, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[PostRepository.updatePostData] Error updating post: ', error.message);
            throw error;
        }
    }

    /**
     * Updates full post entity state in database.
     * @param {Post} post 
     * @returns {Promise<boolean>}
     */
    async save(post) {
        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.posts 
                 SET author_id = ?, title = ?, publish_date = ?, status = ?, content = ?
                 WHERE id = ?`,
                [post.authorId, post.title, post.publishDate, post.status, post.content, post.id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[PostRepository.save] Error updating post: ', error.message);
            throw error;
        }
    }

    /**
     * Deletes post record by ID.
     * @param {number} id - Post ID.
     * @returns {Promise<boolean>}
     */
    async deletePost(id) {
        try {
            const [result] = await this.pool.query(
                `DELETE FROM usof_database.posts WHERE id = ?`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[PostRepository.deletePost] Error deleting post: ', error.message);
            throw error;
        }
    }

    /**
     * Attaches categories to a post.
     * @param {number} postId 
     * @param {number[]} categoryIds 
     */
    async addCategories(postId, categoryIds) {
        if (!categoryIds || categoryIds.length === 0) return;

        try {
            const values = categoryIds.map(catId => [postId, catId]);
            await this.pool.query(
                `INSERT IGNORE INTO usof_database.post_categories (post_id, category_id) VALUES ?`,
                [values]
            );
        } catch (error) {
            console.error('[PostRepository.addCategories] Error linking categories: ', error.message);
            throw error;
        }
    }

    async getCategories(postId) {
        const [rows] = await this.pool.query(
            `SELECT c.id, c.title, c.description
             FROM categories c
             INNER JOIN post_categories pc
                 ON pc.category_id = c.id
             WHERE pc.post_id = ?`, 
            [postId]
        );

        return rows.map(row => new Category({
            id: row.id,
            title: row.title,
            description: row.description
        }));
    }

    /**
     * Gets all active posts associated with a specific category ID.
     * @param {number} categoryId 
     * @returns {Promise<Post[]>}
     */
    async getAllPostsByCategory(categoryId) {
        try {
            const [rows] = await this.pool.query(
                `SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.content
                 FROM usof_database.posts p
                     INNER JOIN usof_database.post_categories pc ON p.id = pc.post_id
                 WHERE pc.category_id = ? AND p.status = 'active'`,
                [categoryId]
            );

            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[PostRepository.getAllPostsByCategory] Error getting posts by category: ', error.message);
            throw error;
        }
    }
}

module.exports = PostRepository;