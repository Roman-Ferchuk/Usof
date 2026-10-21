const PostImage = require('../entities/PostImage');

class PostImageRepository {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Maps a database row to a PostImage entity instance.
     * @private
     * @param {Object|null} row - Database result row.
     * @returns {PostImage|null} PostImage entity or null if row is empty.
     */
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

    /**
     * Creates a new post image record in the database.
     * @param {Object} data - Image creation details.
     * @param {number|string} data.postId - ID of the post.
     * @param {string} data.imagePath - Path to the image file.
     * @returns {Promise<number>} ID of the newly created image record.
     */
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

    /**
     * Creates multiple post image records sequentially.
     * @param {Object} data - Batch creation details.
     * @param {number|string} data.postId - ID of the target post.
     * @param {Array<string>} data.imagePaths - Array of image file paths.
     * @returns {Promise<void>}
     */
    async createMany({ postId, imagePaths }) {
        if (!imagePaths || imagePaths.length === 0) return;

        try {
            for (const imagePath of imagePaths) {
                await this.create({ postId, imagePath });
            }
        } catch (error) {
            console.error('[PostImageRepository.createMany] Error creating images: ', error.message);
            throw error;
        }
    }

    /**
     * Retrieves all images associated with a specific post.
     * @param {number|string} postId - ID of the post.
     * @returns {Promise<Array<PostImage>>} Array of PostImage entities.
     */
    async getImagesInPost(postId) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, post_id, image_path, position, created_at
                FROM usof_database.post_images
                WHERE post_id = ?
                ORDER BY position ASC, created_at ASC`,
                [postId]
            );

            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[PostImageRepository.getImagesInPost] Error getting images in post: ', error.message);
            throw error;
        }
    }

    /**
     * Deletes a post image record by its ID.
     * @param {number|string} id - ID of the image record to delete.
     * @returns {Promise<boolean>} True if deleted successfully, false otherwise.
     */
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

    /**
     * Deletes all image records associated with a specific post.
     * @param {number|string} postId - ID of the post whose images should be deleted.
     * @returns {Promise<boolean>} True if any images were deleted, false otherwise.
     */
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

module.exports = PostImageRepository;