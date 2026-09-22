const bcrypt = require('bcrypt');

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async getAllUsers() {
        return this.userRepository.getAll();
    }

    async getUserById(userId) { 
        this.#validateId(userId); 
        
        const user = await this.userRepository.getById(userId); 
        
        if (!user) { 
            throw new Error('User not found'); 
        } 
        
        return user; 
    }

    async getUserByLoginOrEmail(identifier) { 
        if (!identifier || typeof identifier !== 'string') {
            throw new Error('Login or email is required'); 
        } 
        
        return this.userRepository.getByLoginOrEmail(identifier.trim()); 
    }

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
        })

        this.#validateRole(role);

        this.#ensureLoginIsUnique(login);
        this.#ensureEmailIsUnique(email);

        const passwordHash = await bcrypt.hash(password, 12);

        const userId = await this.userRepository.createUser({
            login,
            passwordHash,
            fullName,
            email,
            role
        });

        return this.userRepository.getById(userId);
    }

    async register({
        login, 
        password, 
        passwordConfirmation, 
        fullName, 
        email, 
        role = 'user' 
    }) {
        return this.createUser({
            login, 
            password, 
            passwordConfirmation, 
            fullName, 
            email, 
            role
        });
    }

    async updateProfile({
        userId,
        data,
        curentUserId,
        currentUserRole
    }) {
        this.#validateId(userId);
        this.#validateId(curentUserId);
        this.#validateRole(currentUserRole);

        const isOwner = Number(userId) === Number(currentUserId); 
        const isAdmin = currentUserRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new Error('Forbidden');
        }

        const user = this.userRepository.getById(userId);

        if (data.login !== undefined) {
            this.#validateLogin(data.login);

            if (data.login.trim() !== user.login) {
                await this.#ensureLoginIsUnique(data.login);
                user.login = data.login.trim();
            }
        }

        if (data.email !== undefined) {
            this.#validateEmail(user.email);
            const email = data.email.trim().toLowerCase();

            if (email !== user.email) {
                await this.#ensureEmailIsUnique(email);
                user.email = data.email;
                user.emailConfirmed = false;
            }
        }

        if (data.fullName !== undefined) {
            this.#validateFullName(user.fullName);

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
            throw new Error( 'Password must contain at least 8 characters' );        
        }

        if (newPassword !== newPasswordConfirmation) { 
            throw new Error('Passwords do not match'); 
        }

        const user = await this.userRepository.getById(userId);

        if (oldPassword !== null) {
            const isValid = bcrypt.compare(
                oldPassword,
                user.password
            );

            if (!isValid) {
                throw new Error('Invalid current password');
            }
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        return this.userRepository.updatePassword(userId, passwordHash);
    }

    async verifyPassword(user, password) {
        if (!user || !user.passwordHash) { 
            return false; 
        } 
        
        return bcrypt.compare(password, user.passwordHash);
    }

    async confirmEmail(userId) { 
        this.#validateId(userId); 
        
        const user = await this.getUserById(userId); 
        if (user.emailConfirmed) { 
            return true; 
        } 
        
        return this.userRepository.confirmEmail(userId); 
    }

    async updateAvatar({
        userId,
        avatarPath,
        curentUserId,
        currentUserRole
    }) {
        this.#validateId(userId);
        this.#validateId(curentUserId);
        this.#validateRole(currentUserRole);

        const isOwner = Number(userId) === Number(currentUserId); 
        const isAdmin = currentUserRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new Error('Forbidden');
        }

        if (!avatarPath || typeof avatarPath !== 'string') { 
            throw new Error('Avatar path is required'); 
        }

        const updated = this.userRepository.uploadAvatar(userId, avatarPath);

        if (!updated) {
            throw new Error('User not found')
        }

        return this.getUserById(userId);
    }

    async deleteUser(userId) {
        this.#validateId(userId);

        const user = await this.userRepository.getById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        return this.userRepository.deleteUser(userId);
    }

    #validateId(id) { 
        if ( id === undefined 
            || id === null 
            || !Number.isInteger(Number(id)) 
            || Number(id) <= 0 
        ) { 
            throw new Error('Invalid user ID'); 
        } 
    }

    #validateRegistrationData({
        login, 
        password, 
        passwordConfirmation, 
        fullName, 
        email 
    }) {
        this.#validateLogin(login); 
        this.#validateEmail(email); 
        this.#validateFullName(fullName);

        if (!password 
            || typeof password != 'string'
            || password.length < 8
        ) {
            throw new Error('Password must contain at least 8 characters' );
        }

        if (password !== passwordConfirmation) { 
            throw new Error('Passwords do not match'); 
        }
    }

    #validateLogin(login) {
        if (!login || typeof login !== 'string' 
            || login.trim().length < 3 
            || login.trim().length > 50 
        ) { 
            throw new Error('Login must contain from 3 to 50 characters' ); 
        } 
        
        if (!/^[a-zA-Z0-9_.-]+$/.test(login.trim())) { 
            throw new Error( 'Login contains invalid characters' ); 
        }
    }

    #validateEmail(email) {
        if (!email || typeof email != 'string' || email.trim().length < 5) {
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

    #validateFullName(fullName) {
        if (!fullName || typeof fullName != 'string'
            || fullName.trim().length < 2
            || fullName.trim().length > 100
        ) {
            throw new Error('Full name must contain from 2 to 100 characters');
        }

        // if (!/^A-Z[a-z]+ A-Z[a-z]+$/.test(fullName)) {
        //     throw new Error('Invalid full name format');
        // }
    }

    #validateRole(role) {
        if (!['user', 'admin'].includes(role)) {
            throw new Error( 'Role must be either user or admin' );
        }
    }

    async #ensureLoginIsUnique(login) {
        const foundUser = await this.userRepository.findBy(
            'login',
            login.trim()
        );

        if (foundUser) {
            throw new Error('Login is already taken');
        }
    }

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