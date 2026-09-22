const LikeType = Object.freeze({
    LIKE: 'like',
    DISLIKE: 'dislike'
});

const LikeTargetType = Object.freeze({
    POST: 'post',
    COMMENT: 'comment'
});

class Like {
    constructor({
        id = null,
        authorId,
        targetType,
        targetId,
        type,
        publishDate = new Date()
    }) {
        super(id);

        this.authorId = authorId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.type = type;
        this.publishDate = publishDate;

        this.validate();
    }

    validate() {
        if (!Number.isInteger(this.authorId) || this.authorId <= 0) {
            throw new Error('Like author ID must be a positive integer');
        }

        if (!Number.isInteger(this.targetId) || this.targetId <= 0) {
            throw new Error('Like target ID must be a positive integer');
        }

        if (!Object.values(LikeTargetType).includes(this.targetType)) {
            throw new Error('Invalid like target type');
        }

        if (!Object.values(LikeType).includes(this.type)) {
            throw new Error('Invalid like type');
        }
    }

    isLike() {
        return this.type === LikeType.LIKE;
    }

    isDislike() {
        return this.type === LikeType.DISLIKE;
    }
}

module.exports = {
    Like,
    LikeType,
    LikeTargetType
};