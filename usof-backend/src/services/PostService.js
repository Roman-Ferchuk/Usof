const PostRepository = require('../repositories/PostRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const PostImageRepository = require('../repositories/PostImageRepository');

class PostService {
    constructor({ 
        postRepository, 
        categoryRepository, 
        postImageRepository 
    }) { 
        this.postRepository = postRepository; 
        this.categoryRepository = categoryRepository; 
        this.postImageRepository = postImageRepository; 
    }

    async createPost({
        authorId,
        title,
        status = 'active',
        content,
        categories,
        images
    }) {
        this.#validateId(authorId);
        
        
    }

    #validateId(id) { 
        if ( id === undefined 
            || id === null 
            || !Number.isInteger(Number(id)) 
            || Number(id) <= 0 
        ) { 
            throw new Error('Invalid user ID'); 
        } 
    }
}