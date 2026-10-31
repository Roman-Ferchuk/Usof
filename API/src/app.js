const path = require('path');
const express = require('express');
const { securityHeaders, rateLimit } = require('./middlewares/securityMiddleware');

function createApp({
    authRouter,
    userRouter,
    postRouter,
    commentRouter,
    categoryRouter,
    favoriteRouter,
    adminRouter,
    statsRouter
}) {
    const app = express();

    app.disable('x-powered-by');
    app.use(securityHeaders);
    app.use(express.json({ limit: '100kb' }));
    app.use((req, res, next) => {
        if (req.body === undefined) req.body = {};
        next();
    });

    // 50 attempts per 10 minutes per IP for the endpoints that can be brute-forced or spammed
    const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 50 });
    app.use(['/api/auth/login', '/api/auth/register', '/api/auth/password-reset'], authLimiter);

    app.use('/api', statsRouter);
    app.use('/api', favoriteRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
    app.use('/api/posts', postRouter);
    app.use('/api/categories', categoryRouter);
    app.use('/api/comments', commentRouter);
    app.use('/api/admin', adminRouter);
    // Admin panel (static SPA). Data is protected by the API: every /api/admin call needs an admin JWT.
    app.use('/admin', express.static(path.join(__dirname, 'admin')));
    app.use('/uploads', express.static('uploads', { dotfiles: 'ignore', index: false }));

    app.use((req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });

    app.use((err, req, res, next) => {
        if (err.name === 'MulterError' || err.message?.startsWith('Invalid file type')) {
            return res.status(400).json({ error: err.message });
        }
        if (err.type === 'entity.parse.failed') {
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
        console.error(err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    });

    return app;
}

module.exports = createApp;