// Relative paths (.env, uploads/) must not depend on the directory the server was started from.
process.chdir(__dirname);

require('dotenv').config();

const pool = require('./src/config/db').promise();

// Repositories
const UserRepository = require('./src/repositories/UserRepository');
const PostRepository = require('./src/repositories/PostRepository');
const PostImageRepository = require('./src/repositories/PostImageRepository');
const LikeRepository = require('./src/repositories/LikeRepository');
const CommentRepository = require('./src/repositories/CommentRepository');
const CategoryRepository = require('./src/repositories/CategoryRepository');
const FavoriteRepository = require('./src/repositories/FavoriteRepository');
const SubscriptionRepository = require('./src/repositories/SubscriptionRepository');
const AdminRepository = require('./src/repositories/AdminRepository');
const StatsRepository = require('./src/repositories/StatsRepository');

// Services
const AuthService = require('./src/services/AuthService');
const UserService = require('./src/services/UserService');
const PostService = require('./src/services/PostService');
const EmailService = require('./src/services/EmailService');
const LikeService = require('./src/services/LikeService');
const CommentService = require('./src/services/CommentService');
const CategoryService = require('./src/services/CategoryService');
const FavoriteService = require('./src/services/FavoriteService');
const SubscriptionService = require('./src/services/SubscriptionService');
const NotificationService = require('./src/services/NotificationService');
const AdminService = require('./src/services/AdminService');

// Controllers
const AuthController = require('./src/controllers/AuthController');
const UserController = require('./src/controllers/UserController');
const PostController = require('./src/controllers/PostController');
const CommentController = require('./src/controllers/CommentControler');
const CategoryController = require('./src/controllers/CategoriesContoller');
const FavoriteController = require('./src/controllers/FavoriteController');
const AdminController = require('./src/controllers/AdminController');
const StatsController = require('./src/controllers/StatsController');

// Routers
const createAuthRouter = require('./src/routes/authRouter');
const createUserRouter = require('./src/routes/userRouter');
const createPostRouter = require('./src/routes/postRouter');
const createCommentRouter = require('./src/routes/commentRouter');
const createCategoryRouter = require('./src/routes/categoryRouter');
const createFavoriteRouter = require('./src/routes/favoriteRouter');
const createAdminRouter = require('./src/routes/adminRouter');
const createStatsRouter = require('./src/routes/statsRouter');

const createApp = require('./src/app');
const initDb = require('./src/config/initDB');
const initSeed = require('./src/config/initSeed');

async function startServer() {
    try {
        await pool.query('SELECT 1');
        console.log('Database connected successfully');
        await initDb(pool);
        await initSeed(pool);

        const userRepository = new UserRepository(pool);
        const postRepository = new PostRepository(pool);
        const postImageRepository = new PostImageRepository(pool);
        const likeRepository = new LikeRepository(pool);
        const commentRepository = new CommentRepository(pool);
        const categoryRepository = new CategoryRepository(pool);
        const favoriteRepository = new FavoriteRepository(pool);
        const subscriptionRepository = new SubscriptionRepository(pool);
        const adminRepository = new AdminRepository(pool);
        const statsRepository = new StatsRepository(pool);

        const emailService = new EmailService();
        const authService = new AuthService(userRepository, emailService);
        const userService = new UserService(userRepository);
        const notificationService = new NotificationService(subscriptionRepository, emailService);
        const postService = new PostService(postRepository, categoryRepository, postImageRepository, notificationService, subscriptionRepository);
        const likeService = new LikeService(likeRepository, postRepository, commentRepository);
        const subscriptionService = new SubscriptionService(subscriptionRepository, postService);
        const commentService = new CommentService(commentRepository, postRepository, notificationService, userRepository);
        const categoryService = new CategoryService(categoryRepository);
        const favoriteService = new FavoriteService(favoriteRepository, postRepository, postImageRepository);
        const adminService = new AdminService(adminRepository, userService);

        const authController = new AuthController(authService);
        const userController = new UserController(userService);
        const postController = new PostController(postService, likeService, commentService, subscriptionService);
        const commentController = new CommentController(commentService, likeService);
        const categoryController = new CategoryController(categoryService, postService);
        const favoriteController = new FavoriteController(favoriteService);
        const adminController = new AdminController(adminService);
        const statsController = new StatsController(statsRepository);

        const authRouter = createAuthRouter(authController);
        const userRouter = createUserRouter(userController);
        const postRouter = createPostRouter(postController);
        const commentRouter = createCommentRouter(commentController);
        const categoryRouter = createCategoryRouter(categoryController);
        const favoriteRouter = createFavoriteRouter(favoriteController);
        const adminRouter = createAdminRouter(adminController);
        const statsRouter = createStatsRouter(statsController);

        const app = createApp({
            authRouter,
            userRouter,
            postRouter,
            commentRouter,
            categoryRouter,
            favoriteRouter,
            adminRouter,
            statsRouter
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Admin panel: http://localhost:${PORT}/admin/`);
        });
    }catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();