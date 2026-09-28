const pool = require('./src/config/db').promise();

// Repositories
const UserRepository = require('./src/repositories/UserRepository');
const PostRepository = require('./src/repositories/PostRepository');
const PostImageRepository = require('./src/repositories/PostImageRepository');
const LikeRepository = require('./src/repositories/LikeRepository');
const CommentRepository = require('./src/repositories/CommentRepository');
const CategoryRepository = require('./src/repositories/CategoryRepository');

// Services
const AuthService = require('./src/services/AuthService');
const UserService = require('./src/services/UserService');
const PostService = require('./src/services/PostService');
const EmailService = require('./src/services/EmailService');
const LikeService = require('./src/services/LikeService');
const CommentService = require('./src/services/CommentService');
const CategoryService = require('./src/services/CategoryService');

// Controllers
const AuthController = require('./src/controllers/AuthController');
const UserController = require('./src/controllers/UserController');
const PostController = require('./src/controllers/PostController');
const CommentController = require('./src/controllers/CommentControler');
const CategoryController = require('./src/controllers/CategoriesContoller');

// Routers
const createAuthRouter = require('./src/routes/authRouter');
const createUserRouter = require('./src/routes/userRouter');
const createPostRouter = require('./src/routes/postRouter');
const createCommentRouter = require('./src/routes/commentRouter');
const createCategoryRouter = require('./src/routes/categoryRouter');

const createApp = require('./src/app');
const initDb = require('./src/config/initDB');

async function startServer() {
    try {
        await initDb(pool);
        await pool.query('SELECT 1');
        console.log('Database connected successfully');

        const userRepository = new UserRepository(pool);
        const postRepository = new PostRepository(pool);
        const postImageRepository = new PostImageRepository(pool);
        const likeRepository = new LikeRepository(pool);
        const commentRepository = new CommentRepository(pool);
        const categoryRepository = new CategoryRepository(pool);

        const emailService = new EmailService();
        const authService = new AuthService(userRepository, emailService);
        const userService = new UserService(userRepository);
        const postService = new PostService(postRepository,categoryRepository, postImageRepository);
        const likeService = new LikeService(likeRepository, postRepository, commentRepository);
        const commentService = new CommentService(commentRepository, postRepository);
        const categoryService = new CategoryService(categoryRepository);

        const authController = new AuthController(authService);
        const userController = new UserController(userService);
        const postController = new PostController(postService, likeService, commentService);
        const commentController = new CommentController(commentService, likeService);
        const categoryController = new CategoryController(categoryService, postService);

        const authRouter = createAuthRouter(authController);
        const userRouter = createUserRouter(userController);
        const postRouter = createPostRouter(postController);
        const commentRouter = createCommentRouter(commentController);
        const categoryRouter = createCategoryRouter(categoryController);

        const app = createApp({
            authRouter,
            userRouter,
            postRouter,
            commentRouter,
            categoryRouter
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();