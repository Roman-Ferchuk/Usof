const bcrypt = require('bcrypt');

/**
 * Service providing business logic for user management and authentication.
 */
class UserService {
    /**
     * Creates an instance of UserService.
     * @param {Object} userRepository - Data access repository for users.
     */
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Retrieves all registered users.
     * @returns {Promise<User[]>} Array of User entities.
     */
    async getAllUsers() {
        return this.userRepository.getAll();
    }

    /**
     * Gets a user entity by unique identifier.
     * @param {number|string} userId - ID of the user.
     * @returns {Promise<User>} The corresponding user entity.
     * @throws {Error} If ID format is invalid or user is not found.
     */
    async getUserById(userId) { 
        this.#validateId(userId); 
        
        const user = await this.userRepository.getById(userId); 
        
        if (!user) { 
            throw new Error('User not found'); 
        } 
        
        return user; 
    }

    /**
     * Finds a user entity by login or email address.
     * @param {string} identifier - User's login or email.
     * @returns {Promise<User|null>} User entity if found, otherwise null.
     * @throws {Error} If identifier is missing or invalid type.
     */
    async getUserByLoginOrEmail(identifier) { 
        if (!identifier || typeof identifier !== 'string') {
            throw new Error('Login or email is required'); 
        } 
        
        return this.userRepository.getByLoginOrEmail(identifier.trim()); 
    }

    /**
     * Registers a new user with hashed password after validation and uniqueness checks.
     * @param {Object} params - User registration details.
     * @param {string} params.login - Desired username.
     * @param {string} params.password - Plaintext password.
     * @param {string} params.passwordConfirmation - Password confirmation for matching.
     * @param {string} params.fullName - User's full name.
     * @param {string} params.email - User's email address.
     * @param {string} [params.role='user'] - User system role ('user' or 'admin').
     * @returns {Promise<User>} Newly created user entity.
     * @throws {Error} If validation fails or credentials are already in use.
     */
    async createUser({ 
        login, 
        password, 
        passwordConfirmation, 
        fullName, 
        email, 
        role = 'user' 
    }) {
        this.#validateRegistrationData({
            login, 
            password, 
            passwordConfirmation, 
            fullName, 
            email 
        });

        this.#validateRole(role);

        await this.#ensureLoginIsUnique(login);
        await this.#ensureEmailIsUnique(email);

        const passwordHash = await bcrypt.hash(password, 12);

        const userId = await this.userRepository.create({
            login,
            passwordHash,
            fullName,
            email,
            role
        });

        return this.userRepository.getById(userId);
    }

    /**
     * Alias method for createUser.
     * @param {Object} params - Registration params identical to createUser.
     * @returns {Promise<User>} Newly registered user entity.
     */
    async register(params) {
        return this.createUser(params);
    }

    /**
     * Updates user profile attributes with access control checks.
     * @param {Object} params - Update context parameters.
     * @param {number|string} params.userId - Target user ID to update.
     * @param {Object} params.data - Attributes to update (login, email, fullName, profilePicture).
     * @param {number|string} params.currentUserId - ID of the user performing the update.
     * @param {string} params.currentUserRole - Role of the user performing the update.
     * @returns {Promise<User>} Updated user entity.
     * @throws {Error} If permissions are invalid, validation fails, or update operation fails.
     */
    async updateProfile({
        userId,
        data,
        currentUserId,
        currentUserRole
    }) {
        this.#validateId(userId);
        this.#validateId(currentUserId);
        this.#validateRole(currentUserRole);

        const isOwner = Number(userId) === Number(currentUserId); 
        const isAdmin = currentUserRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new Error('Forbidden');
        }

        const user = await this.getUserById(userId);

        if (data.login !== undefined) {
            this.#validateLogin(data.login);

            if (data.login.trim() !== user.login) {
                await this.#ensureLoginIsUnique(data.login);
                user.login = data.login.trim();
            }
        }

        if (data.email !== undefined) {
            this.#validateEmail(data.email);
            const email = data.email.trim().toLowerCase();

            if (email !== user.email) {
                await this.#ensureEmailIsUnique(email);
                user.email = email;
                user.emailConfirmed = false;
            }
        }

        if (data.fullName !== undefined) {
            this.#validateFullName(data.fullName);
            user.fullName = data.fullName.trim();
        }

        if (data.profilePicture !== undefined) {
            user.profilePicture = data.profilePicture;
        }

        const saved = await this.userRepository.save(user); 
        
        if (!saved) { 
            throw new Error('Failed to update user'); 
        } 
        
        return this.getUserById(user.id);
    }

    /**
     * Changes role for a specified user.
     * @param {number|string} userId - Target user ID.
     * @param {string} role - New role ('user' or 'admin').
     * @returns {Promise<User>} Updated user entity.
     * @throws {Error} If role or ID is invalid, or update operation fails.
     */
    async changeRole(userId, role) { 
        this.#validateId(userId); 
        this.#validateRole(role); 
        
        const user = await this.getUserById(userId); 
        user.role = role; 

        const saved = await this.userRepository.save(user); 
        
        if (!saved) { 
            throw new Error('Failed to update user'); 
        } 
        
        return this.getUserById(user.id);
    }

    /**
     * Updates account password after optional current password verification.
     * @param {Object} params - Password update data.
     * @param {number|string} params.userId - Target user ID.
     * @param {string} params.newPassword - New plaintext password.
     * @param {string} params.newPasswordConfirmation - Password confirmation.
     * @param {string|null} [params.oldPassword=null] - Current password for authorization.
     * @returns {Promise<boolean>} True if update succeeded.
     * @throws {Error} If passwords mismatch, criteria aren't met, or old password is incorrect.
     */
    async changePassword({
        userId,
        newPassword,
        newPasswordConfirmation,
        oldPassword = null
    }) {
        this.#validateId(userId);
        
        if (!newPassword 
            || typeof newPassword !== 'string' 
            || newPassword.length < 8
        ) {
            throw new Error('Password must contain at least 8 characters');        
        }

        if (newPassword !== newPasswordConfirmation) { 
            throw new Error('Passwords do not match'); 
        }

        const user = await this.userRepository.getById(userId);

        if (oldPassword !== null) {
            const isValid = await bcrypt.compare(
                oldPassword,
                user.passwordHash
            );

            if (!isValid) {
                throw new Error('Invalid current password');
            }
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        return this.userRepository.updatePassword(userId, passwordHash);
    }

    /**
     * Compares plain password with user's stored password hash.
     * @param {User} user - User entity instance.
     * @param {string} password - Plaintext password to verify.
     * @returns {Promise<boolean>} True if valid match, false otherwise.
     */
    async verifyPassword(user, password) {
        if (!user || !user.passwordHash) { 
            return false; 
        } 
        
        return bcrypt.compare(password, user.passwordHash);
    }

    /**
     * Sets user's email status to confirmed.
     * @param {number|string} userId - User ID.
     * @returns {Promise<boolean>} True if email is confirmed or successfully set.
     */
    async confirmEmail(userId) { 
        this.#validateId(userId); 
        
        const user = await this.getUserById(userId); 
        if (user.emailConfirmed) { 
            return true; 
        } 
        
        return this.userRepository.confirmEmail(userId); 
    }

    /**
     * Updates avatar file path for a user with authorization checks.
     * @param {Object} params - Avatar upload options.
     * @param {number|string} params.userId - Target user ID.
     * @param {string} params.avatarPath - System or public path to uploaded image.
     * @param {number|string} params.currentUserId - ID of user making request.
     * @param {string} params.currentUserRole - Role of user making request.
     * @returns {Promise<User>} Updated user entity.
     * @throws {Error} If permissions are invalid or update fails.
     */
    async updateAvatar({
        userId,
        avatarPath,
        currentUserId,
        currentUserRole
    }) {
        this.#validateId(userId);
        this.#validateId(currentUserId);
        this.#validateRole(currentUserRole);

        const isOwner = Number(userId) === Number(currentUserId); 
        const isAdmin = currentUserRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new Error('Forbidden');
        }

        if (!avatarPath || typeof avatarPath !== 'string') { 
            throw new Error('Avatar path is required'); 
        }

        const updated = await this.userRepository.uploadAvatar(userId, avatarPath);

        if (!updated) {
            throw new Error('User not found');
        }

        return this.getUserById(userId);
    }

    /**
     * Permanently removes a user record by ID.
     * @param {number|string} userId - User ID to delete.
     * @param {number|string} params.currentUserId - ID of user making request.
     * @param {string} params.currentUserRole - Role of user making request.
     * @returns {Promise<boolean>} True if record was deleted.
     * @throws {Error} If user is not found.
     */
    async deleteUser({
        userId,
        currentUserId,
        currentUserRole
    }) {
        this.#validateId(userId);

        const isOwner = Number(userId) === Number(currentUserId); 
        const isAdmin = currentUserRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new Error('Forbidden');
        }

        const user = await this.userRepository.getById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        return this.userRepository.deleteUser(userId);
    }

    /**
     * Validates integer database ID.
     * @private
     * @param {any} id - Value to validate.
     * @throws {Error} If value is not a positive integer.
     */
    #validateId(id) { 
        if (id === undefined 
            || id === null 
            || !Number.isInteger(Number(id)) 
            || Number(id) <= 0 
        ) { 
            throw new Error('Invalid ID'); 
        } 
    }

    /**
     * Validates full registration payload.
     * @private
     * @param {Object} params
     * @throws {Error} If any field validation fails.
     */
    #validateRegistrationData({
        login, 
        password, 
        passwordConfirmation, 
        fullName, 
        email 
    }) {
        this.#validateLogin(login); 
        this.#validateEmail(email); 
        //this.#validateFullName(fullName);

        if (!password 
            || typeof password !== 'string'
            || password.length < 8
        ) {
            throw new Error('Password must contain at least 8 characters');
        }

        if (password !== passwordConfirmation) { 
            throw new Error('Passwords do not match'); 
        }
    }

    /**
     * Validates login field format and length.
     * @private
     * @param {string} login
     * @throws {Error} If length or character requirements are missed.
     */
    #validateLogin(login) {
        if (!login || typeof login !== 'string' 
            || login.trim().length < 3 
            || login.trim().length > 50 
        ) { 
            throw new Error('Login must contain from 3 to 50 characters'); 
        } 
        
        if (!/^[a-zA-Z0-9_.-]+$/.test(login.trim())) { 
            throw new Error('Login contains invalid characters'); 
        }
    }

    /**
     * Validates email format and max length.
     * @private
     * @param {string} email
     * @throws {Error} If format is invalid or too long.
     */
    #validateEmail(email) {
        if (!email || typeof email !== 'string' || email.trim().length < 5) {
            throw new Error('Email is required');
        } 
        
        const normalizedEmail = email.trim().toLowerCase(); 
        if (normalizedEmail.length > 255) { 
            throw new Error('Email is too long'); 
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
        if (!emailRegex.test(normalizedEmail)) { 
            throw new Error('Invalid email format'); 
        }
    }

    /**
     * Validates user full name length.
     * @private
     * @param {string} fullName
     * @throws {Error} If string length is out of range (2-100 chars).
     */
    #validateFullName(fullName) {
        if (!fullName || typeof fullName !== 'string'
            || fullName.trim().length < 2
            || fullName.trim().length > 100
        ) {
            throw new Error('Full name must contain from 2 to 100 characters');
        }
    }

    /**
     * Validates system user role.
     * @private
     * @param {string} role
     * @throws {Error} If role is not 'user' or 'admin'.
     */
    #validateRole(role) {
        if (!['user', 'admin'].includes(role)) {
            throw new Error('Role must be either user or admin');
        }
    }

    /**
     * Checks if login is available.
     * @private
     * @param {string} login
     * @returns {Promise<void>}
     * @throws {Error} If login is already taken.
     */
    async #ensureLoginIsUnique(login) {
        const foundUser = await this.userRepository.findBy(
            'login',
            login.trim()
        );

        if (foundUser) {
            throw new Error('Login is already taken');
        }
    }

    /**
     * Checks if email address is available.
     * @private
     * @param {string} email
     * @returns {Promise<void>}
     * @throws {Error} If email is already taken.
     */
    async #ensureEmailIsUnique(email) {
        const normalizedEmail = email.trim().toLowerCase();

        const foundUser = await this.userRepository.findBy(
            'email',
            normalizedEmail
        );

        if (foundUser) {
            throw new Error('Email is already taken');
        }
    }
}

module.exports = UserService;