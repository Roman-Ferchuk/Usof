const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set. Define it in the .env file.');
}

module.exports = { JWT_SECRET };
