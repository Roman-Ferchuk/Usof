
-- Seed is executed only if the `users` table is empty (see initSeed.js)
-- Default password for all test users: Password123

-- 1. Users (passwords for testing are hashed with bcrypt
INSERT INTO usof_database.users (id, login, password_hash, full_name, email, email_confirmed, profile_picture, rating, role) VALUES
(1, 'admin_alex', '$2b$10$okV7B.bgcfW9ABzYPEf6ye5vqLaWAGm6fYUy.3f7bEvUPTihg0a6K', 'Alex Johnson', 'alex.johnson@example.com', TRUE, 'uploads/avatars/admin_avatar.png', 10, 'admin'),
(2, 'code_master', '$2b$10$okV7B.bgcfW9ABzYPEf6ye5vqLaWAGm6fYUy.3f7bEvUPTihg0a6K', 'Viktoriia Shaforostova', 'viktoriia.shaforostova@example.com', TRUE, 'uploads/avatars/viktoriia.png', 15, 'user'),
(3, 'dev_girl', '$2b$10$okV7B.bgcfW9ABzYPEf6ye5vqLaWAGm6fYUy.3f7bEvUPTihg0a6K', 'Mariia Mykhalchenko', 'mariia.mykhalchenko@example.com', TRUE, 'uploads/avatars/mariia.png', 8, 'user'),
(4, 'backend_guy', '$2b$10$okV7B.bgcfW9ABzYPEf6ye5vqLaWAGm6fYUy.3f7bEvUPTihg0a6K', 'Vladyslav Kasatonov', 'vladyslav.kasatonov@example.com', TRUE, 'uploads/avatars/vlad.png', 2, 'user'),
(5, 'dev', '$2b$10$okV7B.bgcfW9ABzYPEf6ye5vqLaWAGm6fYUy.3f7bEvUPTihg0a6K', 'Albina Milshyna', 'albina.milshyna@example.com', FALSE, 'uploads/avatars/albina.png', 0, 'user');
-- 2. Categories
INSERT INTO usof_database.categories (id, title, description) VALUES
(1, 'Node.js', 'All questions related to Node.js and Express development'),
(2, 'MySQL', 'Relational databases, SQL queries, and performance optimization'),
(3, 'JavaScript', 'Basic and advanced concepts of JavaScript language'),
(4, 'Architecture', 'Design patterns, REST API design, and system architecture'),
(5, 'DevOps', 'CI/CD pipelines, Docker containerization, and server deployment');

-- 3. Posts
INSERT INTO usof_database.posts (id, author_id, title, publish_date, status, locked, content) VALUES
(1, 2, 'How to optimize complex SQL JOIN queries in MySQL?', '2026-09-01 10:00:00', 'active', FALSE, 'Hi everyone! I have several large tables and JOIN queries are executing quite slowly. What indexes should I use?'),
(2, 3, 'Express.js middleware: How to handle errors properly?', '2026-09-02 12:30:00', 'active', FALSE, 'Could someone share best practices for creating custom error handling middleware in Express?'),
(3, 4, 'Difference between Arrow Functions and regular functions in JS', '2026-09-05 14:15:00', 'active', FALSE, 'I still struggle with understanding the `this` context in arrow functions. Could you explain it with examples?'),
(4, 1, 'Community rules and post formatting guidelines', '2026-09-10 09:00:00', 'active', TRUE, 'Please follow our community guidelines when creating new topics and replying to posts.'),
(5, 5, 'How to deploy a Node.js app on Ubuntu server?', '2026-09-15 16:45:00', 'inactive', FALSE, 'Draft guide on deploying Node.js apps using PM2 and Nginx reverse proxy.');

-- 4. Post Images
INSERT INTO usof_database.post_images (id, post_id, image_path, position) VALUES
(1, 1, 'uploads/posts/query_explain.png', 1),
(2, 1, 'uploads/posts/database_schema.png', 2),
(3, 2, 'uploads/posts/middleware_flow.png', 1),
(4, 3, 'uploads/posts/this_binding_diagram.png', 1),
(5, 5, 'uploads/posts/nginx_config_sample.png', 1);

-- 5. Post Categories (Many-to-Many junction)
INSERT INTO usof_database.post_categories (post_id, category_id) VALUES
(1, 2), -- SQL queries -> MySQL
(1, 4), -- SQL queries -> Architecture
(2, 1), -- Express -> Node.js
(3, 3), -- Arrow functions -> JavaScript
(4, 4), -- Rules -> Architecture
(5, 1), -- Deployment -> Node.js
(5, 5); -- Deployment -> DevOps

-- 6. Comments (including nested replies)
INSERT INTO usof_database.comments (id, post_id, author_id, parent_id, publish_date, status, locked, content) VALUES
(1, 1, 1, NULL, '2026-09-01 10:15:00', 'active', FALSE, 'Use EXPLAIN before your SQL query to inspect execution plans and used indexes.'),
(2, 1, 2, 1, '2026-09-01 10:30:00', 'active', FALSE, 'Thanks! EXPLAIN revealed that a Full Table Scan was happening.'),
(3, 2, 4, NULL, '2026-09-02 13:00:00', 'active', FALSE, 'Make sure to pass 4 arguments to your error middleware: (err, req, res, next).'),
(4, 3, 3, NULL, '2026-09-05 15:00:00', 'active', FALSE, 'Arrow functions inherit `this` from their surrounding lexical scope.'),
(5, 1, 3, NULL, '2026-09-06 11:20:00', 'active', FALSE, 'Also consider building composite indexes for queries covering multiple columns.');

-- 7. Likes (for posts and comments)
INSERT INTO usof_database.likes (id, author_id, type, publish_date, post_id, comment_id) VALUES
(1, 1, 'like', '2026-09-01 10:05:00', 1, NULL),
(2, 3, 'like', '2026-09-01 10:10:00', 1, NULL),
(3, 2, 'like', '2026-09-01 10:20:00', NULL, 1),
(4, 4, 'like', '2026-09-02 13:05:00', NULL, 3),
(5, 5, 'dislike', '2026-09-05 16:00:00', 3, NULL);

-- 8. Favorites
INSERT INTO usof_database.favorites (user_id, post_id, created_at) VALUES
(2, 2, '2026-09-02 14:00:00'),
(2, 4, '2026-09-10 10:00:00'),
(3, 1, '2026-09-01 11:00:00'),
(4, 1, '2026-09-02 09:30:00'),
(5, 3, '2026-09-06 08:00:00');

-- 9. Post Subscriptions
INSERT INTO usof_database.post_subscriptions (user_id, post_id, created_at) VALUES
(1, 1, '2026-09-01 10:00:00'),
(3, 1, '2026-09-01 11:00:00'),
(2, 2, '2026-09-02 12:35:00'),
(4, 2, '2026-09-02 13:10:00'),
(5, 3, '2026-09-05 14:20:00');

-- 10. Post Views (for statistics)
INSERT INTO usof_database.post_views (post_id, views) VALUES
(1, 142),
(2, 89),
(3, 56),
(4, 310),
(5, 12);

-- 11. Daily Views (for analytics chart/metrics)
INSERT INTO usof_database.daily_views (day, views) VALUES
('2026-10-25', 45),
('2026-10-26', 78),
('2026-10-27', 62),
('2026-10-28', 90),
('2026-10-29', 110),
('2026-10-30', 134);