class Comment {
    constructor({
        id = null,
        postId,
        authorId,
        publishDate = new Date(),
        status,
        locked,
        content
    }) {
        this.id = id;

        this.postId = postId;
        this.authorId = authorId;
        this.publishDate = publishDate;
        this.status = status;
        this.locked = locked;
        this.content = content;

        this.validate();
    }

    validate() {
        if (!this.postId) {
            throw new Error('Post is required');
        }

        if (!this.authorId) {
            throw new Error('Comment author is required')
        }

        if (!this.content || this.content.trim().length === 0) {
            throw new Error('Comment content is required');
        }
    }
}

module.exports = Comment;