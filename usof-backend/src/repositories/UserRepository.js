const { User } = require('../entities/User');

class UserRepository {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Maps database row object to User entity instance.
     * @private
     */
    #mapToEntity(row) {
        if (!row) return null;
        return new User({
            id: row.id,
            login: row.login,
            passwordHash: row.password_hash,
            fullName: row.full_name,
            email: row.email,
            emailConfirmed: Boolean(row.email_confirmed),
            profilePicture: row.profile_picture,
            rating: row.rating,
            role: row.role
        });
    }

    /**
     * Gets all registered users from database.
     * @returns {Promise<User[]>} Array of User entities.
     */
    async getAll() {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, login, password_hash, full_name, email, email_confirmed, profile_picture, rating, role
                 FROM usof_database.users`
            );

            return rows.map(row => this.#mapToEntity(row));
        } catch (error) {
            console.error('[UserRepository.getAll] Error fetching users: ', error.message);
            throw error;
        }
    }

    /**
     * Finds a single user by a specific column and value.
     * @param {string} column - The database column name (e.g., 'id', 'login', 'email').
     * @param {any} value - The value to search for.
     * @returns {Promise<User|null>} The user entity instance if found, otherwise null.
     */
    async findBy(column, value) {
        const allowedColumns = ['id', 'login', 'email'];
        if (!allowedColumns.includes(column)) {
            throw new Error(`[UserRepository.findBy] Invalid search column: ${column}`);
        }

        try {
            const [rows] = await this.pool.query(
                `SELECT id, login, password_hash, full_name, email, email_confirmed, profile_picture, rating, role
                 FROM usof_database.users
                 WHERE ${column} = ?`,
                [value]
            );

            return this.#mapToEntity(rows[0]);
        } catch (error) {
            console.error(`[UserRepository.findBy] Error fetching user by ${column}: `, error.message);
            throw error;
        }
    }

    /**
     * Gets user by ID.
     * @param {number} id - User ID.
     * @returns {Promise<User|null>}
     */
    async getById(id) {
        return this.findBy('id', id);
    }

    /**
     * Gets user by login or email.
     * @param {string} identifier - Login or Email.
     * @returns {Promise<User|null>}
     */
    async getByLoginOrEmail(identifier) {
        try {
            const [rows] = await this.pool.query(
                `SELECT id, login, password_hash, full_name, email, email_confirmed, profile_picture, rating, role
                 FROM usof_database.users
                 WHERE login = ? OR email = ?`,
                [identifier, identifier]
            );

            return this.#mapToEntity(rows[0]);
        } catch (error) {
            console.error('[UserRepository.getByLoginOrEmail] Error fetching user: ', error.message);
            throw error;
        }
    }

    /**
     * Creates a new user record.
     * @param {Object} userData
     * @returns {Promise<number>} ID of newly created user.
     */
    async create({ login, passwordHash, fullName, email, role = 'user' }) {
        try {
            const [result] = await this.pool.query(
                `INSERT INTO usof_database.users (login, password_hash, full_name, email, role)
                 VALUES (?, ?, ?, ?, ?)`,
                [login, passwordHash, fullName, email, role]
            );

            return result.insertId;
        } catch (error) {
            console.error('[UserRepository.create] Error creating user: ', error.message);
            throw error;
        }
    }

    /**
     * Updates full user entity state in database.
     * @param {User} user 
     * @returns {Promise<boolean>}
     */
    async save(user) {
        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.users 
                 SET login = ?, password_hash = ?, full_name = ?, email = ?, email_confirmed = ?, profile_picture = ?, rating = ?, role = ?
                 WHERE id = ?`,
                [user.login, user.passwordHash, user.fullName, user.email, user.emailConfirmed, user.profilePicture, user.rating, user.role, user.id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[UserRepository.save] Error updating user: ', error.message);
            throw error;
        }
    }

    /**
     * Confirms user email.
     * @param {number} id - User ID.
     * @returns {Promise<boolean>}
     */
    async confirmEmail(id) {
        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.users
                 SET email_confirmed = TRUE
                 WHERE id = ?`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[UserRepository.confirmEmail] Error confirming email: ', error.message);
            throw error;
        }
    }

    /**
     * Updates user avatar image path.
     * @param {number} id - User ID.
     * @param {string} avatarPath 
     * @returns {Promise<boolean>}
     */
    async uploadAvatar(id, avatarPath) {
        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.users
                 SET profile_picture = ?
                 WHERE id = ?`,
                [avatarPath, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[UserRepository.uploadAvatar] Error uploading avatar: ', error.message);
            throw error;
        }
    }

    /**
     * Updates user password hash.
     * @param {number} id - User ID.
     * @param {string} passwordHash 
     * @returns {Promise<boolean>}
     */
    async updatePassword(id, passwordHash) {
        try {
            const [result] = await this.pool.query(
                `UPDATE usof_database.users
                 SET password_hash = ?
                 WHERE id = ?`,
                [passwordHash, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[UserRepository.updatePassword] Error updating password: ', error.message);
            throw error;
        }
    }

    /**
     * Deletes user record by ID.
     * @param {number} id - User ID.
     * @returns {Promise<boolean>}
     */
    async deleteUser(id) {
        try {
            const [result] = await this.pool.query(
                `DELETE FROM usof_database.users WHERE id = ?`,
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('[UserRepository.deleteUser] Error deleting user: ', error.message);
            throw error;
        }
    }
}

module.exports = UserRepository;