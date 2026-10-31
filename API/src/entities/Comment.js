class Comment {
    constructor({
        id = null,
        postId,
        authorId,
        parentId = null,
        publishDate = new Date(),
        status,
        locked,
        content,
        author = null,
        rating = 0,
        likesCount = 0,
        dislikesCount = 0,
        myReaction = null
    }) {
        this.id = id;

        this.postId = postId;
        this.parentId = parentId;
        this.authorId = authorId;
        this.publishDate = publishDate;
        this.status = status;
        this.locked = locked;
        this.content = content;

        // Read-model fields, filled only by queries that join extra data.
        this.author = author;
        this.rating = rating;
        this.likesCount = likesCount;
        this.dislikesCount = dislikesCount;
        this.myReaction = myReaction;

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