/**
 * Repository class handling database operations for post subscriptions.
 */
class SubscriptionRepository {
    /**
     * Creates an instance of SubscriptionRepository.
     * @param {Object} pool - Database connection pool instance.
     */
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Subscribes a user to a post.
     * @param {number|string} userId - ID of the subscribing user.
     * @param {number|string} postId - ID of the target post.
     * @returns {Promise<void>}
     */
    async subscribe(userId, postId) {
        await this.pool.query(
            'INSERT IGNORE INTO post_subscriptions (user_id, post_id) VALUES (?, ?)',
            [userId, postId]
        );
    }

    /**
     * Unsubscribes a user from a post.
     * @param {number|string} userId - ID of the unsubscribing user.
     * @param {number|string} postId - ID of the target post.
     * @returns {Promise<boolean>} True if subscription was removed, false otherwise.
     */
    async unsubscribe(userId, postId) {
        const [result] = await this.pool.query(
            'DELETE FROM post_subscriptions WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Checks if a user is subscribed to a post.
     * @param {number|string} userId - ID of the user.
     * @param {number|string} postId - ID of the post.
     * @returns {Promise<boolean>} True if subscribed, false otherwise.
     */
    async isSubscribed(userId, postId) {
        const [rows] = await this.pool.query(
            'SELECT 1 FROM post_subscriptions WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );
        return rows.length > 0;
    }

    /**
     * Gets subscribers of a post with confirmed email, excluding a specific user.
     * @param {number|string} postId - ID of the target post.
     * @param {number|string|null} [excludeUserId=null] - Optional user ID to exclude from results.
     * @returns {Promise<Array<Object>>} List of subscriber objects containing id, email, and full_name.
     */
    async getSubscribers(postId, excludeUserId = null) {
        const [rows] = await this.pool.query(
            `SELECT u.id, u.email, u.full_name
             FROM post_subscriptions s
             JOIN users u ON u.id = s.user_id
             WHERE s.post_id = ?
               AND u.email_confirmed = TRUE
               AND u.id <> ?`,
            [postId, excludeUserId ?? 0]
        );
        return rows;
    }
}

module.exports = SubscriptionRepository;