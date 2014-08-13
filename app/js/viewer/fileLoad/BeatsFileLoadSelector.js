/**
 * @fileOverview This file describes how beats files are loaded.
 *   A singleton of the BeatsFileLoadSelector class
 *   is used to determine how to load a specific version of the
 *   beats file. For more information about how a FileLoadSelector
 *   like the BeatsFileLoadSelector works, @see FileLoadSelector.js.
 *   Here are the steps that you should follow when the file format
 *   changes:
 *     - Define a FileLoadSelector.FileLoader that can load the
 *         new file version
 *     - Register your new file loader in 
 *         BeatsFileLoadSelector._setupInstance(...)
 *   
 */

var Version = require("../Version");
var FileLoadSelector = require("./FileLoadSelector");
var ClassUtils = require("../ClassUtils");
var TimedBeats = require("../TimedBeats");
 
/**
 * Every version of the Beats File needs to be loaded in a different way -
 * this class is responsible for finding the appropriate BeatsFileLoader
 * object for loading a particular Beats File version.
 */
var BeatsFileLoadSelector = function() {
	FileLoadSelector.apply(this, []);
};

ClassUtils.extends(BeatsFileLoadSelector, FileLoadSelector);

/**
 * The BeatsFileLoadSelector is a singleton, and this is its
 * instance.
 * @type {BeatsFileLoadSelector}
 */
BeatsFileLoadSelector._instance = undefined;

/**
 * Returns the BeatsFileLoadSelector singleton instance. If it doesn't exist,
 * it is created and then returned.
 *
 * @return {BeatsFileLoadSelector} The BeatsFileLoadSelector singleton instance.
 */
BeatsFileLoadSelector.getInstance = function() {
    if (BeatsFileLoadSelector._instance === undefined) {
        BeatsFileLoadSelector._instance = new BeatsFileLoadSelector();
        BeatsFileLoadSelector._setupInstance(BeatsFileLoadSelector._instance);
    }
    return BeatsFileLoadSelector._instance;    
};

/**
 * Loads a new BeatsFileLoadSelector with all of the known BeatsFileLoader
 * types, so that it understands how to load every Beats File version.
 *
 * @param {BeatsFileLoadSelector} instance The BeatsFileLoadSelector to set up.
 */
BeatsFileLoadSelector._setupInstance = function(instance) {
    instance.registerLoader(new Version(1, 0, 0), new BeatsFileLoad_1_0_0());
};
 
/**
 * This class is responsible for loading beats files of a particular version.
 */
BeatsFileLoadSelector.BeatsFileLoader = function() {
};

ClassUtils.extends(BeatsFileLoadSelector.BeatsFileLoader, FileLoadSelector.FileLoader); 


/**
 *=================================================================
 *====================-- LOAD BEATS FILE 1.0.0
 *=================================================================
 * ALL AVAILABLE METHODS IN THIS VERSION:
 *   loadFile
 *   loadBeats
 * ADDED METHODS IN THIS VERSION:
 *  all available METHODS
 * REMOVED METHODS IN THIS VERSION:
 *   none
 * MODIFIED METHODS IN THIS VERSION:
 *   none
 * 
 * To use: call the loadFile method.
 */
var BeatsFileLoad_1_0_0 = function() {
};

ClassUtils.extends(BeatsFileLoad_1_0_0, BeatsFileLoadSelector.BeatsFileLoader);

/**
 * Loads an entire beats file, and returns the result. For
 * beats file version 1.0.0, the result is just a TimedBeats object.
 *
 * @param {object} beatsFileObject The main object from a
 *   beats file.
 * @return {TimedBeats} An object which records the beats
 *   described in the file.
 */
BeatsFileLoad_1_0_0.prototype.loadFile = function (beatsFileObject) {
	return this.loadBeats(beatsFileObject.beats);
};

/**
 * Loads the "beats" array of a beats file.
 *
 * @param {Array<int>} beatsArray The "beats" property of
 *   the main object in the file.
 * @return {TimedBeats} An object that tracks all of the beats
 *   described in the array.
 */
BeatsFileLoad_1_0_0.prototype.loadBeats = function (beatsArray) {
	var returnVal = new TimedBeats();
	var overallTime = 0;
	for (var index = 0; index < beatsArray.length; index++) {
		overallTime += beatsArray[index];
		returnVal.addBeat(overallTime);
	}
	return returnVal;
};

module.exports = BeatsFileLoadSelector;