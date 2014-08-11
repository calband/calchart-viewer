/**
 * @fileOverview This file defines how viewer files are loaded.
 *   Here's how the loading process works:
 *   The viewer file format can change over time, so not all
 *   viewer files will be loaded in the same way. Thus, before
 *   loading a particular viewer file, you first need to fetch
 *   a loader object that can load your particular viewer file. To do this,
 *   you need to call the getAppropriateLoader(version) method
 *   on the singleton instance of ViewerFileLoadSelector.
 *   This would be done with:
 *   ViewerFileLoadSelector.getViewerFileLoadSelector().getAppropriateLoaderVersion(viewerFileVersion);
 *   Once you have the appropriate loader for your file version, you
 *   can call its loadViewerFile(...) method to load the file.
 *
 *   WHAT TO DO WHEN THE VIEWER FILE FORMAT CHANGES:
 *   When the viewer file format changes, you need to add
 *   the ability to load the new file format while preserving
 *   the ability to load older file versions. To do this, you
 *   first need to define a child class of ViewerFileLoader
 *   that can load the new file version. Often,
 *   file format changes are small, and you only need to change
 *   the way in which a particular piece of the file is loaded.
 *   In these cases, it can be helpful to derive your new
 *   ViewerFileLoader from the loader for the previous version
 *   (e.g. ViewerFileLoad_1_0_1 might inherit from ViewerFileLoad_1_0_0
 *   in order to get access to all of the methods used to load
 *   file version 1.0.0; it may then change only a few of the original
 *   methods to accomodate for the file changes).
 *   After you make a new ViewerFileLoader, you need to register it
 *   with the ViewerFileLoadSelector. To do that, add the following line
 *   to the ViewerFileLoadSelector._setupInstance static method:
 *   instance.registerLoader(fileVersionHere, new YourViewerFileLoaderHere());
 *   In summary:
 *     - Define a new ViewerFileLoader to load the new file format
 *     - Register the new ViewerFileLoader with the ViewerFileLoadSelector by
 *         editing the ViewerFileLoadSelector._setupInstance static method
 */

var ArraySearchUtils = require("./ArraySearchUtils");
var ClassUtils = require("./ClassUtils");
var Version = require("./Version");
var Dot = require("./Dot");
var Sheet = require("./Sheet");
var Show = require("./Show");
var MovementCommandStand = require("./MovementCommandStand");
var MovementCommandMarkTime = require("./MovementCommandMarkTime");
var MovementCommandArc = require("./MovementCommandArc");
var MovementCommandMove = require("./MovementCommandMove");
var MovementCommandGoto = require("./MovementCommandGoto");
var MovementCommandEven = require("./MovementCommandEven");
 
/**
 * Every version of the Viewer File needs to be loaded in a different way -
 * this class is responsible for finding the appropriate ViewerFileLoader
 * object for loading a particular Viewer File version.
 */
var ViewerFileLoadSelector = function() {
    this._loaders = [];
};

/**
 * Associates a particular Viewer File version with a ViewerFileLoader
 * that can load files of that version.
 *
 * @param {Version} version The Viewer File version.
 * @param {ViewerFileLoader} loader A ViewerFileLoader that can load
 *   viewer files of the given version.
 */
ViewerFileLoadSelector.prototype.registerLoader = function(version, loader) {
    var insertIndex = ArraySearchUtils.binarySearchForClosestLarger(this._loaders, version, ViewerFileLoadSelector._versionLocator);
    var loaderVersionPair = {
        version: version,
        loader: loader
    };
    this._loaders.splice(insertIndex, 0, loaderVersionPair);
};

/**
 * Returns the ViewerFileLoader that can load a viewer file of the
 * given version.
 *
 * @param {Version} version The viewer file version to load.
 * @return {ViewerFileLoader} A ViewerFileLoader that can load viewer
 *   files with the provided version.
 */
ViewerFileLoadSelector.prototype.getAppropriateLoader = function(version) {
    var targetIndex = ArraySearchUtils.binarySearchForClosestSmaller(this._loaders, version, ViewerFileLoadSelector._versionLocator);
    return this._loaders[targetIndex].loader;
};

/**
 * The ViewerFileLoadSelector is a singleton, and this is its
 * static instance.
 * @type {ViewerFileLoadSelector}
 */
ViewerFileLoadSelector._instance = undefined;

/**
 * Returns the ViewerFileLoadSelector singleton instance. If it doesn't exist,
 * it is created and then returned.
 *
 * @return {ViewerFileLoadSelector} The ViewerFileLoadSelector singleton instance.
 */
ViewerFileLoadSelector.getInstance = function() {
    if (ViewerFileLoadSelector._instance === undefined) {
        ViewerFileLoadSelector._instance = new ViewerFileLoadSelector();
        ViewerFileLoadSelector._setupInstance(ViewerFileLoadSelector._instance);
    }
    return ViewerFileLoadSelector._instance;    
};

/**
 * Loads a new ViewerFileLoadSelector with all of the known ViewerFileLoader
 * types, so that it understands how to load every Viewer File version.
 *
 * @param {ViewerFileLoadSelector} instance The ViewerFileLoadSelector to set up.
 */
ViewerFileLoadSelector._setupInstance = function(instance) {
    instance.registerLoader(new Version(1, 0, 0), new ViewerFileLoad_1_0_0());
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
ViewerFileLoadSelector._versionLocator = function(versionToLocate, relativeTo) {
    return versionToLocate.compareTo(relativeTo.version);
};
 
 
/**
 * This class is responsible for loading viewer files of a particular version.
 */
var ViewerFileLoader = function() {
};

/**
 * Loads an entire viewer file, and returns the result.
 *
 * @param {object} viewerFileObject The main object from a
 *   JSON viewer file.
 * @return {*} Depends on the version of the viewer file.
 */
ViewerFileLoader.prototype.loadViewerFile = function(viewerFileObject) {
    console.log("ViewerFileLoader.loadViewerFile(...) called");
};


/**
 *=================================================================
 *====================-- LOAD VIEWER FILE 1.0.0
 *=================================================================
 * ALL AVAILABLE METHODS IN THIS VERSION:
 *   loadViewerFile
 *   loadShow
 *   loadSheets
 *   buildIndividualSheet
 *   buildDots
 *   buildDotMovements
 *   buildIndividualMovement
 *   buildStandMovement
 *   buildMarkMovement
 *   buildMoveMovement
 *   buildGotoMovement
 *   buildArcMovement
 *   buildEvenMovement
 * ADDED METHODS IN THIS VERSION:
 *  all available METHODS
 * REMOVED METHODS IN THIS VERSION:
 *   none
 * MODIFIED METHODS IN THIS VERSION:
 *   none
 * 
 * To use: call the loadViewerFile method.
 */
var ViewerFileLoad_1_0_0 = function() {
};

ClassUtils.extends(ViewerFileLoad_1_0_0, ViewerFileLoader);

/**
 * Loads an entire viewer file, and returns the result. For
 * viewer file version 1.0.0, the result is just a Show object.
 *
 * @param {object} viewerFileObject The main object from a
 *   viewer file.
 * @return {Show} The show described by the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.loadViewerFile = function (viewerFileObject) {
    return this.loadShow(viewerFileObject.show);
};

/**
 * Loads a show from a viewer file.
 *
 * @param {object} showToLoad The show object, as it is represented
 *   in the JSON viewer file.
 * @return {Show} The show represented in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.loadShow = function(showToLoad) {
    var show = new Show(showToLoad.title, showToLoad.year, showToLoad.description, showToLoad.dot_labels);
    this.loadSheets(show, showToLoad.sheets);
    return show;
};

/**
 * Builds the stuntsheets represented in the viewer file, and appends them
 * to the show.
 *
 * @param {Show} show The show to append the sheets to.
 * @param {object} sheetsToLoad The show.sheets array in the viewer
 *   file.
 */
ViewerFileLoad_1_0_0.prototype.loadSheets = function(show, sheetsToLoad) {
    for (var index = 0; index < sheetsToLoad.length; index++) {
        show.appendSheet(this.buildIndividualSheet(sheetsToLoad[index]));
    }
};

/**
 * Builds a stuntsheet that is represented in the viewer file.
 *
 * @param {object} sheetToBuild The object representing the stuntsheet
 *   in the viewer file.
 * @return {Sheet} The Sheet object represented in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.buildIndividualSheet = function(sheetToBuild) {
    return new Sheet(sheetToBuild.label, sheetToBuild.field_type, sheetToBuild.dot_types, sheetToBuild.dot_labels, sheetToBuild.continuities, sheetToBuild.beats, this.buildDots(sheetToBuild.movements));
};

/**
 * Builds the dots for a particular stuntsheet from their
 * representations in the viewer file.
 *
 * @param {object} dotsToBuild An array with all of the dots for the sheet,
 *   as represented in the viewer file.
 * @return {array} An array of all dots on the sheet.
 */
ViewerFileLoad_1_0_0.prototype.buildDots = function(dotsToBuild) {
    var allDots = [];
    for (var dotLabel in dotsToBuild) {
        allDots.push(new Dot(dotLabel, this.buildDotMovements(dotsToBuild[dotLabel])));
    }
    return allDots;
};

/**
 * Builds an array of movements for a particular dot from their
 * representations in the viewer file.
 *
 * @param {object} movementsToBuild An array of all of the movements
 *   executed by the dot, as represented in the viewer file.
 * @return {array} An array of all MovementCommands that the
 *   dot will execute.
 */
ViewerFileLoad_1_0_0.prototype.buildDotMovements = function(movementsToBuild) {
    var allMovements = [];
    for (var index = 0; index < movementsToBuild.length; index++) {
        allMovements.push(this.buildIndividualMovement(movementsToBuild[index]));
    }
    return allMovements;
};

/**
 * Builds a MovementCommand from its representation
 * in the viewer file.
 *
 * @param {object} movementToBuild The movement to build, as
 *   represented in the viewer file.
 * @return {MovementCommand} The MovementCommand that was
 *   represented in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.buildIndividualMovement = function(movementToBuild) {
    switch (movementToBuild.type) {
        case "stand":
            return this.buildStandMovement(movementToBuild);
        case "mark":
            return this.buildMarkMovement(movementToBuild);
        case "move":
            return this.buildMoveMovement(movementToBuild);
        case "goto":
            return this.buildGotoMovement(movementToBuild);
        case "arc":
            return this.buildArcMovement(movementToBuild);
        case "even":
            return this.buildEvenMovement(movementToBuild);
        default:
            throw new TypeError("Movement type unrecognized.");
    }
};

/**
 * Builds a MovementCommandStand from its representation in
 * a viewer file.
 *
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandStand} The MovementCommandStand represented
 *   in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.buildStandMovement = function(movementToBuild) {
    return new MovementCommandStand(movementToBuild.x, movementToBuild.y, movementToBuild.facing, movementToBuild.beats);
};

/**
 * Builds a MovementCommandMarkTime from its representation in
 * a viewer file.
 *
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandMarkTime} The MovementCommandMarkTime represented
 *   in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.buildMarkMovement = function(movementToBuild) {
    return new MovementCommandMarkTime(movementToBuild.x, movementToBuild.y, movementToBuild.facing, movementToBuild.beats);
};

/**
 * Builds a MovementCommandMove from its representation in
 * a viewer file.
 *
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandMove} The MovementCommandMove represented
 *   in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.buildMoveMovement = function(movementToBuild) {
    return new MovementCommandMove(movementToBuild.start_x, movementToBuild.start_y, movementToBuild.step_size, movementToBuild.direction, movementToBuild.facing, movementToBuild.beats, movementToBuild.beats_per_step);
};

/**
 * Builds a MovementCommandGoto from its representation in
 * a viewer file.
 *
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandGoto} The MovementCommandGoto represented
 *   in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.buildGotoMovement = function(movementToBuild) {
    return new MovementCommandGoto(movementToBuild.from_x, movementToBuild.from_y, movementToBuild.to_x, movementToBuild.to_y, movementToBuild.facing, movementToBuild.beats);
};

/**
 * Builds a MovementCommandArc from its representation in
 * a viewer file.
 *
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandArc} The MovementCommandArc represented
 *   in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.buildArcMovement = function(movementToBuild) {
    return new MovementCommandArc(movementToBuild.start_x, movementToBuild.start_y, movementToBuild.center_x, movementToBuild.center_y, movementToBuild.angle, movementToBuild.facing_offset, movementToBuild.beats, movementToBuild.beats_per_step);
};

/**
 * Builds a MovementCommandEven from its representation in
 * a viewer file.
 *
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandEven} The MovementCommandEven represented
 *   in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.buildEvenMovement = function(movementToBuild) {
    return new MovementCommandEven(movementToBuild.x1, movementToBuild.y1, movementToBuild.x2, movementToBuild.y2, movementToBuild.facing, movementToBuild.beats, movementToBuild.beats_per_step);
};

module.exports = ViewerFileLoadSelector;