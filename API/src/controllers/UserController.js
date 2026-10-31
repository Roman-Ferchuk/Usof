/**
 * Controller class handling HTTP requests related to user management operations.
 */
class UserController {
    /**
     * Creates an instance of UserController.
     * @param {Object} userService - Instance of UserService delivering business logic.
     */
    constructor(userService) {
        this.userService = userService;
    }

    /**
     * Retrieves all user entities from the database.
     * @route GET /api/users
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response with list of users or error details.
     */
    async getAllUsers(req, res) {
        try {
            const users = await this.userService.getAllUsers();
            return res.status(200).json(users);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getUserById(req, res) {
        try {
            const { user_id } = req.params;

            const user = await this.userService.getUserById(user_id);
            const canSeePrivate = req.user
                && (req.user.role === 'admin' || Number(req.user.id) === Number(user.id));

            if (canSeePrivate) {
                return res.status(200).json(user);
            }

            return res.status(200).json({
                id: user.id,
                login: user.login,
                fullName: user.fullName,
                profilePicture: user.profilePicture,
                rating: user.rating,
                role: user.role
            });
        } catch (error) {
            if (error.message === 'User not found' || error.message === 'Invalid ID') {
                return res.status(404).json({ error: error.message });
            }

            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Registers a new user account with administrative control.
     * @route POST /api/users
     * @param {Object} req - Express request object containing registration parameters.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response with created user or validation error.
     */
    async createUser(req, res) {
        try {
            const newUser = await this.userService.createUser(req.body);
            return res.status(201).json(newUser);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Updates profile fields for a specific user ID with permission checks.
     * @route PATCH /api/users/:user_id
     * @param {Object} req - Express request object.
     * @param {Object} req.params - Path parameters containing user_id.
     * @param {Object} req.body - Object containing updated field values.
     * @param {Object} req.user - Authorized user context from authentication middleware.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response with updated user record.
     */
    async updateProfile(req, res) {
        try {
            const { user_id } = req.params;

            const updatedUser = await this.userService.updateProfile({
                userId: user_id,
                data: req.body,
                currentUserId: req.user.id,
                currentUserRole: req.user.role
            });

            return res.status(200).json(updatedUser); 
        } catch (error) {
            if (error.message === 'Forbidden') {
                return res.status(403).json({ error: error.message });
            }

            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }

            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Changes the authorization role assigned to a user account.
     * @route PATCH /api/users/:user_id/role
     * @param {Object} req - Express request object.
     * @param {Object} req.params - Path parameters containing user_id.
     * @param {Object} req.body - Body parameters containing new role string.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response with updated user object.
     */
    async changeRole(req, res) {
        try {
            const { user_id } = req.params;
            const { role } = req.body;

            const updatedUser = await this.userService.changeRole(user_id, role);
            return res.status(200).json(updatedUser);
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Updates the avatar file path for an authorized user account.
     * @route PATCH /api/users/avatar
     * @param {Object} req - Express request object.
     * @param {Object} [req.file] - File payload parsed by file-upload middleware (e.g., multer).
     * @param {Object} req.user - Authorized user context from authentication middleware.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response with updated user object.
     */
    async updateAvatar(req, res) {
        try {
            const user_id = req.user.id;
            if (!req.file) {
                return res.status(400).json({ message: 'Avatar is required' });
            }

            const updatedUser = await this.userService.updateAvatar({
                userId: user_id,
                avatarPath: req.file.path.replace(/\\/g, '/'),
                currentUserId: req.user.id,
                currentUserRole: req.user.role
            });

            return res.status(200).json(updatedUser);
        } catch (error) {
            if (error.message === 'Forbidden') {
                return res.status(403).json({ error: error.message });
            }
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Permanently deletes a user profile record from the system.
     * @route DELETE /api/users/:user_id
     * @param {Object} req - Express request object.
     * @param {Object} req.params - Path parameters containing user_id.
     * @param {Object} req.user - Authorized user context from authentication middleware.
     * @param {Object} res - Express response object.
     * @returns {Promise<Response>} HTTP response confirming successful deletion.
     */
    async deleteUser(req, res) {
        try {
            const { user_id } = req.params;
            
            await this.userService.deleteUser({
                userId: user_id,
                currentUserId: req.user.id,
                currentUserRole: req.user.role
            });

            return res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            if (error.message === 'Forbidden') {
                return res.status(403).json({ error: error.message });
            }
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = UserController;