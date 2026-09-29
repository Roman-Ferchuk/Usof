const nodemailer = require('nodemailer');

class EmailService {
    /**
     * Initializes the EmailService instance with SMTP transport and base application URL.
     * @param {string} [baseUrl] - The base URL of the application for generating action links.
     */
    constructor(baseUrl = process.env.CLIENT_URL || 'http://localhost:3000') {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Removes trailing slash if present
        
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER || 'ferchukroman3@gmail.com',
                pass: process.env.SMTP_PASS || 'gdbu xcai vdtk ixoa'
            }
        });
        
        this.fromEmail = process.env.SMTP_USER || 'ferchukroman3@gmail.com';
    }

    /**
     * Sends an email confirmation message containing a verification token link.
     * @param {string} toEmail - The recipient's email address.
     * @param {string} token - The JWT email confirmation token.
     * @returns {Promise<void>} Resolves when the email is sent.
     */
    async sendConfirmationEmail(toEmail, token) {
        const confirmUrl = `${this.baseUrl}/api/auth/confirm-email/${token}`;
        
        await this.transporter.sendMail({
            from: this.fromEmail,
            to: toEmail,
            subject: 'USOF - Email Registration Confirmation',
            html: `
                <h3>Welcome to USOF!</h3>
                <p>Please confirm your email address by clicking the link below:</p>
                <a href="${confirmUrl}">${confirmUrl}</a>
            `
        });
    }

    /**
     * Sends a password reset email containing a reset token link.
     * @param {string} toEmail - The recipient's email address.
     * @param {string} token - The JWT password reset token.
     * @returns {Promise<void>} Resolves when the email is sent.
     */
    async sendPasswordResetEmail(toEmail, token) {
        const resetUrl = `${this.baseUrl}/api/auth/password-reset/${token}`;

        await this.transporter.sendMail({
            from: this.fromEmail,
            to: toEmail,
            subject: 'USOF - Password Reset Request',
            html: `
                <h3>Password Reset Request</h3>
                <p>Click the link below to set a new password for your account:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p><small>This link is valid for 15 minutes.</small></p>
            `
        });
    }

    /**
     * Escapes special HTML characters in a string to prevent XSS injection.
     * @private
     * @param {string} [str=''] - The string to escape.
     * @returns {string} The escaped HTML string.
     */
    #escape(str = '') {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Sends a notification email when a subscribed post has been updated.
     * @param {string} toEmail - The recipient's email address.
     * @param {Object} details - Information about the updated post.
     * @param {number|string} details.postId - ID of the updated post.
     * @param {string} details.postTitle - Title of the updated post.
     * @param {Array<string>} details.changedFields - List of post fields that were modified.
     * @returns {Promise<void>} Resolves when the email is sent.
     */
    async sendPostUpdatedEmail(toEmail, { postId, postTitle, changedFields }) {
        const postUrl = `${this.baseUrl}/posts/${postId}`;
        const fieldNames = { title: 'title', content: 'content', status: 'status', categories: 'categories' };
        const changed = changedFields.map((f) => fieldNames[f] || f).join(', ');

        await this.transporter.sendMail({
            from: this.fromEmail,
            to: toEmail,
            subject: `USOF - Post "${postTitle}" was updated`,
            html: `
                <h3>A post you are subscribed to has been updated</h3>
                <p><b>${this.#escape(postTitle)}</b></p>
                <p>What changed: ${this.#escape(changed)}</p>
                <a href="${postUrl}">View Post</a>
            `
        });
    }

    /**
     * Sends a notification email when a new comment is added to a subscribed post.
     * @param {string} toEmail - The recipient's email address.
     * @param {Object} details - Information about the new comment.
     * @param {number|string} details.postId - ID of the target post.
     * @param {string} details.postTitle - Title of the target post.
     * @param {string} details.authorName - Name of the comment author.
     * @param {string} details.commentContent - Content of the newly created comment.
     * @returns {Promise<void>} Resolves when the email is sent.
     */
    async sendNewCommentEmail(toEmail, { postId, postTitle, authorName, commentContent }) {
        const postUrl = `${this.baseUrl}/posts/${postId}`;
        const preview = commentContent.length > 300
            ? commentContent.slice(0, 300) + '...'
            : commentContent;

        await this.transporter.sendMail({
            from: this.fromEmail,
            to: toEmail,
            subject: `USOF - New comment on "${postTitle}"`,
            html: `
                <h3>New comment on a post you are subscribed to</h3>
                <p><b>${this.#escape(postTitle)}</b></p>
                <p><i>${this.#escape(authorName)}</i> wrote:</p>
                <blockquote>${this.#escape(preview)}</blockquote>
                <a href="${postUrl}">Go to Post</a>
            `
        });
    }
}

module.exports = EmailService;