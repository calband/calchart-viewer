/**
 * @fileOverview Defines the VersionManager class.
 */

 var Version = require("./Version");
 var ArraySearchUtils = require("./ArraySearchUtils");
 
/**
 * A class representing a particular version of a value.
 *
 * @param value The value.
 * @param {Version} The version for the value.
 */
var VersionedValue = function(value, version) {
    this.value = value;
    this.version = version;
};

/**
 * VersionManager objects remember the changes made to
 * particular values/functions across program versions. This is
 * particularly useful in maintaining the ability to load
 * older file versions - a VersionManager object can remember
 * changes made to the functions used to process files, and when
 * the user wants to process an older file version, the
 * VersionManager can reconstruct the set of functions originally
 * used to do that.
 */
var VersionManager = function() {
    this._values = {};
}

/**
 * Records the value associated with a key for a particular
 * version.
 *
 * @param {string} name The key of the value.
 * @param {Version} version The version for which the value
 *   was relevant.
 * @param value The value.
 */
VersionManager.prototype.record = function(name, version, value) {
    if (!(name in this._values)) {
        this._values[name] = [];
    }
    var targetArray = this._values[name];
    var targetIndex = ArraySearchUtils.binarySearchForClosestLarger(targetArray, version, this._versionedValueLocator);
    if (targetIndex === undefined) {
        targetArray.push(new VersionedValue(value, version));
    } else {
        targetArray.splice(targetIndex, 0, new VersionedValue(value, version));
    }
};

/**
 * Fetches the value associated with a key during a particular
 * version.
 *
 * @param {string} name The key for the value.
 * @param {Version} version The target version.
 * @return The value associated with the key for the specified
 *   version.
 */
VersionManager.prototype.fetch = function(name, version) {
    var containerArray = this._values[name];
    var bestIndex = ArraySearchUtils.binarySearchForClosestSmaller(containerArray, version, this._versionedValueLocator);
    return containerArray[bestIndex].value;
};

/**
 * Constructs an object having all of the key-value pairs for
 * a particular version.
 *
 * @param {Version} version The target version.
 * @return {object} An object with all of the key-value pairs
 *   that were relevant to a particular version.
 */
VersionManager.prototype.reconstructForVersion = function(version) {
    var reconstructed = {};
    for (var valueName in this._values) {
        reconstructed[valueName] = this.fetch(valueName, version);
    }
    return reconstructed;
};

/**
 * Given a sorted array of VersionedValues, this function indicates
 * where to find a VersionedValue that has a particular Version.
 * It is given the version to locate, as well as one value from the
 * sorted array, and must indicate whether the version comes before
 * or after that value in the array.
 *
 * @param {Version} version The version to locate.
 * @param {VersionedValue} value A value already in the array.
 * @return {int} Negative if the version should come earlier
 *   the value; positive if the version should come after the
 *   value; zero if the value has the version being located.
 */
VersionManager.prototype._versionedValueLocator = function(version, value) {
    return version.compare(value.version);
};

module.exports = VersionManager;