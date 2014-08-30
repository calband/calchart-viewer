/**
 * @fileOverview Defines a collection of functions that are
 *   used to create and manage Show objects.
 */

 var ViewerFileLoadSelector = require("./fileLoad/ViewerFileLoadSelector");
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
    try {
        var viewerFileMainObject = JSON.parse(fileContent); //Parse the JSON file text into an object
        if (typeof viewerFileMainObject.show === "undefined") {
            alert("You need to upload the viewer file!");
        }
        console.log(viewerFileMainObject.show);
        var fileVersion = Version.parse(viewerFileMainObject.meta.version); //Get the version of the viewer file
        return ViewerFileLoadSelector.getInstance().getAppropriateLoader(fileVersion).loadFile(viewerFileMainObject); //Get the appropriate ViewerLoader and use it to load the file
    } catch (err) {
        if (err.name == "SyntaxError") {
            alert("You need to upload a .json file!");
        }
    }
};

module.exports = ShowUtils;