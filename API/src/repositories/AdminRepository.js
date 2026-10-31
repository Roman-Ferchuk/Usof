/**
 * Read-optimised queries for the admin panel (joins, counters, search, pagination).
 * All writes still go through the regular repositories/services.
 */
const { userRatingSql } = require('./sql/projections');

class AdminRepository {
    /** @param {Object} pool - mysql2 promise pool. */
    constructor(pool) {
        this.pool = pool;
    }

    #parseJson(value) {
        if (typeof value === 'string') {
            try { return JSON.parse(value); } catch { return []; }
        }
        return value || [];
    }

    #like(q) {
        return `%${String(q).replace(/[\\%_]/g, '\\$&')}%`;
    }

    /** @returns {Promise<Object>} Aggregated counters and short "recent" lists. */
    async getStats() {
        const [[counts]] = await this.pool.query(`
            SELECT
              (SELECT COUNT(*) FROM usof_database.users)                                  AS users,
              (SELECT COUNT(*) FROM usof_database.users WHERE role = 'admin')             AS admins,
              (SELECT COUNT(*) FROM usof_database.users WHERE email_confirmed = FALSE)    AS unconfirmed,
              (SELECT COUNT(*) FROM usof_database.posts)                                  AS posts,
              (SELECT COUNT(*) FROM usof_database.posts WHERE status = 'inactive')        AS inactivePosts,
              (SELECT COUNT(*) FROM usof_database.posts WHERE locked = TRUE)              AS lockedPosts,
              (SELECT COUNT(*) FROM usof_database.comments)                               AS comments,
              (SELECT COUNT(*) FROM usof_database.comments WHERE status = 'inactive')     AS inactiveComments,
              (SELECT COUNT(*) FROM usof_database.categories)                             AS categories,
              (SELECT COUNT(*) FROM usof_database.likes)                                  AS likes
        `);

        const [latestPosts] = await this.pool.query(`
            SELECT p.id, p.title, p.status, p.publish_date AS publishDate, u.login AS authorLogin
            FROM usof_database.posts p
            JOIN usof_database.users u ON u.id = p.author_id
            ORDER BY p.publish_date DESC LIMIT 5
        `);

        const [topUsers] = await this.pool.query(`
            SELECT u.id, u.login, u.full_name AS fullName, ${userRatingSql('u.id')} AS rating
            FROM usof_database.users u
            ORDER BY rating DESC, u.id ASC LIMIT 5
        `);

        return { counts, latestPosts, topUsers };
    }

    /**
     * @param {{q?: string, role?: string, emailConfirmed?: boolean, limit: number, offset: number}} f
     * @returns {Promise<{total: number, rows: Object[]}>}
     */
    async listUsers({ q, role, emailConfirmed, limit, offset }) {
        const where = [];
        const params = [];

        if (q) {
            where.push('(u.login LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)');
            const like = this.#like(q);
            params.push(like, like, like);
        }
        if (role) { where.push('u.role = ?'); params.push(role); }
        if (emailConfirmed !== undefined) { where.push('u.email_confirmed = ?'); params.push(emailConfirmed); }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const [[{ total }]] = await this.pool.query(
            `SELECT COUNT(*) AS total FROM usof_database.users u ${whereSql}`, params
        );

        const [rows] = await this.pool.query(`
            SELECT u.id, u.login, u.full_name AS fullName, u.email,
                   u.email_confirmed AS emailConfirmed, u.profile_picture AS profilePicture,
                   ${userRatingSql('u.id')} AS rating, u.role,
                   (SELECT COUNT(*) FROM usof_database.posts p WHERE p.author_id = u.id)    AS postsCount,
                   (SELECT COUNT(*) FROM usof_database.comments c WHERE c.author_id = u.id) AS commentsCount
            FROM usof_database.users u
            ${whereSql}
            ORDER BY u.id ASC
            LIMIT ? OFFSET ?`, [...params, limit, offset]);

        return { total, rows: rows.map(r => ({ ...r, emailConfirmed: Boolean(r.emailConfirmed) })) };
    }

    /**
     * @param {{q?: string, status?: string, locked?: boolean, categoryId?: number, authorId?: number, limit: number, offset: number}} f
     * @returns {Promise<{total: number, rows: Object[]}>}
     */
    async listPosts({ q, status, locked, categoryId, authorId, limit, offset }) {
        const where = [];
        const params = [];

        if (q) {
            where.push('(p.title LIKE ? OR p.content LIKE ?)');
            const like = this.#like(q);
            params.push(like, like);
        }
        if (status) { where.push('p.status = ?'); params.push(status); }
        if (locked !== undefined) { where.push('p.locked = ?'); params.push(locked); }
        if (authorId) { where.push('p.author_id = ?'); params.push(authorId); }
        if (categoryId) {
            where.push('EXISTS (SELECT 1 FROM usof_database.post_categories pc WHERE pc.post_id = p.id AND pc.category_id = ?)');
            params.push(categoryId);
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const [[{ total }]] = await this.pool.query(
            `SELECT COUNT(*) AS total FROM usof_database.posts p ${whereSql}`, params
        );

        const [rows] = await this.pool.query(`
            SELECT p.id, p.title, p.content, p.status, p.locked, p.publish_date AS publishDate,
                   p.author_id AS authorId, u.login AS authorLogin,
                   (SELECT COALESCE(SUM(CASE l.type WHEN 'like' THEN 1 ELSE -1 END), 0)
                      FROM usof_database.likes l WHERE l.post_id = p.id)                  AS rating,
                   (SELECT COUNT(*) FROM usof_database.comments c WHERE c.post_id = p.id) AS commentsCount,
                   (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', c.id, 'title', c.title))
                      FROM usof_database.post_categories pc
                      JOIN usof_database.categories c ON c.id = pc.category_id
                     WHERE pc.post_id = p.id)                                             AS categories
            FROM usof_database.posts p
            JOIN usof_database.users u ON u.id = p.author_id
            ${whereSql}
            ORDER BY p.publish_date DESC, p.id DESC
            LIMIT ? OFFSET ?`, [...params, limit, offset]);

        return {
            total,
            rows: rows.map(r => ({
                ...r,
                locked: Boolean(r.locked),
                rating: Number(r.rating),
                categories: this.#parseJson(r.categories)
            }))
        };
    }

    /**
     * @param {{q?: string, status?: string, locked?: boolean, postId?: number, authorId?: number, limit: number, offset: number}} f
     * @returns {Promise<{total: number, rows: Object[]}>}
     */
    async listComments({ q, status, locked, postId, authorId, limit, offset }) {
        const where = [];
        const params = [];

        if (q) { where.push('c.content LIKE ?'); params.push(this.#like(q)); }
        if (status) { where.push('c.status = ?'); params.push(status); }
        if (locked !== undefined) { where.push('c.locked = ?'); params.push(locked); }
        if (postId) { where.push('c.post_id = ?'); params.push(postId); }
        if (authorId) { where.push('c.author_id = ?'); params.push(authorId); }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const [[{ total }]] = await this.pool.query(
            `SELECT COUNT(*) AS total FROM usof_database.comments c ${whereSql}`, params
        );

        const [rows] = await this.pool.query(`
            SELECT c.id, c.content, c.status, c.locked, c.publish_date AS publishDate,
                   c.post_id AS postId, p.title AS postTitle, c.parent_id AS parentId,
                   c.author_id AS authorId, u.login AS authorLogin,
                   (SELECT COALESCE(SUM(CASE l.type WHEN 'like' THEN 1 ELSE -1 END), 0)
                      FROM usof_database.likes l WHERE l.comment_id = c.id) AS rating
            FROM usof_database.comments c
            JOIN usof_database.users u ON u.id = c.author_id
            JOIN usof_database.posts p ON p.id = c.post_id
            ${whereSql}
            ORDER BY c.publish_date DESC, c.id DESC
            LIMIT ? OFFSET ?`, [...params, limit, offset]);

        return { total, rows: rows.map(r => ({ ...r, locked: Boolean(r.locked), rating: Number(r.rating) })) };
    }

    /**
     * @param {{type?: string, target?: string, postId?: number, commentId?: number, authorId?: number, limit: number, offset: number}} f
     * @returns {Promise<{total: number, rows: Object[]}>}
     */
    async listLikes({ type, target, postId, commentId, authorId, limit, offset }) {
        const where = [];
        const params = [];

        if (type) { where.push('l.type = ?'); params.push(type); }
        if (target === 'post') where.push('l.post_id IS NOT NULL');
        if (target === 'comment') where.push('l.comment_id IS NOT NULL');
        if (postId) { where.push('l.post_id = ?'); params.push(postId); }
        if (commentId) { where.push('l.comment_id = ?'); params.push(commentId); }
        if (authorId) { where.push('l.author_id = ?'); params.push(authorId); }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const [[{ total }]] = await this.pool.query(
            `SELECT COUNT(*) AS total FROM usof_database.likes l ${whereSql}`, params
        );

        const [rows] = await this.pool.query(`
            SELECT l.id, l.type, l.publish_date AS publishDate,
                   l.author_id AS authorId, u.login AS authorLogin,
                   l.post_id AS postId, l.comment_id AS commentId,
                   p.title AS postTitle, c.content AS commentContent
            FROM usof_database.likes l
            JOIN usof_database.users u ON u.id = l.author_id
            LEFT JOIN usof_database.posts p ON p.id = l.post_id
            LEFT JOIN usof_database.comments c ON c.id = l.comment_id
            ${whereSql}
            ORDER BY l.publish_date DESC, l.id DESC
            LIMIT ? OFFSET ?`, [...params, limit, offset]);

        return { total, rows };
    }

    /**
     * @param {number} id - Like ID.
     * @returns {Promise<boolean>} True when a row was removed.
     */
    async deleteLike(id) {
        const [result] = await this.pool.query(
            'DELETE FROM usof_database.likes WHERE id = ?', [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = AdminRepository;
