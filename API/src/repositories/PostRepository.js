const { Post } = require('../entities/Post');
const Category = require('../entities/Category');
const { postProjection, mapPostRow } = require('./sql/projections');

class PostRepository {
    constructor(pool) {
        this.pool = pool;
    }

    #mapToEntity(row) {
        return mapPostRow(row);
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
                `SELECT id, author_id, title, publish_date, status, locked, content
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
                `SELECT id, author_id, title, publish_date, status, locked, content
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

    /**
     * Converts a date filter to a value MySQL understands. A bare `YYYY-MM-DD`
     * covers the whole day, so `dateTo=2026-09-10` includes posts of September 10.
     * @private
     * @param {string|Date} value - Date value from the query string.
     * @param {boolean} endOfDay - True for an upper bound.
     * @returns {string|Date} SQL-ready value.
     */
    #toSqlDate(value, endOfDay) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return `${value} ${endOfDay ? '23:59:59' : '00:00:00'}`;
        }
        return new Date(value);
    }

    /**
     * Builds the WHERE part shared by the list query and the counting query.
     * @private
     * @returns {{ whereSql: string, params: Array }}
     */
    #buildFilters({
        categoryIds = null,
        dateFrom = null,
        dateTo = null,
        status = null,
        search = null,
        authorId = null,
        userId = null,
        role = null
    }) {
        const where = [];
        const params = [];

        if (role === 'admin') {
            if (status) {
                where.push('p.status = ?');
                params.push(status);
            }
        } else if (status === 'inactive') {
            // A regular user can only ever see their own inactive posts.
            where.push(userId ? "p.status = 'inactive' AND p.author_id = ?" : '1 = 0');
            if (userId) params.push(userId);
        } else if (status === 'active') {
            where.push("p.status = 'active'");
        } else if (userId) {
            where.push("(p.status = 'active' OR p.author_id = ?)");
            params.push(userId);
        } else {
            where.push("p.status = 'active'");
        }

        if (authorId) {
            where.push('p.author_id = ?');
            params.push(Number(authorId));
        }

        if (dateFrom) {
            where.push('p.publish_date >= ?');
            params.push(this.#toSqlDate(dateFrom, false));
        }
        if (dateTo) {
            where.push('p.publish_date <= ?');
            params.push(this.#toSqlDate(dateTo, true));
        }

        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            const placeholders = categoryIds.map(() => '?').join(',');
            where.push(
                `EXISTS (SELECT 1 FROM usof_database.post_categories pc
                         WHERE pc.post_id = p.id AND pc.category_id IN (${placeholders}))`
            );
            params.push(...categoryIds);
        }

        if (search && String(search).trim()) {
            const like = `%${String(search).trim().replace(/[\\%_]/g, '\\$&')}%`;
            where.push('(p.title LIKE ? OR p.content LIKE ?)');
            params.push(like, like);
        }

        return {
            whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
            params
        };
    }

    /**
     * Gets one page of posts with author, rating and counters.
     * Visibility: admins see everything, other people see active posts plus their own.
     * @param {Object} options - Filters, sorting and pagination.
     * @param {string} [options.sort='likes'] - 'likes' or 'date'.
     * @param {string} [options.order='desc'] - 'asc' or 'desc'.
     * @param {string} [options.search] - Substring of title or content.
     * @param {number} [options.authorId] - Only posts of this author.
     * @returns {Promise<Post[]>}
     */
    async getAllWithFilters({
        limit = 10,
        offset = 0,
        sort = 'likes',
        order = 'desc',
        ...filters
    }) {
        try {
            const { whereSql, params } = this.#buildFilters(filters);
            const projection = postProjection(filters.userId ? Number(filters.userId) : null);
            const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

            const orderBy = sort === 'likes'
                ? `ORDER BY rating ${dir}, p.publish_date DESC, p.id DESC`
                : `ORDER BY p.publish_date ${dir}, p.id ${dir}`;

            const sql = `
                SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.locked, p.content,
                       ${projection.select}
                FROM usof_database.posts p
                JOIN usof_database.users u ON u.id = p.author_id
                ${whereSql}
                ${orderBy}
                LIMIT ? OFFSET ?
            `;

            const [rows] = await this.pool.query(
                sql,
                [...projection.params, ...params, Number(limit), Number(offset)]
            );
            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[PostRepository.getAllWithFilters] Error fetching posts: ', error.message);
            throw error;
        }
    }

    /**
     * Counts posts that match the same filters as getAllWithFilters (for pagination).
     * @param {Object} filters - Same filters as getAllWithFilters.
     * @returns {Promise<number>}
     */
    async countWithFilters(filters) {
        try {
            const { whereSql, params } = this.#buildFilters(filters);
            const [[row]] = await this.pool.query(
                `SELECT COUNT(*) AS total FROM usof_database.posts p ${whereSql}`,
                params
            );
            return Number(row.total);
        } catch (error) {
            console.error('[PostRepository.countWithFilters] Error counting posts: ', error.message);
            throw error;
        }
    }

    async getById(id, viewerId = null) {
        try {
            const projection = postProjection(viewerId ? Number(viewerId) : null);
            const [rows] = await this.pool.query(
                `SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.locked, p.content,
                        ${projection.select}
                 FROM usof_database.posts p
                 JOIN usof_database.users u ON u.id = p.author_id
                 WHERE p.id = ?`,
                [...projection.params, id]
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
    //             `SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.locked, p.content
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

    async updatePostLock(postId, locked){
        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.posts
                 SET locked = ?
                 WHERE id = ?`,
                [locked, postId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[PostRepository.updatePostLock] Error updating post locked: ', error.message);
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
            FROM usof_database.categories c
            INNER JOIN usof_database.post_categories pc
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
     * Removes category associations from a post.
     * @param {number} postId 
     * @param {number[]} [categoryIds] - If omitted, removes all categories associated with the post.
     * @returns {Promise<boolean>}
     */
    async removeCategories(postId, categoryIds = []) {
        try {
            if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                const placeholders = categoryIds.map(() => '?').join(',');
                const [result] = await this.pool.query(
                    `DELETE FROM usof_database.post_categories 
                     WHERE post_id = ? AND category_id IN (${placeholders})`,
                    [postId, ...categoryIds]
                );
                return result.affectedRows > 0;
            } else {
                const [result] = await this.pool.query(
                    `DELETE FROM usof_database.post_categories WHERE post_id = ?`,
                    [postId]
                );
                return result.affectedRows > 0;
            }
        } catch (error) {
            console.error('[PostRepository.removeCategories] Error removing categories: ', error.message);
            throw error;
        }
    }

    /**
     * Gets all active posts associated with a specific category ID.
     * @param {number} categoryId 
     * @returns {Promise<Post[]>}
     */
    async getAllPostsByCategory(categoryId) {
        try {
            const [rows] = await this.pool.query(
                `SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.locked, p.content
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