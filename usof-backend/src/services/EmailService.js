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
}

module.exports = EmailService;