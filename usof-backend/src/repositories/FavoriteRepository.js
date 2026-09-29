const { Post } = require('../entities/Post');

class FavoriteRepository {
    constructor(pool) {
        this.pool = pool;
    }

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
            sort = 'date',
            categoryIds = null,
            dateFrom = null,
            dateTo = null
        } = {}
    ) {
        try {
            const whereClauses = [
                'f.user_id = ?',
                `(p.status = 'active' OR p.author_id = ?)`
            ];
            const queryParams = [userId, userId];

            if (dateFrom) {
                whereClauses.push('p.publish_date >= ?');
                queryParams.push(new Date(dateFrom));
            }
            if (dateTo) {
                whereClauses.push('p.publish_date <= ?');
                queryParams.push(new Date(dateTo));
            }

            if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                const placeholders = categoryIds.map(() => '?').join(',');
                whereClauses.push(
                    `EXISTS (SELECT 1 FROM usof_database.post_categories pc
                            WHERE pc.post_id = p.id AND pc.category_id IN (${placeholders}))`
                );
                queryParams.push(...categoryIds);
            }

            let likesJoin = '';
            let selectRating = '';
            let orderBy = 'ORDER BY p.publish_date DESC';

            if (sort === 'likes') {
                likesJoin = 'LEFT JOIN usof_database.likes l ON l.post_id = p.id';
                selectRating = `, COALESCE(SUM(CASE WHEN l.type = 'like' THEN 1 WHEN l.type = 'dislike' THEN -1 ELSE 0 END), 0) AS rating`;
                orderBy = 'ORDER BY rating DESC, p.publish_date DESC';
            } else if (sort === 'added') {
                orderBy = 'ORDER BY f.created_at DESC';
            }

            const groupBy = sort === 'likes' ? 'GROUP BY p.id, f.created_at' : '';

            const sql = `
                SELECT p.id, p.author_id, p.title, p.publish_date, p.status, p.locked, p.content ${selectRating}
                FROM usof_database.favorites f
                    INNER JOIN usof_database.posts p ON p.id = f.post_id
                    ${likesJoin}
                WHERE ${whereClauses.join(' AND ')}
                ${groupBy}
                ${orderBy}
                LIMIT ? OFFSET ?
            `;

            queryParams.push(Number(limit), Number(offset));

            const [rows] = await this.pool.query(sql, queryParams);

            return rows.map(row => new Post({
                id: row.id,
                authorId: row.author_id,
                title: row.title,
                publishDate: row.publish_date,
                status: row.status,
                locked: Boolean(row.locked),
                content: row.content
            }));
        } catch (error) {
            console.error('[FavoriteRepository.getByUserIdWithFilters] Error getting favorites: ', error.message);
            throw error;
        }
    }

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

            return rows.map(row => new Post({
                id: row.id,
                authorId: row.author_id,
                title: row.title,
                publishDate: row.publish_date,
                status: row.status,
                locked: Boolean(row.locked),
                content: row.content
            }));
        } catch (error) {
            console.error('[FavoriteRepository.getByUserId] Error getting favorites: ', error.message);
            throw error;
        }
    }
}

module.exports = FavoriteRepository;