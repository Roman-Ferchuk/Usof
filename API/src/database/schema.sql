CREATE DATABASE IF NOT EXISTS usof_database;

-- =========================================================================
-- 1. Users Table
-- Stores account information, credentials, roles, and profile details
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.users (
    id INT NOT NULL AUTO_INCREMENT, -- Unique identifier for the user
    login VARCHAR(45) NOT NULL UNIQUE, -- Unique username for login and profile display
    password_hash VARCHAR(255) NOT NULL, -- Bcrypt-hashed password (default: Password123)
    full_name VARCHAR(45) NOT NULL, -- User's first and last name
    email VARCHAR(255) NOT NULL UNIQUE, -- Unique user email address
    email_confirmed BOOLEAN NOT NULL DEFAULT FALSE, -- Flag indicating if email has been verified
    profile_picture VARCHAR(255) DEFAULT 'default-avatar.png', -- Path/URL to the user's avatar image
    rating INT NOT NULL DEFAULT 0, -- User reputation points based on activity and feedback
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user', -- System access role (standard user or administrator)

    PRIMARY KEY (id)
);

-- =========================================================================
-- 2. Posts Table
-- Stores main forum discussions, articles, and questions created by users
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.posts (
    id INT NOT NULL AUTO_INCREMENT, -- Unique identifier for the post
    author_id INT NOT NULL, -- ID of the user who created the post
    title VARCHAR(255) NOT NULL, -- Title/headline of the post
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the post was published
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active', -- Publication status (published or draft/inactive)
    locked BOOLEAN NOT NULL DEFAULT FALSE, -- Flag indicating if the post is locked against new comments
    content TEXT NOT NULL, -- Main text content/body of the post

    PRIMARY KEY (id),
    FOREIGN KEY (author_id) REFERENCES usof_database.users(id) ON DELETE CASCADE
);

-- =========================================================================
-- 3. Post Images Table
-- Stores attachments/images associated with specific posts
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.post_images (
    id INT NOT NULL AUTO_INCREMENT, -- Unique identifier for the image record
    post_id INT NOT NULL, -- ID of the target post
    image_path VARCHAR(255) NOT NULL, -- File path or storage URL of the uploaded image
    position INT NOT NULL, -- Display order position of the image within the post
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the image record was created

    PRIMARY KEY (id),
    FOREIGN KEY (post_id) REFERENCES usof_database.posts(id) ON DELETE CASCADE
);

-- =========================================================================
-- 4. Categories Table
-- Stores topic categories used to classify and filter posts
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.categories (
    id INT AUTO_INCREMENT PRIMARY KEY, -- Unique identifier for the category
    title VARCHAR(255) NOT NULL UNIQUE, -- Unique category name
    description TEXT -- Detailed explanation of what belongs in this category
);

-- =========================================================================
-- 5. Post Categories Table (Many-to-Many Junction)
-- Connects posts with multiple categories
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.post_categories (
    post_id INT NOT NULL, -- Associated post ID
    category_id INT NOT NULL, -- Associated category ID

    PRIMARY KEY (post_id, category_id), 
    FOREIGN KEY (post_id) REFERENCES usof_database.posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES usof_database.categories(id) ON DELETE CASCADE
);

-- =========================================================================
-- 6. Comments Table
-- Stores user comments on posts, supporting nested threaded replies
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.comments (
    id INT NOT NULL AUTO_INCREMENT, -- Unique identifier for the comment
    post_id INT NOT NULL, -- ID of the post where the comment is posted
    author_id INT NOT NULL, -- ID of the user who authored the comment
    parent_id INT DEFAULT NULL, -- ID of the parent comment if this is a nested reply (null for top-level)
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the comment was created
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active', -- Publication status of the comment
    locked BOOLEAN NOT NULL DEFAULT FALSE, -- Flag indicating if the comment is locked for further replies
    content TEXT NOT NULL, -- Text content of the comment

    PRIMARY KEY (id),
    FOREIGN KEY (post_id)
        REFERENCES usof_database.posts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (author_id)
        REFERENCES usof_database.users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comments_parent
        FOREIGN KEY (parent_id)
        REFERENCES usof_database.comments(id)
        ON DELETE CASCADE
);

-- =========================================================================
-- 7. Likes Table
-- Tracks user likes and dislikes for both posts and comments (mutually exclusive)
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.likes (
    id INT NOT NULL AUTO_INCREMENT, -- Unique identifier for the like/dislike reaction
    author_id INT NOT NULL, -- ID of the user who reacted
    type ENUM('like', 'dislike') NOT NULL, -- Type of reaction
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp of the reaction
    
    post_id INT DEFAULT NULL, -- Target post ID if liking a post
    comment_id INT DEFAULT NULL, -- Target comment ID if liking a comment

    PRIMARY KEY (id),
    FOREIGN KEY (author_id) REFERENCES usof_database.users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES usof_database.posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES usof_database.comments(id) ON DELETE CASCADE,

    -- Ensures a reaction is attached to EITHER a post OR a comment, never both or neither
    CONSTRAINT check_like_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),

    -- Prevents a user from reacting multiple times to the same post or comment
    UNIQUE KEY unique_user_post_like (author_id, post_id),
    UNIQUE KEY unique_user_comment_like (author_id, comment_id)
);

-- =========================================================================
-- 8. Favorites Table
-- Stores user-saved bookmarks of favorite posts
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.favorites (
    user_id INT NOT NULL, -- ID of the user who favorited the post
    post_id INT NOT NULL, -- ID of the bookmarked post
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the post was added to favorites

    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES usof_database.users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES usof_database.posts(id) ON DELETE CASCADE
);

-- =========================================================================
-- 9. Post Subscriptions Table
-- Tracks users subscribed to receive notifications or updates on specific posts
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.post_subscriptions (
    user_id INT NOT NULL, -- ID of the subscribed user
    post_id INT NOT NULL, -- ID of the subscribed post
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp when the subscription was created

    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES usof_database.users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES usof_database.posts(id) ON DELETE CASCADE
);

-- =========================================================================
-- 10. Post Views Table
-- Tracks total view counts for each post (used for analytics/statistics)
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.post_views (
    post_id INT NOT NULL, -- Target post ID
    views INT NOT NULL DEFAULT 0, -- Total accumulated view count

    PRIMARY KEY (post_id),
    FOREIGN KEY (post_id) REFERENCES usof_database.posts(id) ON DELETE CASCADE
);

-- =========================================================================
-- 11. Daily Views Table
-- Aggregates site/post views per calendar day for stats dashboards
-- =========================================================================
CREATE TABLE IF NOT EXISTS usof_database.daily_views (
    day DATE NOT NULL, -- Specific calendar date
    views INT NOT NULL DEFAULT 0, -- Total views recorded on that day

    PRIMARY KEY (day)
);