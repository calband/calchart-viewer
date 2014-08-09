/**
 * @fileOverview Defines the ShowFromJSON function, which builds
 * a show from a viewer file.
 */

 var ViewerFileLoader = require("./ViewerFileLoader");
 
/**
 * Builds a show from a viewer file, given the content
 * of a viewer file as a string.
 *
 * @param {string} fileContent The content of the
 *   viewer file to load the show from.
 * @return {Show} The show represented in the viewer
 *   file.
 */
var ShowFromJSON = function(fileContent) {
    var viewerFileMainObject = JSON.parse(fileContent);
    var fileVersion = Version.parse(viewerFileMainObject.meta.version);
    var fileLoader = ViewerFileLoader.reconstructForVersion(fileVersion);
    return fileLoader.loadViewerFile(fileLoader, viewerFileMainObject);
};

module.exports = ShowFromJSON;