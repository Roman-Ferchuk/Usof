/* Dev-server proxy (replaces `server.proxy` from the old vite.config.js).
   CRA picks this file up automatically; it must be CommonJS.
   The usof API (and its /admin panel and /uploads) runs on port 3000.
   Another address: API_URL=http://host:port npm start */
const { createProxyMiddleware } = require('http-proxy-middleware');

const API = process.env.API_URL || 'http://localhost:3000';

module.exports = function setupProxy(app) {
  // /api/* and /uploads/*
  app.use(createProxyMiddleware(['/api', '/uploads'], { target: API }));
  // the old stand-alone admin panel served by the API: /admin and /admin/...
  // (the in-app panel lives at /#/admin, so only a real path /admin goes to the API)
  app.use(createProxyMiddleware((pathname) => /^\/admin(\/|$)/.test(pathname), { target: API }));
};
