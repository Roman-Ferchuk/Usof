/**
 * Controller class handling HTTP requests related to user authentication and password management.
 */
class AuthController {
    /**
     * Creates an instance of AuthController.
     * @param {Object} authService - Instance of AuthService handling authentication logic.
     */
    constructor(authService) {
        this.authService = authService;
    }

    /**
     * Registers a new user account and triggers email confirmation process.
     * @route POST /api/auth/register
     * @param {Object} req - Express request object containing registration details.
     * @param {Object} req.body - Registration payload (login, password, passwordConfirmation, email, fullName).
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response with registration metadata or error message.
     */
    async register(req, res) {
        try {
            const newUser = await this.authService.register({
                login: req.body.login,
                password: req.body.password,
                passwordConfirmation: req.body.passwordConfirmation,
                email: req.body.email
            });

            return res.status(201).json(newUser);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Confirms user email address using confirmation token.
     * @route GET /api/auth/confirm-email/:confirm_token
     * @param {Object} req - Express request object.
     * @param {Object} req.params - Path parameters containing confirm_token.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response confirming successful verification or error message.
     */
    async confirmEmail(req, res) {
        try {
            const { confirm_token } = req.params;
            await this.authService.confirmEmail(confirm_token);
            return res.status(200).json({ message: 'Email address has been successfully confirmed.' });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Authenticates user credentials and returns JWT token upon successful login.
     * @route POST /api/auth/login
     * @param {Object} req - Express request object containing login credentials.
     * @param {Object} req.body - Credentials object (login/email and password).
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response with JWT token and user profile or auth error.
     */
    async login(req, res) {
        try {
            const authResult = await this.authService.login({
                login: req.body.login,
                email: req.body.email,
                password: password
            });

            return res.status(200).json(authResult);
        } catch (error) {
            if (error.message.includes('not been confirmed')) {
                return res.status(403).json({ error: error.message });
            }
            return res.status(401).json({ error: error.message });
        }
    }

    /**
     * Logs out the user session (clears user context client-side).
     * @route POST /api/auth/logout
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response with logout status message.
     */
    async logout(req, res) {
        try {
            return res.status(200).json({ message: 'User successfully logged out' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Requests a password reset link sent to the user's registered email.
     * @route POST /api/auth/password-reset
     * @param {Object} req - Express request object.
     * @param {Object} req.body - Object containing target account email.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response with status confirmation message.
     */
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            const result = await this.authService.requestPasswordReset(email);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Resets account password using a valid password reset token.
     * @route POST /api/auth/password-reset/:confirm_token
     * @param {Object} req - Express request object.
     * @param {Object} req.params - Path parameters containing confirm_token.
     * @param {Object} req.body - Object containing new password.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response indicating successful password reset or error.
     */
    async resetPassword(req, res) {
        try {
            const { confirm_token } = req.params;
            const { newPassword } = req.body;
            const result = await this.authService.resetPassword(confirm_token, newPassword);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = AuthController;