const express = require('express');

function createApp({
    authRouter,
    userRouter,
    postRouter,
    commentRouter,
    categoryRouter
}) {
    const app = express();

    app.use(express.json());

    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/posts', postRouter);
    app.use('/api/categories', categoryRouter);
    app.use('/api/comments', commentRouter);
    app.use('/uploads', express.static('uploads'));

    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    });

    return app;
}

module.exports = createApp;