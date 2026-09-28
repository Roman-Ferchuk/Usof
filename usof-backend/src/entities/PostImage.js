class PostImage {
    constructor({
        id = null,
        postId,
        imagePath,
        position,
        createdAt = new Date()
    }) {
        this.id = id;

        this.postId = postId;
        this.imagePath = imagePath;
        this.position = position;
        this.createdAt = createdAt;

        this.validate();
    }

    validate() {
        if (!postId) {
            throw new Error('Post is required')
        }

        if (!this.imagePath || this.imagePath.trim().length === 0) {
            throw new Error('Image path is required');
        }
    }
}

module.exports = PostImage;