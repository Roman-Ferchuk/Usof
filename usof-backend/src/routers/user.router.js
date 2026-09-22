function createUserRouter(userController) {
    const router = require("express").Router();

    router.get("/", userController.getAll);
    // Add more routes as needed

    return router;
}

module.exports = createUserRouter;