const BaseEntity = require('./BaseEntity');

class Category extends BaseEntity {
    constructor({
        id = null, 
        title, 
        description = null
    }) {
        super(id);
        this.title = title;
        this.description = description;

        this.validate();
    }

    validate() {
        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Category title is required')
        }

        if (this.title.length > 255) {
            throw new Error(
                'Category title must not exceed 255 characters'
            );
        }
    }

    update(title, description = null) {
        if (!title || title.trim().length === 0) {
            throw new Error('Category title is required');
        }

        this.title = title;
        this.description = description;
    }
}

module.exports = Category;