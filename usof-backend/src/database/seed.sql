USE usof_database;

-- Очищення перед заповненням (у зворотному порядку відносно FK)
DELETE FROM post_subscriptions;
DELETE FROM favorites;
DELETE FROM likes;
DELETE FROM comments;
DELETE FROM post_categories;
DELETE FROM categories;
DELETE FROM post_images;
DELETE FROM posts;
DELETE FROM users;

-- 1. Користувачі (паролі для тестування хешовані як bcrypt або mock-хеш)
INSERT INTO users (id, login, password_hash, full_name, email, email_confirmed, profile_picture, rating, role) VALUES
(1, 'admin_alex', '$2b$10$abcdefghijklmnopqrstuuu1234567890', 'Alex Johnson', 'romanferchuk5@gmail.com', TRUE, 'admin_avatar.png', 10, 'admin'),
(2, 'code_master', '$2b$10$abcdefghijklmnopqrstuuu1234567890', 'John Doe', 'john.doe@example.com', TRUE, 'john.png', 15, 'user'),
(3, 'dev_girl', '$2b$10$abcdefghijklmnopqrstuuu1234567890', 'Anna Smith', 'anna.smith@example.com', TRUE, 'anna.png', 8, 'user'),
(4, 'backend_guy', '$2b$10$abcdefghijklmnopqrstuuu1234567890', 'Mike Brown', 'mike.b@example.com', TRUE, 'mike.png', 2, 'user'),
(5, 'newbie_dev', '$2b$10$abcdefghijklmnopqrstuuu1234567890', 'Sarah Connor', 'sarah.c@example.com', FALSE, 'default-avatar.png', 0, 'user');

-- 2. Категорії
INSERT INTO categories (id, title, description) VALUES
(1, 'Node.js', 'Всі питання, пов’язані з розробкою на Node.js та Express'),
(2, 'MySQL', 'Реляційні бази даних, SQL-запити та оптимізація'),
(3, 'JavaScript', 'Базові та просунуті питання з мови JavaScript'),
(4, 'Architecture', 'Паттерни проектування, REST API та системна архітектура'),
(5, 'DevOps', 'CI/CD, Docker, розгортання та налаштування серверів');

-- 3. Пости
INSERT INTO posts (id, author_id, title, publish_date, status, locked, content) VALUES
(1, 2, 'Як оптимізувати складні SQL JOIN запити в MySQL?', '2026-09-01 10:00:00', 'active', FALSE, 'Привіт! Маю декілька великих таблиць і запити з JOIN працюють повільно. Які індекси найкраще використовувати?'),
(2, 3, 'Express.js middleware: як правильно обробляти помилки?', '2026-09-02 12:30:00', 'active', FALSE, 'Підкажіть кращі практики створення кастомного error handling middleware в Express.'),
(3, 4, 'Різниця між Arrow Functions та звичайними функціями в JS', '2026-09-05 14:15:00', 'active', FALSE, 'Не можу повністю розібратися з контекстом this у стрілкових функціях. Поясніть на прикладах.'),
(4, 1, 'Правила спільноти та гайдлайн з оформлення постів', '2026-09-10 09:00:00', 'active', TRUE, 'Будь ласка, дотримуйтесь правил при створенні тем та відповідей на форумі.'),
(5, 5, 'Як задеплоїти Node.js додаток на Ubuntu сервер?', '2026-09-15 16:45:00', 'inactive', FALSE, 'Тестовий черновик поста про деплой за допомогою PM2 та Nginx.');

-- 4. Фотографії для постів
INSERT INTO post_images (id, post_id, image_path, position) VALUES
(1, 1, 'uploads/posts/query_explain.png', 1),
(2, 1, 'uploads/posts/database_schema.png', 2),
(3, 2, 'uploads/posts/middleware_flow.png', 1),
(4, 3, 'uploads/posts/this_binding_diagram.png', 1),
(5, 5, 'uploads/posts/nginx_config_sample.png', 1);

-- 5. Зв’язки постів та категорій (post_categories)
INSERT INTO post_categories (post_id, category_id) VALUES
(1, 2), -- SQL запити -> MySQL
(1, 4), -- SQL запити -> Architecture
(2, 1), -- Express -> Node.js
(3, 3), -- Arrow functions -> JavaScript
(4, 4), -- Правила -> Architecture
(5, 1), -- Деплой -> Node.js
(5, 5); -- Деплой -> DevOps

-- 6. Коментарі (включаючи вкладені репліки)
INSERT INTO comments (id, post_id, author_id, parent_id, publish_date, status, locked, content) VALUES
(1, 1, 1, NULL, '2026-09-01 10:15:00', 'active', FALSE, 'Використовуйте EXPLAIN перед запитом, щоб побачити які індекси застосовуються.'),
(2, 1, 2, 1, '2026-09-01 10:30:00', 'active', FALSE, 'Дякую! EXPLAIN показал, що робиться Full Table Scan.'),
(3, 2, 4, NULL, '2026-09-02 13:00:00', 'active', FALSE, 'Обов’язково передавайте 4 аргументи в middleware: (err, req, res, next).'),
(4, 3, 3, NULL, '2026-09-05 15:00:00', 'active', FALSE, 'Стрілкові функції беруть this з зовнішнього лексичного оточення.'),
(5, 1, 3, NULL, '2026-09-06 11:20:00', 'active', FALSE, 'Також зверніть увагу на композитні індекси для кількох колонок.');

-- 7. Лайки (до постів та коментарів)
INSERT INTO likes (id, author_id, type, publish_date, post_id, comment_id) VALUES
(1, 1, 'like', '2026-09-01 10:05:00', 1, NULL),
(2, 3, 'like', '2026-09-01 10:10:00', 1, NULL),
(3, 2, 'like', '2026-09-01 10:20:00', NULL, 1),
(4, 4, 'like', '2026-09-02 13:05:00', NULL, 3),
(5, 5, 'dislike', '2026-09-05 16:00:00', 3, NULL);

-- 8. Улюблені пости (favorites)
INSERT INTO favorites (user_id, post_id, created_at) VALUES
(2, 2, '2026-09-02 14:00:00'),
(2, 4, '2026-09-10 10:00:00'),
(3, 1, '2026-09-01 11:00:00'),
(4, 1, '2026-09-02 09:30:00'),
(5, 3, '2026-09-06 08:00:00');

-- 9. Підписки на пости (post_subscriptions)
INSERT INTO post_subscriptions (user_id, post_id, created_at) VALUES
(1, 1, '2026-09-01 10:00:00'),
(3, 1, '2026-09-01 11:00:00'),
(2, 2, '2026-09-02 12:35:00'),
(4, 2, '2026-09-02 13:10:00'),
(5, 3, '2026-09-05 14:20:00');