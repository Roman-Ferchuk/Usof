const { Like, LikeType, LikeTargetType } = require('../entities/Like');

class LikeRepository {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Maps a database row to a Like entity instance.
     * @private
     * @param {Object|null} row - Database result row.
     * @returns {Like|null} Like entity or null if row is empty.
     */
    #mapToEntity(row) {
        if (!row) return null;

        const targetType = row.post_id !== null
            ? LikeTargetType.POST
            : LikeTargetType.COMMENT;

        const targetId = row.post_id !== null
            ? row.post_id
            : row.comment_id;

        return new Like({
            id: row.id,
            authorId: row.author_id,
            targetType,
            targetId,
            type: row.type,
            publishDate: row.publish_date
        });
    }

    /**
     * Creates a new like or dislike record for a post or comment.
     * @param {Object} data - Like creation parameters.
     * @param {number|string} data.authorId - ID of the user creating the reaction.
     * @param {string} data.targetType - Target type ('post' or 'comment').
     * @param {number|string} data.targetId - ID of the target post or comment.
     * @param {string} data.type - Reaction type ('like' or 'dislike').
     * @param {Date} [data.publishDate=new Date()] - Date of reaction creation.
     * @returns {Promise<number>} ID of the newly created reaction.
     */
    async create({ authorId, targetType, targetId, type, publishDate = new Date() }) {
        if (!Object.values(LikeTargetType).includes(targetType)) {
            throw new Error(`[LikeRepository.create] Invalid target type: ${targetType}`);
        }

        if (!Object.values(LikeType).includes(type)) {
            throw new Error(`[LikeRepository.create] Invalid like type: ${type}`);
        }

        const postId = targetType === LikeTargetType.POST ? targetId : null;
        const commentId = targetType === LikeTargetType.COMMENT ? targetId : null;

        try {
            const [result] = await this.pool.query(
                `INSERT INTO usof_database.likes
                    (author_id, type, publish_date, post_id, comment_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [authorId, type, publishDate, postId, commentId]
            );

            return result.insertId;
        } catch (error) {
            console.error('[LikeRepository.create] Error creating like: ', error.message);
            throw error;
        }
    }

    /**
     * Retrieves a reaction by its ID.
     * @param {number|string} id - Reaction ID.
     * @returns {Promise<Like|null>} Like entity or null if not found.
     */
    async getById(id) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, author_id, type, publish_date, post_id, comment_id
                 FROM usof_database.likes
                 WHERE id = ?`,
                [id]
            );

            return this.#mapToEntity(rows[0]);
        } catch (error) {
            console.error('[LikeRepository.getById] Error getting like: ', error.message);
            throw error;
        }
    }

    /**
     * Retrieves all reactions associated with a specific target (post or comment).
     * @param {string} targetType - Target type ('post' or 'comment').
     * @param {number|string} targetId - Target ID.
     * @returns {Promise<Array<Like>>} Array of Like entities.
     */
    async getByTarget(targetType, targetId) {
        if (!Object.values(LikeTargetType).includes(targetType)) {
            throw new Error(`[LikeRepository.getByTarget] Invalid target type: ${targetType}`);
        }

        const column = targetType === LikeTargetType.POST ? 'post_id' : 'comment_id';

        try {
            const [rows] = await this.pool.query(
                `SELECT id, author_id, type, publish_date, post_id, comment_id
                 FROM usof_database.likes
                 WHERE ${column} = ?
                 ORDER BY publish_date ASC`,
                 [targetId]
            );

            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[LikeRepository.getByTarget] Error getting likes by target ID: ', error.message);
            throw error;
        }
    }

    /**
     * Retrieves a user's reaction to a specific post.
     * @param {number|string} userId - User ID.
     * @param {number|string} postId - Post ID.
     * @returns {Promise<Like|null>} Like entity or null if no reaction exists.
     */
    async getByUserAndPost(userId, postId) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, author_id, type, publish_date, post_id, comment_id
                 FROM usof_database.likes
                 WHERE author_id = ? AND post_id = ?`,
                [userId, postId]
            );

            return this.#mapToEntity(rows[0]);
        } catch (error) {
            console.error('[LikeRepository.getByUserAndPost] Error getting like: ', error.message);
            throw error;
        }
    }

    /**
     * Retrieves a user's reaction to a specific comment.
     * @param {number|string} userId - User ID.
     * @param {number|string} commentId - Comment ID.
     * @returns {Promise<Like|null>} Like entity or null if no reaction exists.
     */
    async getByUserAndComment(userId, commentId) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, author_id, type, publish_date, post_id, comment_id
                 FROM usof_database.likes
                 WHERE author_id = ? AND comment_id = ?`,
                [userId, commentId]
            );

            return this.#mapToEntity(rows[0]);
        } catch (error) {
            console.error('[LikeRepository.getByUserAndComment] Error getting like: ', error.message);
            throw error;
        }
    }

    /**
     * Updates the type of an existing reaction (e.g., switches between 'like' and 'dislike').
     * @param {number|string} id - Reaction ID.
     * @param {string} type - New reaction type ('like' or 'dislike').
     * @returns {Promise<boolean>} True if updated, false otherwise.
     */
    async updateType(id, type) {
        if (!Object.values(LikeType).includes(type)) {
            throw new Error(`[LikeRepository.updateType] Invalid like type: ${type}`);
        }

        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.likes
                 SET type = ?
                 WHERE id = ?`,
                [type, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[LikeRepository.updateType] Error updating like: ', error.message);
            throw error;
        }
    }

    /**
     * Deletes a reaction record by its ID.
     * @param {number|string} id - Reaction ID.
     * @returns {Promise<boolean>} True if deleted, false otherwise.
     */
    async delete(id) {
        try {
            const [result] = await this.pool.query(
                `DELETE FROM usof_database.likes
                 WHERE id = ?`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[LikeRepository.delete] Error deleting like: ', error.message);
            throw error;
        }
    }
}

module.exports = LikeRepository;