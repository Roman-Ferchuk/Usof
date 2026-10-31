const { postProjection, mapPostRow } = require('./sql/projections');

class FavoriteRepository {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Adds a post to a user's favorites.
     * @param {number|string} userId - ID of the user.
     * @param {number|string} postId - ID of the post.
     * @returns {Promise<boolean>} True if added to favorites, false if already present.
     */
    async add(userId, postId) {
        try {
            const [result] = await this.pool.query(
                `INSERT IGNORE INTO usof_database.favorites (user_id, post_id)
                 VALUES (?, ?)`,
                [userId, postId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[FavoriteRepository.add] Error adding favorite: ', error.message);
            throw error;
        }
    }

    /**
     * Removes a post from a user's favorites.
     * @param {number|string} userId - ID of the user.
     * @param {number|string} postId - ID of the post.
     * @returns {Promise<boolean>} True if removed, false if it was not in favorites.
     */
    async remove(userId, postId) {
        try {
            const [result] = await this.pool.query(
                `DELETE FROM usof_database.favorites
                 WHERE user_id = ? AND post_id = ?`,
                [userId, postId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[FavoriteRepository.remove] Error removing favorite: ', error.message);
            throw error;
        }
    }

    /**
     * Checks if a post is in a user's favorites.
     * @param {number|string} userId - ID of the user.
     * @param {number|string} postId - ID of the post.
     * @returns {Promise<boolean>} True if the post is favorited, false otherwise.
     */
    async isFavorite(userId, postId) {
        try {
            const [rows] = await this.pool.query(
                `SELECT 1 FROM usof_database.favorites
                 WHERE user_id = ? AND post_id = ?`,
                [userId, postId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('[FavoriteRepository.isFavorite] Error checking favorite: ', error.message);
            throw error;
        }
    }

    async getByUserIdWithFilters(
        userId,
        {
            limit = 10,
            offset = 0,
            sort = 'added',
            categoryIds = null,
            dateFrom = null,
            dateTo = null
        } = {}
    ) {
        try {
            const projection = postProjection(Number(userId));
            const where = [
                'f.user_id = ?',
                `(p.status = 'active' OR p.author_id = ?)`
            ];
            const params = [userId, userId];

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

            const orderByMap = {
                likes: 'ORDER BY rating DESC, p.publish_date DESC',
                date: 'ORDER BY p.publish_date DESC',
                added: 'ORDER BY f.created_at DESC'
            };

            const sql = `
                SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.locked, p.content,
                       ${projection.select}
                FROM usof_database.favorites f
                    INNER JOIN usof_database.posts p ON p.id = f.post_id
                    INNER JOIN usof_database.users u ON u.id = p.author_id
                WHERE ${where.join(' AND ')}
                ${orderByMap[sort] || orderByMap.added}
                LIMIT ? OFFSET ?
            `;

            const [rows] = await this.pool.query(
                sql,
                [...projection.params, ...params, Number(limit), Number(offset)]
            );

            return rows.map(mapPostRow);
        } catch (error) {
            console.error('[FavoriteRepository.getByUserIdWithFilters] Error getting favorites: ', error.message);
            throw error;
        }
    }

    /**
     * Converts a date filter to a SQL value; a bare YYYY-MM-DD covers the whole day.
     * @private
     * @param {string} value - Date string.
     * @param {boolean} endOfDay - True for an upper bound.
     * @returns {string|Date}
     */
    #toSqlDate(value, endOfDay) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return `${value} ${endOfDay ? '23:59:59' : '00:00:00'}`;
        }
        return new Date(value);
    }

    /**
     * Retrieves favorite posts for a user with basic pagination.
     * @param {number|string} userId - ID of the user.
     * @param {number} [limit=10] - Number of records to fetch.
     * @param {number} [offset=0] - Number of records to skip.
     * @returns {Promise<Array<Post>>} Array of Post entities.
     */
    async getByUserId(userId, limit = 10, offset = 0) {
        try {
            const [rows] = await this.pool.query(
                `SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.locked, p.content
                 FROM usof_database.favorites f
                     INNER JOIN usof_database.posts p ON p.id = f.post_id
                 WHERE f.user_id = ? AND (p.status = 'active' OR p.author_id = ?)
                 ORDER BY f.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, userId, Number(limit), Number(offset)]
            );

            return rows.map(mapPostRow);
        } catch (error) {
            console.error('[FavoriteRepository.getByUserId] Error getting favorites: ', error.message);
            throw error;
        }
    }
}

module.exports = FavoriteRepository;