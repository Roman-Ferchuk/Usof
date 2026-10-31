const HttpError = require('../errors/HttpError');

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 15;

/**
 * Business logic of the admin read-API: query normalisation and admin-only helper actions.
 */
class AdminService {
    /**
     * @param {AdminRepository} adminRepository
     * @param {UserService} userService - reused for password change / email confirmation.
     */
    constructor(adminRepository, userService) {
        this.adminRepository = adminRepository;
        this.userService = userService;
    }

    async getStats() {
        return this.adminRepository.getStats();
    }

    async listUsers(query) {
        return this.#paged(query, ({ limit, offset }) => this.adminRepository.listUsers({
            q: this.#text(query.q),
            role: this.#oneOf(query.role, ['user', 'admin'], 'role'),
            emailConfirmed: this.#bool(query.emailConfirmed, 'emailConfirmed'),
            limit, offset
        }));
    }

    async listPosts(query) {
        return this.#paged(query, ({ limit, offset }) => this.adminRepository.listPosts({
            q: this.#text(query.q),
            status: this.#oneOf(query.status, ['active', 'inactive'], 'status'),
            locked: this.#bool(query.locked, 'locked'),
            categoryId: this.#id(query.categoryId, 'categoryId'),
            authorId: this.#id(query.authorId, 'authorId'),
            limit, offset
        }));
    }

    async listComments(query) {
        return this.#paged(query, ({ limit, offset }) => this.adminRepository.listComments({
            q: this.#text(query.q),
            status: this.#oneOf(query.status, ['active', 'inactive'], 'status'),
            locked: this.#bool(query.locked, 'locked'),
            postId: this.#id(query.postId, 'postId'),
            authorId: this.#id(query.authorId, 'authorId'),
            limit, offset
        }));
    }

    async listLikes(query) {
        return this.#paged(query, ({ limit, offset }) => this.adminRepository.listLikes({
            type: this.#oneOf(query.type, ['like', 'dislike'], 'type'),
            target: this.#oneOf(query.target, ['post', 'comment'], 'target'),
            postId: this.#id(query.postId, 'postId'),
            commentId: this.#id(query.commentId, 'commentId'),
            authorId: this.#id(query.authorId, 'authorId'),
            limit, offset
        }));
    }

    async deleteLike(likeId) {
        const id = this.#id(likeId, 'like_id');
        if (!id) throw new HttpError(400, 'Invalid like ID');

        const deleted = await this.adminRepository.deleteLike(id);
        if (!deleted) throw new HttpError(404, 'Like not found');
    }

    async setUserPassword(userId, { newPassword, newPasswordConfirmation }) {
        const id = this.#id(userId, 'user_id');
        if (!id) throw new HttpError(400, 'Invalid user ID');

        await this.userService.getUserById(id);
        await this.userService.changePassword({ userId: id, newPassword, newPasswordConfirmation });
    }

    async confirmUserEmail(userId) {
        const id = this.#id(userId, 'user_id');
        if (!id) throw new HttpError(400, 'Invalid user ID');

        await this.userService.confirmEmail(id);
        return this.userService.getUserById(id);
    }

    async #paged(query, fetcher) {
        const page = this.#int(query.page, 1, 1, Number.MAX_SAFE_INTEGER, 'page');
        const limit = this.#int(query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT, 'limit');
        const { total, rows } = await fetcher({ limit, offset: (page - 1) * limit });

        return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)), data: rows };
    }

    #text(value) {
        if (value === undefined || value === '') return undefined;
        return String(value).trim().slice(0, 100) || undefined;
    }

    #oneOf(value, allowed, name) {
        if (value === undefined || value === '') return undefined;
        if (!allowed.includes(value)) throw new HttpError(400, `${name} must be one of: ${allowed.join(', ')}`);
        return value;
    }

    #bool(value, name) {
        if (value === undefined || value === '') return undefined;
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new HttpError(400, `${name} must be true or false`);
    }

    #id(value, name) {
        if (value === undefined || value === '') return undefined;
        const n = Number(value);
        if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${name} must be a positive integer`);
        return n;
    }

    #int(value, fallback, min, max, name) {
        if (value === undefined || value === '') return fallback;
        const n = Number(value);
        if (!Number.isInteger(n) || n < min || n > max) {
            throw new HttpError(400, `${name} must be an integer between ${min} and ${max === Number.MAX_SAFE_INTEGER ? '∞' : max}`);
        }
        return n;
    }
}

module.exports = AdminService;
