CREATE DATABASE IF NOT EXISTS usof_database;

-- 1. Таблиця користувачів
CREATE TABLE IF NOT EXISTS usof_database.users (
    id INT NOT NULL AUTO_INCREMENT,
    login VARCHAR(45) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(45) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    profile_picture VARCHAR(255) DEFAULT 'default-avatar.png',
    rating INT NOT NULL DEFAULT 0,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',

    PRIMARY KEY (id)
);

-- 2. Таблиця постів
CREATE TABLE IF NOT EXISTS usof_database.posts (
    id INT NOT NULL AUTO_INCREMENT,
    author_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    content TEXT NOT NULL,

    PRIMARY KEY (id),
    FOREIGN KEY (author_id) REFERENCES usof_database.users(id) ON DELETE CASCADE
);

-- 3. Таблиця фотографій для постів
CREATE TABLE IF NOT EXISTS usof_database.post_images (
    id INT NOT NULL AUTO_INCREMENT,
    post_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    position INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    FOREIGN KEY (post_id) REFERENCES usof_database.posts(id) ON DELETE CASCADE
);

-- 4. Таблиця категорій
CREATE TABLE IF NOT EXISTS usof_database.categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

-- 5. Проміжна таблиця для зв'язку "Багато-до-Багатьох" (posts <-> categories)
CREATE TABLE IF NOT EXISTS usof_database.post_categories (
    post_id INT NOT NULL,
    category_id INT NOT NULL,

    PRIMARY KEY (post_id, category_id), 
    FOREIGN KEY (post_id) REFERENCES usof_database.posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES usof_database.categories(id) ON DELETE CASCADE
);

-- 6. Таблиця коментарів (Виправлено синтаксис та додано status)
CREATE TABLE IF NOT EXISTS usof_database.comments (
    id INT NOT NULL AUTO_INCREMENT,
    post_id INT NOT NULL,
    author_id INT NOT NULL,
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    content TEXT NOT NULL,

    PRIMARY KEY (id),
    FOREIGN KEY (post_id)
        REFERENCES usof_database.posts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (author_id)
        REFERENCES usof_database.users(id)
        ON DELETE CASCADE
);

-- 7. Таблиця лайків
CREATE TABLE IF NOT EXISTS usof_database.likes (
    id INT NOT NULL AUTO_INCREMENT,
    author_id INT NOT NULL,
    type ENUM('like', 'dislike') NOT NULL,
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    post_id INT DEFAULT NULL,
    comment_id INT DEFAULT NULL,

    PRIMARY KEY (id),
    FOREIGN KEY (author_id) REFERENCES usof_database.users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES usof_database.posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES usof_database.comments(id) ON DELETE CASCADE,

    CONSTRAINT check_like_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),

    UNIQUE KEY unique_user_post_like (author_id, post_id),
    UNIQUE KEY unique_user_comment_like (author_id, comment_id)
);