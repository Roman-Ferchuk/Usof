const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config/jwt');
const JWT_EXPIRES_IN = '24h';
const RESET_TOKEN_EXPIRES_IN = '15m';

class AuthService {
    /**
     * Creates an instance of AuthService.
     * @param {Object} userRepository - Repository for database operations related to users.
     * @param {Object} emailService - Service responsible for sending email notifications.
     */
    constructor(userRepository, emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Registers a new user with the provided credentials.
     * @param {Object} userData - The registration payload.
     * @param {string} userData.login - The user's login name.
     * @param {string} userData.password - The account password.
     * @param {string} userData.passwordConfirmation - Confirmation of the password.
     * @param {string} userData.email - The user's email address.
     * @param {string} [userData.fullName] - Optional full name of the user.
     * @returns {Promise<Object>} An object containing user metadata and a status message.
     */
    async register({ login, password, passwordConfirmation, email, fullName }) {
        if (!login || !password || !passwordConfirmation || !email) {
            throw new Error('All required fields (login, password, passwordConfirmation, email) must be filled out');
        }

        if (password !== passwordConfirmation) {
            throw new Error('Password and password confirmation do not match');
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedLogin = login.trim();

        const existingLogin = await this.userRepository.findBy('login', normalizedLogin);
        if (existingLogin) {
            throw new Error('Login is already taken');
        }

        const existingEmail = await this.userRepository.findBy('email', normalizedEmail);
        if (existingEmail) {
            throw new Error('Email is already in use');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const userId = await this.userRepository.create({
            login: normalizedLogin,
            passwordHash,
            fullName: (fullName && fullName.trim() ? fullName.trim() : normalizedLogin).slice(0, 45),
            email: normalizedEmail,
            role: 'user'
        });

        const newUser = await this.userRepository.getById(userId);

        const confirmToken = jwt.sign(
            { userId: newUser.id, type: 'email_confirmation' },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        try {
            await this.emailService.sendConfirmationEmail(newUser.email, confirmToken, newUser.fullName);
        } catch (error) {
            console.error('[AuthService.register] Failed to send confirmation email:', error.message);
        }

        return {
            id: newUser.id,
            login: newUser.login,
            email: newUser.email,
            message: 'Registration successful. Please check your email to confirm your account.'
        };
    }

    /**
     * Confirms user email using a JWT confirmation token.
     * @param {string} token - Email confirmation JWT token.
     * @returns {Promise<boolean>} Resolves to true if email was successfully confirmed.
     * @throws {Error} If the token is invalid, expired, or confirmation fails.
     */
    async confirmEmail(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            if (decoded.type !== 'email_confirmation') {
                throw new Error('Invalid token type');
            }

            const success = await this.userRepository.confirmEmail(decoded.userId);
            if (!success) {
                throw new Error('User not found or email is already confirmed');
            }

            return true;
        } catch (err) {
            throw new Error('Confirmation token is invalid or has expired');
        }
    }

    /**
     * Authenticates a user and returns a JWT access token along with user profile.
     * @param {Object} credentials - Authentication credentials.
     * @param {string} [credentials.login] - Login identifier.
     * @param {string} [credentials.email] - Email identifier.
     * @param {string} credentials.password - Plaintext password.
     * @returns {Promise<Object>} Object containing authentication token and basic user data.
     * @throws {Error} If credentials are missing, invalid, or email is unconfirmed.
     */
    async login({ login, email, password }) {
        const identifier = login || email;

        if (!identifier || !password) {
            throw new Error('Login/Email and password are required');
        }

        const user = await this.userRepository.getByLoginOrEmail(identifier.trim());

        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.emailConfirmed) {
            throw new Error('Your email address has not been confirmed yet. Please check your inbox.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            {
                id: user.id,
                login: user.login,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return {
            token,
            user: {
                id: user.id,
                login: user.login,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                profilePicture: user.profilePicture
            }
        };
    }

    /**
     * Initiates password reset process by generating a token and sending a reset email.
     * @param {string} email - Email address of the account requesting reset.
     * @returns {Promise<Object>} Object containing a confirmation message.
     * @throws {Error} If email is not provided.
     */
    async requestPasswordReset(email) {
        if (!email) {
            throw new Error('Email is required');
        }

        const user = await this.userRepository.findBy('email', email.trim().toLowerCase());

        if (!user) {
            return { message: 'If this email is registered, you will receive a password reset link.' };
        }

        const resetToken = jwt.sign(
            { userId: user.id, type: 'password_reset' },
            JWT_SECRET,
            { expiresIn: RESET_TOKEN_EXPIRES_IN }
        );

        try {
            await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.fullName);
        } catch (error) {
            // The answer stays the same, so it does not reveal whether the e-mail is registered or the mail server is down.
            console.error('[AuthService.requestPasswordReset] Failed to send reset email:', error.message);
        }

        return { message: 'If this email is registered, you will receive a password reset link.' };
    }

    /**
     * Resets user password after verifying the reset token.
     * @param {string} confirmToken - Password reset JWT token.
     * @param {string} newPassword - New plaintext password.
     * @returns {Promise<Object>} Object containing a success message.
     * @throws {Error} If token is invalid/expired or password update fails.
     */
    async resetPassword(confirmToken, newPassword) {
        if (!newPassword || newPassword.length < 8) {
            throw new Error('New password must be at least 8 characters long');
        }

        let decoded;
        try {
            decoded = jwt.verify(confirmToken, JWT_SECRET);
        } catch (err) {
            throw new Error('Password reset token is invalid or has expired');
        }

        if (decoded.type !== 'password_reset') {
            throw new Error('Invalid token');
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        const updated = await this.userRepository.updatePassword(decoded.userId, passwordHash);

        if (!updated) {
            throw new Error('Failed to update password');
        }

        return { message: 'Password has been successfully reset' };
    }
}

module.exports = AuthService;