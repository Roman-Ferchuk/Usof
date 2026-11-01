const fs = require('fs/promises');
const path = require('path');

const UPLOADS_DIR = path.resolve('uploads');

/**
 * Deletes uploaded files. Only files inside the uploads directory are touched,
 * and a file that is already gone is not an error.
 * @param {string[]} filePaths - Paths such as "uploads/images/images-1.png".
 * @returns {Promise<void>}
 */
async function removeFiles(filePaths) {
    await Promise.all((filePaths || []).map(async (filePath) => {
        const absolute = path.resolve(filePath);
        if (!absolute.startsWith(UPLOADS_DIR + path.sep)) return;

        try {
            await fs.unlink(absolute);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('[files.removeFiles]', error.message);
            }
        }
    }));
}

/**
 * @param {Object[]} files - req.files of multer.
 * @returns {string[]} Paths with forward slashes, as they are stored in the database.
 */
function uploadedPaths(files) {
    return (files || []).map((file) => file.path.replace(/\\/g, '/'));
}

module.exports = { removeFiles, uploadedPaths };
