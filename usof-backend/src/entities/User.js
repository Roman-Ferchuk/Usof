const BaseEntity = require('./BaseEntity');

const UserRole = Object.freeze({
    USER: 'user',
    ADMIN: 'admin'
});

class User extends BaseEntity {
    constructor({
        id = null,
        login,
        passwordHash,
        fullName,
        email,
        emailConfirmed = false,
        profilePicture = 'default-avatar.png',
        rating = 0,
        role = UserRole.USER
    }) {
        super(id);

        this.login = login;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.email = email;
        this.emailConfirmed = emailConfirmed;
        this.profilePicture = profilePicture;
        this.rating = rating;
        this.role = role;

        this.validate();
    }

    validate() {
        if (!this.login || this.login.trim().length === 0) {
            throw new Error('Login is required');
        }

        if (this.login.length > 45) {
            throw new Error('Login must not exceed 45 characters');
        }

        if (!this.passwordHash) {
            throw new Error('Password hash is required');
        }

        if (!this.fullName || this.fullName.trim().length === 0) {
            throw new Error('Full name is required');
        }

        if (!this.email || !this.email.includes('@')) {
            throw new Error('Invalid email');
        }

        if (this.rating < 0) {
            throw new Error('Rating cannot be negative');
        }

        if (!Object.values(UserRole).includes(this.role)) {
            throw new Error('Invalid user role');
        }
    }

    changePassword(passwordHash) {
        if (!passwordHash) {
            throw new Error('Password hash is required');
        }

        this.passwordHash = passwordHash;
    }

    changeFullName(fullName) {
        if (!fullName || fullName.trim().length === 0) {
            throw new Error('Full name is required');
        }

        this.fullName = fullName;
    }

    changeProfilePicture(profilePicture) {
        if (!profilePicture) {
            throw new Error('Profile picture is required');
        }

        this.profilePicture = profilePicture;
    }

    confirmEmail() {
        this.emailConfirmed = true;
    }

    changeRole(role) {
        if (!Object.values(UserRole).includes(role)) {
            throw new Error('Invalid user role');
        }

        this.role = role;
    }

    addRating(points) {
        if (typeof points !== 'number') {
            throw new Error('Rating points must be a number');
        }

        this.rating += points;
    }

    getPasswordHash() {
        return this.passwordHash;
    }
}

module.exports = {
    User,
    UserRole
};