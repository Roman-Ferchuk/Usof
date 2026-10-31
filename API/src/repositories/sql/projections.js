/**
 * Reusable SQL fragments that enrich plain rows with data the client needs to
 * render a page without extra requests: author, rating, counters and the
 * reaction of the person who is looking.
 */
const { Post } = require('../../entities/Post');

const DB = 'usof_database';

/** SQL expression that sums likes (+1) and dislikes (-1) of rows aliased as `l`. */
const LIKE_SCORE = `CASE l.type WHEN 'like' THEN 1 WHEN 'dislike' THEN -1 ELSE 0 END`;

/**
 * Rating of a user = sum of reactions under all of the user's posts and comments.
 * It is computed on read, so it never gets out of sync with the likes table.
 * @param {string} userRef - SQL reference to the user id, e.g. `u.id`.
 * @returns {string} Scalar sub-query.
 */
const userRatingSql = (userRef) => `(
    SELECT CAST(COALESCE(SUM(${LIKE_SCORE}), 0) AS SIGNED)
    FROM ${DB}.likes l
    LEFT JOIN ${DB}.posts lp ON lp.id = l.post_id
    LEFT JOIN ${DB}.comments lc ON lc.id = l.comment_id
    WHERE lp.author_id = ${userRef} OR lc.author_id = ${userRef}
)`;

/**
 * Columns appended to a `posts p JOIN users u` SELECT.
 * @param {number|null} viewerId - Id of the person who requests the data (or null).
 * @returns {{ select: string, params: Array }} SELECT fragment and its parameters.
 */
const postProjection = (viewerId = null) => ({
    select: `
        u.login AS author_login,
        u.full_name AS author_full_name,
        u.profile_picture AS author_picture,
        (SELECT COALESCE(SUM(${LIKE_SCORE}), 0)
           FROM ${DB}.likes l WHERE l.post_id = p.id) AS rating,
        (SELECT COUNT(*) FROM ${DB}.likes l
          WHERE l.post_id = p.id AND l.type = 'like') AS likes_count,
        (SELECT COUNT(*) FROM ${DB}.likes l
          WHERE l.post_id = p.id AND l.type = 'dislike') AS dislikes_count,
        (SELECT COUNT(*) FROM ${DB}.comments c
          WHERE c.post_id = p.id AND c.status = 'active') AS comments_count,
        (SELECT l.type FROM ${DB}.likes l
          WHERE l.post_id = p.id AND l.author_id = ? LIMIT 1) AS my_reaction,
        COALESCE((SELECT v.views FROM ${DB}.post_views v
                   WHERE v.post_id = p.id), 0) AS views_count,
        EXISTS (SELECT 1 FROM ${DB}.favorites f
                 WHERE f.post_id = p.id AND f.user_id = ?) AS is_favorite`,
    params: [viewerId, viewerId]
});

/**
 * Columns appended to a `comments c JOIN users u` SELECT.
 * @param {number|null} viewerId - Id of the person who requests the data (or null).
 * @returns {{ select: string, params: Array }} SELECT fragment and its parameters.
 */
const commentProjection = (viewerId = null) => ({
    select: `
        u.login AS author_login,
        u.full_name AS author_full_name,
        u.profile_picture AS author_picture,
        (SELECT COALESCE(SUM(${LIKE_SCORE}), 0)
           FROM ${DB}.likes l WHERE l.comment_id = c.id) AS rating,
        (SELECT COUNT(*) FROM ${DB}.likes l
          WHERE l.comment_id = c.id AND l.type = 'like') AS likes_count,
        (SELECT COUNT(*) FROM ${DB}.likes l
          WHERE l.comment_id = c.id AND l.type = 'dislike') AS dislikes_count,
        (SELECT l.type FROM ${DB}.likes l
          WHERE l.comment_id = c.id AND l.author_id = ? LIMIT 1) AS my_reaction`,
    params: [viewerId]
});

/**
 * Builds the public `author` object from a projected row.
 * @param {Object} row - Row that contains the author_* columns.
 * @param {number} authorId - Author id.
 * @returns {{id:number, login:string, fullName:string, profilePicture:string}}
 */
const mapAuthor = (row, authorId) => ({
    id: authorId,
    login: row.author_login,
    fullName: row.author_full_name,
    profilePicture: row.author_picture
});

/**
 * Maps a posts row (optionally with projection columns) to a Post entity.
 * @param {Object|null} row - Database row.
 * @returns {Post|null}
 */
const mapPostRow = (row) => {
    if (!row) return null;
    const hasStats = row.author_login !== undefined;

    return new Post({
        id: row.id,
        authorId: row.author_id,
        title: row.title,
        publishDate: row.publish_date,
        status: row.status,
        locked: Boolean(row.locked),
        content: row.content,
        ...(hasStats && {
            author: mapAuthor(row, row.author_id),
            rating: Number(row.rating),
            likesCount: Number(row.likes_count),
            dislikesCount: Number(row.dislikes_count),
            commentsCount: Number(row.comments_count),
            viewsCount: Number(row.views_count),
            myReaction: row.my_reaction || null,
            isFavorite: Boolean(Number(row.is_favorite))
        })
    });
};

module.exports = { LIKE_SCORE, userRatingSql, postProjection, commentProjection, mapAuthor, mapPostRow };
