const nodemailer = require('nodemailer');

const EmailTemplates = require('./email/EmailTemplates');

const RESET_LINK_MINUTES = 15;

/**
 * Sends e-mails. Message content lives in EmailTemplates; this class only
 * builds links to the web client and delivers the result.
 *
 * Without SMTP credentials the message is printed to the console instead of
 * being sent, so the whole flow can be tried on a machine without a mail account.
 */
class EmailService {
    /**
     * @param {string} [clientUrl] - Base URL of the web client (the React app) used in links.
     * @param {EmailTemplates} [templates] - Template builder.
     */
    constructor(
        clientUrl = process.env.CLIENT_URL || 'http://localhost:5173',
        templates = new EmailTemplates()
    ) {
        this.clientUrl = clientUrl.replace(/\/$/, '');
        this.templates = templates;

        this.hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
        this.transporter = this.hasSmtp
            ? nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            })
            : null;

        this.from = process.env.SMTP_USER
            ? `"usof" <${process.env.SMTP_USER}>`
            : '"usof" <no-reply@usof.local>';
    }

    /**
     * Sends the e-mail confirmation message.
     * @param {string} toEmail - Recipient address.
     * @param {string} token - Email confirmation JWT.
     * @param {string} [name] - Recipient name for the greeting.
     * @returns {Promise<void>}
     */
    async sendConfirmationEmail(toEmail, token, name) {
        const url = `${this.clientUrl}/#/confirm/${encodeURIComponent(token)}`;
        await this.#deliver(toEmail, this.templates.confirmEmail({ name, url }), url);
    }

    /**
     * Sends the password reset message.
     * @param {string} toEmail - Recipient address.
     * @param {string} token - Password reset JWT.
     * @param {string} [name] - Recipient name for the greeting.
     * @returns {Promise<void>}
     */
    async sendPasswordResetEmail(toEmail, token, name) {
        const url = `${this.clientUrl}/#/reset/${encodeURIComponent(token)}`;
        await this.#deliver(
            toEmail,
            this.templates.passwordReset({ name, url, minutes: RESET_LINK_MINUTES }),
            url
        );
    }

    /**
     * Tells a subscriber that a post was changed.
     * @param {string} toEmail - Recipient address.
     * @param {Object} details
     * @param {number|string} details.postId - Post id.
     * @param {string} details.postTitle - Post title.
     * @param {string[]} details.changedFields - Changed field names.
     * @returns {Promise<void>}
     */
    async sendPostUpdatedEmail(toEmail, { postId, postTitle, changedFields }) {
        const url = this.#postUrl(postId);
        await this.#deliver(toEmail, this.templates.postUpdated({ postTitle, changedFields, url }), url);
    }

    /**
     * Tells a subscriber about a new comment.
     * @param {string} toEmail - Recipient address.
     * @param {Object} details
     * @param {number|string} details.postId - Post id.
     * @param {string} details.postTitle - Post title.
     * @param {string} details.authorName - Comment author.
     * @param {string} details.commentContent - Comment text.
     * @returns {Promise<void>}
     */
    async sendNewCommentEmail(toEmail, { postId, postTitle, authorName, commentContent }) {
        const url = this.#postUrl(postId);
        await this.#deliver(
            toEmail,
            this.templates.newComment({ postTitle, authorName, commentContent, url }),
            url
        );
    }

    /**
     * Builds a link to a post in the web client (hash routing).
     * @private
     */
    #postUrl(postId) {
        return `${this.clientUrl}/#/posts/${postId}`;
    }

    /**
     * Delivers a rendered message, or prints it when SMTP is not configured.
     * @private
     * @param {string} to - Recipient.
     * @param {{subject: string, html: string, text: string}} message - Rendered message.
     * @param {string} url - Main link of the message (for the console fallback).
     */
    async #deliver(to, { subject, html, text }, url) {
        if (!this.transporter) {
            console.log(`[EmailService] SMTP is not configured, e-mail not sent.\n  to: ${to}\n  subject: ${subject}\n  link: ${url}`);
            return;
        }

        await this.transporter.sendMail({ from: this.from, to, subject, html, text });
    }
}

module.exports = EmailService;
