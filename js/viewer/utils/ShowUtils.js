/**
 * @fileOverview Defines a collection of functions that are
 *   used to create and manage Show objects.
 */

 var ViewerFileLoadSelector = require("../fileLoad/ViewerFileLoadSelector");
 var Version = require("../Version");
 
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
ShowUtils.fromJSONString = function(fileContent) {
    var viewerObject = JSON.parse(fileContent); //Parse the JSON file text into an object
    return this.fromJSON(viewerObject);
};
 
/**
 * Builds a show from a viewer file, as a JSON object
 *
 * @param {object} viewerObject The content of the
 *   viewer file to load the show from.
 * @return {Show} The show represented in the viewer
 *   file.
 */
ShowUtils.fromJSON = function(viewerObject) {
    var fileVersion = Version.parse(viewerObject.meta.version); //Get the version of the viewer file
    return ViewerFileLoadSelector.getInstance().getAppropriateLoader(fileVersion).loadFile(viewerObject); //Get the appropriate ViewerLoader and use it to load the file
};

module.exports = ShowUtils;