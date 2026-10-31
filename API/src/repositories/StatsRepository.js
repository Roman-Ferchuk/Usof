const { userRatingSql } = require('./sql/projections');

const DB = 'usof_database';
const DAYS = 30;

/**
 * Aggregated, public-safe numbers for the statistics page and the view counters.
 * Only active posts and comments are counted, so nothing hidden leaks out.
 */
class StatsRepository {
    /** @param {Object} pool - mysql2 promise pool. */
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Counts one view of an active post.
     * @param {number} postId
     * @returns {Promise<boolean>} False when the post does not exist or is hidden.
     */
    async recordView(postId) {
        const [[post]] = await this.pool.query(
            `SELECT id FROM ${DB}.posts WHERE id = ? AND status = 'active'`,
            [postId]
        );
        if (!post) return false;

        await this.pool.query(
            `INSERT INTO ${DB}.post_views (post_id, views) VALUES (?, 1)
             ON DUPLICATE KEY UPDATE views = views + 1`,
            [postId]
        );
        await this.pool.query(
            `INSERT INTO ${DB}.daily_views (day, views) VALUES (CURDATE(), 1)
             ON DUPLICATE KEY UPDATE views = views + 1`
        );
        return true;
    }

    /** @returns {Promise<Object>} Everything the statistics page needs in one object. */
    async getOverview() {
        const [[totals]] = await this.pool.query(`
            SELECT
              (SELECT COUNT(*) FROM ${DB}.users WHERE email_confirmed = TRUE)           AS users,
              (SELECT COUNT(*) FROM ${DB}.posts WHERE status = 'active')                AS posts,
              (SELECT COUNT(*) FROM ${DB}.comments WHERE status = 'active')             AS comments,
              (SELECT COUNT(*) FROM ${DB}.categories)                                   AS categories,
              (SELECT COUNT(*) FROM ${DB}.likes WHERE type = 'like')                    AS likes,
              (SELECT COUNT(*) FROM ${DB}.likes WHERE type = 'dislike')                 AS dislikes,
              (SELECT COALESCE(SUM(views), 0) FROM ${DB}.post_views)                    AS views
        `);

        const [postDays] = await this.pool.query(`
            SELECT DATE_FORMAT(publish_date, '%Y-%m-%d') AS day, COUNT(*) AS total
            FROM ${DB}.posts
            WHERE status = 'active' AND publish_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY day`, [DAYS - 1]);

        const [commentDays] = await this.pool.query(`
            SELECT DATE_FORMAT(publish_date, '%Y-%m-%d') AS day, COUNT(*) AS total
            FROM ${DB}.comments
            WHERE status = 'active' AND publish_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY day`, [DAYS - 1]);

        const [viewDays] = await this.pool.query(`
            SELECT DATE_FORMAT(day, '%Y-%m-%d') AS day, views AS total
            FROM ${DB}.daily_views
            WHERE day >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`, [DAYS - 1]);

        const [categories] = await this.pool.query(`
            SELECT c.id, c.title, COUNT(p.id) AS posts
            FROM ${DB}.categories c
            LEFT JOIN ${DB}.post_categories pc ON pc.category_id = c.id
            LEFT JOIN ${DB}.posts p ON p.id = pc.post_id AND p.status = 'active'
            GROUP BY c.id, c.title
            ORDER BY posts DESC, c.title ASC
            LIMIT 8`);

        const [topAuthors] = await this.pool.query(`
            SELECT u.id, u.login, u.profile_picture AS profilePicture,
                   ${userRatingSql('u.id')} AS rating,
                   (SELECT COUNT(*) FROM ${DB}.posts p
                     WHERE p.author_id = u.id AND p.status = 'active') AS posts
            FROM ${DB}.users u
            WHERE u.email_confirmed = TRUE
            ORDER BY rating DESC, u.id ASC
            LIMIT 5`);

        const [topPosts] = await this.pool.query(`
            SELECT p.id, p.title, COALESCE(v.views, 0) AS views,
                   (SELECT COALESCE(SUM(CASE l.type WHEN 'like' THEN 1 ELSE -1 END), 0)
                      FROM ${DB}.likes l WHERE l.post_id = p.id) AS rating
            FROM ${DB}.posts p
            LEFT JOIN ${DB}.post_views v ON v.post_id = p.id
            WHERE p.status = 'active'
            ORDER BY views DESC, p.id DESC
            LIMIT 5`);

        const byDay = (rows) => new Map(rows.map((r) => [r.day, Number(r.total)]));
        const posts = byDay(postDays);
        const comments = byDay(commentDays);
        const views = byDay(viewDays);

        const activity = [];
        const now = new Date();
        for (let i = DAYS - 1; i >= 0; i -= 1) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const day = [
                d.getFullYear(),
                String(d.getMonth() + 1).padStart(2, '0'),
                String(d.getDate()).padStart(2, '0')
            ].join('-');
            activity.push({
                day,
                posts: posts.get(day) || 0,
                comments: comments.get(day) || 0,
                views: views.get(day) || 0
            });
        }

        return {
            totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Number(v)])),
            activity,
            categories: categories.map((c) => ({ ...c, posts: Number(c.posts) })),
            topAuthors: topAuthors.map((a) => ({ ...a, rating: Number(a.rating), posts: Number(a.posts) })),
            topPosts: topPosts.map((p) => ({ ...p, views: Number(p.views), rating: Number(p.rating) }))
        };
    }
}

module.exports = StatsRepository;
