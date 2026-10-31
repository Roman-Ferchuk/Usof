class SubscriptionService {
    /**
     * Initializes the SubscriptionService instance.
     * @param {Object} subscriptionRepository - Repository for subscription database operations.
     * @param {Object} postService - Service for post-related business logic.
     */
    constructor(subscriptionRepository, postService) {
        this.subscriptionRepository = subscriptionRepository;
        this.postService = postService;
    }

    /**
     * Subscribes a user to a post.
     * @param {number|string} postId - ID of the target post.
     * @param {Object} context - User context information.
     * @param {number|string} context.userId - ID of the user subscribing.
     * @param {string} context.role - Role of the user.
     * @returns {Promise<{subscribed: boolean}>} Object indicating subscription status.
     */
    async subscribe(postId, { userId, role }) {
        await this.postService.getPostById(postId, { userId, role });
        await this.subscriptionRepository.subscribe(Number(userId), Number(postId));
        return { subscribed: true };
    }

    /**
     * Unsubscribes a user from a post.
     * @param {number|string} postId - ID of the target post.
     * @param {number|string} userId - ID of the user unsubscribing.
     * @returns {Promise<{subscribed: boolean}>} Object indicating subscription status.
     * @throws {Error} Throws an error if the subscription does not exist.
     */
    async unsubscribe(postId, userId) {
        const removed = await this.subscriptionRepository.unsubscribe(Number(userId), Number(postId));
        if (!removed) {
            throw new Error('Subscription not found');
        }
        return { subscribed: false };
    }

    /**
     * Gets the subscription status of a user for a specific post.
     * @param {number|string} postId - ID of the target post.
     * @param {number|string} userId - ID of the user.
     * @returns {Promise<{subscribed: boolean}>} Object containing the subscription status.
     */
    async getStatus(postId, userId) {
        const subscribed = await this.subscriptionRepository.isSubscribed(Number(userId), Number(postId));
        return { subscribed };
    }
}

module.exports = SubscriptionService;