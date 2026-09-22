const PostImage = require('../entities/PostImage');

class PostImageRepository {
    constructor(pool) {
        this.pool = pool;
    }

    #mapToEntity(row) {
        if (!row) return null;
        return new PostImage({
            id: row.id,
            postId: row.post_id,
            imagePath: row.image_path,
            position: row.position,
            createdAt: row.created_at,
        });
    }

    async create({ postId, imagePath }) {
        try {
            const [result] = await this.pool.query(
                `INSERT INTO usof_database.post_images
                    (post_id, image_path)
                VALUES (?, ?)`,
                [postId, imagePath]
            );

            return result.insertId;
        } catch (error) {
            console.error('[PostImageRepository.create] Error creating image: ', error.message);
            throw error;
        }
    }

    async createMany( {postId, imagePaths }) {
        if (!imagePaths || imagePaths.length === 0) return;

        try {
            await imagePaths.forEach(imagePath => {
                this.create(postId, imagePath)
            });
        } catch (error) {
            console.error('[PostImageRepository.createMany] Error creating images: ', error.message);
            throw error;
        }
    }

    async getImagesInPost(postId) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, post_id, image_path, created_at
                 FROM usof_database.post_images
                 WHERE post_id = ?
                 ORDER BY created_at ASC`,
                [postId]
            );

            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[PostImageRepository.getImagesInPost] Error getting images in post: ', error.message);
            throw error;
        }
    }

    async delete(id) {
        try {
            const [result] = await this.pool.query(
                `DELETE FROM usof_database.post_images
                WHERE id = ?`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[PostImageRepository.delete] Error deleting image: ', error.message);
            throw error;
        }
    }

    async deleteByPostId(postId) {
        try {
            const [result] = await this.pool.query(
                `DELETE FROM usof_database.post_images
                WHERE post_id = ?`,
                [postId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[PostImageRepository.deleteByPostId] Error deleting images: ', error.message);
            throw error;
        }
    }
}