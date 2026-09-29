class NotificationService {
    /**
     * Initializes the NotificationService instance.
     * @param {Object} subscriptionRepository - Repository for managing post subscriptions.
     * @param {Object} emailService - Service for sending email notifications.
     */
    constructor(subscriptionRepository, emailService) {
        this.subscriptionRepository = subscriptionRepository;
        this.emailService = emailService;
    }

    /**
     * Notifies subscribers that a post has been updated.
     * @param {Object} params - Parameters for post update notification.
     * @param {Object} params.post - The updated post entity/object.
     * @param {Array<string>} params.changedFields - Array of field names that were changed (e.g., ['title', 'content']).
     * @param {number|string} params.authorId - ID of the user who made the changes (excluded from notifications).
     * @returns {Promise<void>}
     */
    async notifyPostUpdated({ post, changedFields, authorId }) {
        if (post.status !== 'active' || changedFields.length === 0) return;

        await this.#sendToSubscribers(post.id, authorId, (email) =>
            this.emailService.sendPostUpdatedEmail(email, {
                postId: post.id,
                postTitle: post.title,
                changedFields
            })
        );
    }

    /**
     * Notifies subscribers that a new comment has been added to a post.
     * @param {Object} params - Parameters for new comment notification.
     * @param {Object} params.post - The post entity/object being commented on.
     * @param {Object} params.comment - The newly created comment entity/object.
     * @param {number|string} params.authorId - ID of the comment author (excluded from notifications).
     * @param {string} params.authorName - Display name of the comment author.
     * @returns {Promise<void>}
     */
    async notifyNewComment({ post, comment, authorId, authorName }) {
        if (post.status !== 'active' || comment.status === 'inactive') return;

        await this.#sendToSubscribers(post.id, authorId, (email) =>
            this.emailService.sendNewCommentEmail(email, {
                postId: post.id,
                postTitle: post.title,
                authorName: authorName,
                commentContent: comment.content
            })
        );
    }

    /**
     * Helper method to fetch subscribers and dispatch email functions concurrently.
     * @private
     * @param {number|string} postId - ID of the post.
     * @param {number|string} authorId - ID of the user to exclude from receiving notification.
     * @param {Function} sendFn - Callback function that takes subscriber email and sends the message.
     * @returns {Promise<void>}
     */
    async #sendToSubscribers(postId, authorId, sendFn) {
        try {
            const subscribers = await this.subscriptionRepository.getSubscribers(postId, authorId);
            const results = await Promise.allSettled(
                subscribers.map((s) => sendFn(s.email))
            );

            results
                .filter((r) => r.status === 'rejected')
                .forEach((r) => console.error('Notification failed:', r.reason));
        } catch (error) {
            console.error('Notification error:', error);
        }
    }
}

module.exports = NotificationService;