const Comment = require('../entities/Comment');

class CommentRepository {
    constructor(pool) {
        this.pool = pool;
    }

    #mapToEntity(row) {
        if (!row) return null;
        return new Comment({
            id: row.id,
            postId: row.post_id,
            authorId: row.author_id,
            parentId: row.parent_id,
            publishDate: row.publish_date,
            status: row.status,
            locked: Boolean(row.locked),
            content: row.content
        });
    }

    async create({ postId, authorId, parentId = null, publishDate = new Date(), content }) {
        try {
            const [result] = await this.pool.query(
                `INSERT INTO usof_database.comments (post_id, author_id, parent_id, publish_date, content)
                 VALUES (?, ?, ?, ?, ?)`,
                 [postId, authorId, parentId, publishDate, content]
            );

            return result.insertId;
        } catch (error) {
            console.error('[CommentRepository.create] Error creating comment: ', error.message);
            throw error;
        }
    }

    async getById(id) {
        try {
            const [result] = await this.pool.query(
                `SELECT id, post_id, author_id, parent_id, publish_date, status, locked, content
                 FROM usof_database.comments
                 WHERE id = ?`,
                 [id]
            );

            return this.#mapToEntity(result[0]);
        } catch (error) {
            console.error('[CommentRepository.getById] Error getting comment by id: ', error.message);
            throw error;
        }
    }

    async getAllCommentsUnderPostById(id) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, post_id, author_id, parent_id, publish_date, status, locked, content
                 FROM usof_database.comments
                 WHERE post_id = ?`,
                 [id]
            );

            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[CommentRepository.getById] Error getting comment under post by id: ', error.message);
            throw error;
        }
    }

    async updateCommentStatus(id, status) {
        if (!['active', 'inactive'].includes(status)) {
            throw new Error(`[CommentRepository.updateCommentStatus] Invalid status: ${status}`);
        }
        
        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.comments
                 SET status = ?
                 WHERE id = ?`, 
                [status, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[CommentRepository.updateCommentStatus] Error updating comment status: ', error.message);
            throw error;
        }
    }

    async updateCommentLock(id, locked) {
        if (typeof locked !== 'boolean') {
            throw new Error('[CommentRepository.updateCommentLock] Locked must be boolean');
        }
        
        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.comments
                 SET locked = ?
                 WHERE id = ?`, 
                [locked, id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[CommentRepository.updateCommentLock] Error updating comment lock: ', error.message);
            throw error;
        }
    }

    async deleteComment(id) {
        try {
            const [result] = await this.pool.query(
                `DELETE FROM usof_database.comments 
                 WHERE id = ?`,
                [id]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('[CommentRepository.deleteComment] Error deleting comment: ', error.message);
            throw error;
        }
    }

    // async updateCommentData(id, content) {
    //     if (!content) {
    //         throw new Error(`[CommentRepository.updateCommentData] Update data must be not null`);
    //     }

    //     try {
    //         const [result] = await this.pool.query(
    //             `UPDATE usof_database.comments
    //              SET content = ?
    //              WHERE id = ?`,
    //              [content, id]
    //         );

    //         return result.affectedRows > 0;
    //     } catch (error) {
    //         console.error('[CommentRepository.updateCommentData] Error updating comment data: ', error.message);
    //         throw error;
    //     }
    // }
}

module.exports = CommentRepository;