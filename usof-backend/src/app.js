const express = require('express');

function createApp({
    userController,
    postController,
    categoryController,
    commentController,
    likeController
}) {
    const app = express();

    //app.use(express.json());

    // app.use('/api/users', userController.router);
    // app.use('/api/posts', postController.router);
    // app.use('/api/categories', categoryController.router);
    // app.use('/api/comments', commentController.router);
    // app.use('/api/likes', likeController.router);

    return app;
}

module.exports = createApp;