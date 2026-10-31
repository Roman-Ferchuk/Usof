/**
 * Error carrying an HTTP status code, so controllers can map it without string matching.
 */
class HttpError extends Error {
    /**
     * @param {number} status - HTTP status code.
     * @param {string} message - Human readable error description.
     */
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}

module.exports = HttpError;
