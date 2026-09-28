const PostStatus = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive'
})

class Post {
    constructor({
        id = null,
        authorId,
        title,
        publishDate = new Date(),
        content,
        status = PostStatus.ACTIVE,
        locked = falslse,
        categories = [],
        images = []
    }) {
        this.id = id;

        this.authorId = authorId;
        this.title = title;
        this.publishDate = publishDate;
        this.status = status;
        this.locked = locked;
        this.content = content;

        this.categories = categories;
        this.images = images;

        this.validate();
    }

    validate() {
        if (!this.authorId) {
            throw new Error('Post author is required');
        }

        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Post title is required');
        }

        if (!this.content || this.content.trim().length === 0) {
            throw new Error('Post content is required');
        }

        if (!Object.values(PostStatus).includes(this.status)) {
            throw new Error('Invalid post status');
        }

        if (!Array.isArray(this.categories)) {
            throw new Error('Categories must be an array');
        }

        if (!Array.isArray(this.images)) {
            throw new Error('Images must be an array');
        }   
    }

    updateContent(title, content) {
        if (!title || title.trim().length === 0) {
            throw new Error('Post title is required');
        }

        if (!content || content.trim().length === 0) {
            throw new Error('Post content is required');
        }

        this.title = title;
        this.content = content;
    }

    changeStatus(status) {
        if (!Object.values(PostStatus).includes(status)) {
            throw new Error('Invalid post status');
        }

        this.status = status;
    }

    addCategory(category) {
        if (!category || category.trim().length === 0) {
            throw new Error('Category is required');
        }

        if (this.categories.includes(category)) {
            throw new Error('Category already exists');
        }

        this.categories.push(category);
    }

    removeCategory(categoryId) {
        this.categories = this.categories.filter(
            category => category.id !== categoryId
        );
    }

    setCategories(categories) {
        if (!Array.isArray(categories)) {
            throw new Error('Categories must be an array');
        }

        this.categories = categories;
    }

    addImage(image) {
        if (!image) {
            throw new Error('Image is required');
        }

        this.images.push(image);
    }

    removeImage(imageId) {
        if (!imageId) {
            throw new Error('Image ID is required');
        }

        this.images = this.images.filter(
            image => image.id !== imageId
        );
    }
}

module.exports = {
    Post,
    PostStatus
};