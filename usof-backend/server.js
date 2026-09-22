const pool = require('./src/config/db').promise();

// User
const UserRepository = require('./src/repositories/UserRepository');
const userRepository = new UserRepository(pool);

//const UserService = require