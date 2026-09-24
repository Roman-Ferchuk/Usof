const { Like, LikeType, LikeTargetType } = require('../entities/Like');

class LikeRepository {
    constructor(pool) {
        this.pool = pool;
    }

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