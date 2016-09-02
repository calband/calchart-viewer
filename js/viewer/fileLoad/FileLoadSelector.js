/**
 * @fileOverview This file defines the FileLoadSelector class,
 *   which is used to track changes to file formats and to make
 *   sure that different versions of a file type get loaded properly.
 *   Here's how the loading process works:
 *   A file format can change over time, so not all
 *   files will be loaded in the same way. Thus, before
 *   loading a particular file, you first need to fetch
 *   a loader object that can load your particular file. To do this,
 *   you need to call the getAppropriateLoader(version) method
 *   on a FileLoadSelector object.
 *   Once you have the appropriate loader for your file version, you
 *   can call its loadFile(...) method to load the file.
 *
 *   WHAT TO DO WHEN A FILE FORMAT CHANGES:
 *   When a file format changes, you need to add
 *   the ability to load the new file format while preserving
 *   the ability to load older file versions. To do this, you
 *   first need to define a child class of FileLoader
 *   that can load the new file version. Often,
 *   file format changes are small, and you only need to change
 *   the way in which a particular piece of the file is loaded.
 *   In these cases, it can be helpful to derive your new
 *   FileLoader from the loader for the previous version
 *   (e.g. FileLoad_1_0_1 might inherit from FileLoad_1_0_0
 *   in order to get access to all of the methods used to load
 *   file version 1.0.0; it may then change only a few of the original
 *   methods to accomodate for the file changes).
 *   After you make a new FileLoader, you need to register it
 *   with the FileLoadSelector. To do that, call
 *   loadSelector.registerLoader(fileVersionHere, new YourFileLoaderHere());
 *   In summary:
 *     - Define a new FileLoader to load the new file format
 *     - Register the new FileLoader with the FileLoadSelector by
 *         calling loadSelector.registerLoader(...)
 */

var ArrayUtils = require("../utils/ArrayUtils");
var Version = require("../Version");
 
/**
 * Every version of a file needs to be loaded in a different way -
 * this class is responsible for finding the appropriate FileLoader
 * object for loading a particular file version.
 */
var FileLoadSelector = function() {
    this._loaders = [];
};

/**
 * Associates a particular file version with a FileLoader
 * that can load files of that version.
 *
 * @param {Version} version The file version.
 * @param {FileLoader} loader A FileLoader that can load
 *   files of the given version.
 */
FileLoadSelector.prototype.registerLoader = function(version, loader) {
    var insertIndex = ArrayUtils.binarySearchForClosestLarger(this._loaders, version, FileLoadSelector._versionLocator);
    var loaderVersionPair = {
        version: version,
        loader: loader
    };
    this._loaders.splice(insertIndex, 0, loaderVersionPair);
};

/**
 * Returns the FileLoader that can load a file of the
 * given version.
 *
 * @param {Version} version The file version to load.
 * @return {FileLoader} A FileLoader that can load
 *   files with the provided version.
 */
FileLoadSelector.prototype.getAppropriateLoader = function(version) {
    var targetIndex = ArrayUtils.binarySearchForClosestSmaller(this._loaders, version, FileLoadSelector._versionLocator);
    return this._loaders[targetIndex].loader;
};

/**
 * Used in a binary search to find the position where a particular version
 * fits into an array of loader-version pairs sorted from earliest version
 * to latest version.
 *
 * @param {Version} versionToLocate The version to find in the array.
 * @param {object} relativeTo A loader-version pair to compare against the
 *   versionToLocate.
 * @return {int} A negative value if the versionToLocate comes before
 *   relativeTo in the array; positive value if the versionToLocate comes
 *   after relativeTo in the array; zero if versionToLocate and relativeTo
 *   have identical versions.
 */
FileLoadSelector._versionLocator = function(versionToLocate, relativeTo) {
    return versionToLocate.compareTo(relativeTo.version);
};
 
/**
 * This class is responsible for loading files of a particular version.
 */
FileLoadSelector.FileLoader = function() {
};

/**
 * Loads an entire file, and returns the result.
 *
 * @param {object} fileObject The file content.
 * @return {*} Depends on the version of the file.
 */
FileLoadSelector.FileLoader.prototype.loadFile = function(fileObject) {
    console.log("FileLoader.loadFile(...) called");
};


module.exports = FileLoadSelector;