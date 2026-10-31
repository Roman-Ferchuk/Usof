/**
 * Controller for admin-only read endpoints and helper actions used by the admin panel.
 */
class AdminController {
    /** @param {AdminService} adminService */
    constructor(adminService) {
        this.adminService = adminService;
    }

    /** @route GET /api/admin/stats */
    getStats(req, res) { return this.#run(res, () => this.adminService.getStats()); }

    /** @route GET /api/admin/users */
    listUsers(req, res) { return this.#run(res, () => this.adminService.listUsers(req.query)); }

    /** @route GET /api/admin/posts */
    listPosts(req, res) { return this.#run(res, () => this.adminService.listPosts(req.query)); }

    /** @route GET /api/admin/comments */
    listComments(req, res) { return this.#run(res, () => this.adminService.listComments(req.query)); }

    /** @route GET /api/admin/likes */
    listLikes(req, res) { return this.#run(res, () => this.adminService.listLikes(req.query)); }

    /** @route DELETE /api/admin/likes/:like_id */
    deleteLike(req, res) {
        return this.#run(res, async () => {
            await this.adminService.deleteLike(req.params.like_id);
            return { message: 'Like successfully removed' };
        });
    }

    /** @route PATCH /api/admin/users/:user_id/password */
    setUserPassword(req, res) {
        return this.#run(res, async () => {
            await this.adminService.setUserPassword(req.params.user_id, {
                newPassword: req.body.newPassword,
                newPasswordConfirmation: req.body.newPasswordConfirmation
            });
            return { message: 'Password updated' };
        });
    }

    /** @route PATCH /api/admin/users/:user_id/confirm-email */
    confirmUserEmail(req, res) {
        return this.#run(res, () => this.adminService.confirmUserEmail(req.params.user_id));
    }

    async #run(res, action) {
        try {
            return res.status(200).json(await action());
        } catch (error) {
            const status = error.status
                || (error.message === 'User not found' ? 404 : 400);
            return res.status(status).json({ error: error.message });
        }
    }
}

module.exports = AdminController;
