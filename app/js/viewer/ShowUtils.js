/**
 * @fileOverview Defines a collection of functions that are
 *   used to create and manage Show objects.
 */

 var getViewerFileLoadSelector = require("./ViewerFileLoad");
 var Version = require("./Version");
 
 /**
  * The collection of all functions related to creating and
  * managing Show objects.
  */
 var ShowUtils = {};
 
/**
 * Builds a show from a viewer file, given the content
 * of a viewer file as a string.
 *
 * @param {string} fileContent The content of the
 *   viewer file to load the show from.
 * @return {Show} The show represented in the viewer
 *   file.
 */
ShowUtils.fromJSON = function(fileContent) {
    var viewerFileMainObject = JSON.parse(fileContent); //Parse the JSON file text into an object
    var fileVersion = Version.parse(viewerFileMainObject.meta.version); //Get the version of the viewer file
    return getViewerFileLoadSelector().getAppropriateLoader(fileVersion).loadViewerFile(viewerFileMainObject); //Get the appropriate ViewerLoader and use it to load the file
};

module.exports = ShowUtils;