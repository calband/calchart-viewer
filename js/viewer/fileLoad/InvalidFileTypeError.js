/**
 * An Exception thrown by the FileLoadSelectors if the loaded file is of the wrong
 * file type.
 *
 * @param {String} message The message to accompany the error.
 */
var InvalidFileTypeError = function(message) {
    this.message = message;
    this.name = "InvalidFileTypeError";
};

module.exports = InvalidFileTypeError;