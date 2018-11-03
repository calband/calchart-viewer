/**
 * @fileOverview Defines a collection of functions that are
 *   used to create and manage TimedBeats objects.
 */

 var BeatsFileLoadSelector = require("../fileLoad/BeatsFileLoadSelector");
 var Version = require("../Version");
 
 /**
  * The collection of all functions related to creating and
  * managing TimedBeats objects.
  */
 var TimedBeatsUtils = {};
 
/**
 * Builds a TimedBeats object from a beats file, given the content
 * of a beats file as a string.
 *
 * @param {string} fileContent The content of the
 *   beats file to load the TimedBeats from.
 * @return {TimedBeats} The TimedBeats object represented in the
 *   beats file.
 */
TimedBeatsUtils.fromJSONString = function(fileContent) {
    var beatsObject = JSON.parse(fileContent); //Parse the JSON file text into an object
    return this.fromJSON(beatsObject);
};
 
/**
 * Builds a TimedBeats object from a beats file, as a JSON object
 *
 * @param {object} beatsObject The content of the
 *   beats file to load the TimedBeats from.
 * @return {TimedBeats} The TimedBeats object represented in the
 *   beats file.
 */
TimedBeatsUtils.fromJSON = function(beatsObject) {
    var fileVersion = Version.parse(beatsObject.meta.version); //Get the version of the beats file
    return BeatsFileLoadSelector.getInstance().getAppropriateLoader(fileVersion).loadFile(beatsObject); //Get the appropriate file loader and use it to load the file
};

module.exports = TimedBeatsUtils;