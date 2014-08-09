/**
 * @fileOverview Defines the Version class.
 */

/**
 * Version objects represent a version of a file
 * or application in the following format:
 * [major].[minor].[revision].
 *
 * @param {int} major The major version.
 * @param {int} minor The minor version.
 * @param {int} revision The revision number.
 */
var Version = function(major, minor, revision) {
    this._major = major;
    this._minor = minor;
    this._revision = revision;
};

/**
 * Builds a string representation of the Version.
 * String representations take the format:
 * [major].[minor].[revision].
 *
 * @return {string} A string representation of this
 *   version.
 */
Version.prototype.stringify = function() {
    return this._major + "." + this._minor + "." + this._revision;
};

/**
 * Compares this Version to another, and indicates which
 * version is an earlier one.
 *
 * @param {Version} otherVersion The version to compare
 *   this one against.
 * @return {int} A negative value if this version is
 *   an earlier one than the other; a positive value
 *   if this version is later than the other one;
 *   zero if the versions are identical.
 */
Version.prototype.compare = function(otherVersion) {
    var delta = this._major - otherVersion._major;
    if (delta != 0) {
        return delta;
    }
    delta = this._minor - otherVersion._minor;
    if (delta != 0) {
        return delta;
    }
    delta = this._revision - otherVersion._revision;
    return delta;
};

/**
 * Builds a Version object from a string.
 * These strings should be in the format:
 * [major].[minor].[revision].
 *
 * @param {string} stringVersion A string representation
 *   of a Version.
 * @return {Version} A Version which matches the
 *   provided string.
 */
Version.parse = function(stringVersion) {
    var versionPieces = stringVersion.split(".");
    return new Version(parseInt(versionPieces[0]), parseInt(versionPieces[1]), parseInt(versionPieces[2]));
};

module.exports = Version;