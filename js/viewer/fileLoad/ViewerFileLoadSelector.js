/**
 * @fileOverview This file describes how viewer files are loaded.
 *   A singleton of the ViewerFileLoadSelector class
 *   is used to determine how to load a specific version of the
 *   viewer file. For more information about how a FileLoadSelector
 *   like the ViewerFileLoadSelector works, @see FileLoadSelector.js.
 *   Here are the steps that you should follow when the file format
 *   changes:
 *     - Define a FileLoadSelector.FileLoader that can load the
 *         new file version
 *     - Register your new file loader in 
 *         ViewerFileLoadSelector._setupInstance(...)
 *   
 */

var FileLoadSelector = require("./FileLoadSelector");
var InvalidFileTypeError = require("./InvalidFileTypeError");
var JSUtils = require("../utils/JSUtils");
var Version = require("../Version");
var Dot = require("../Dot");
var Sheet = require("../Sheet");
var Show = require("../Show");
var MovementCommandStand = require("../MovementCommandStand");
var MovementCommandClose = require("../MovementCommandClose");
var MovementCommandMarkTime = require("../MovementCommandMarkTime");
var MovementCommandArc = require("../MovementCommandArc");
var MovementCommandMove = require("../MovementCommandMove");
var MovementCommandGoto = require("../MovementCommandGoto");
var MovementCommandEven = require("../MovementCommandEven");
 
/**
 * Every version of the Viewer File needs to be loaded in a different way -
 * this class is responsible for finding the appropriate ViewerFileLoader
 * object for loading a particular Viewer File version.
 */
var ViewerFileLoadSelector = function() {
    FileLoadSelector.apply(this, []);
};

JSUtils.extends(ViewerFileLoadSelector, FileLoadSelector);

/**
 * The ViewerFileLoadSelector is a singleton, and this is its
 * instance.
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
 * This class is responsible for loading viewer files of a particular version.
 */
ViewerFileLoadSelector.ViewerFileLoader = function() {
};

JSUtils.extends(ViewerFileLoadSelector.ViewerFileLoader, FileLoadSelector.FileLoader); 


/**
 *=================================================================
 *====================-- LOAD VIEWER FILE 1.0.0
 *=================================================================
 * ALL AVAILABLE METHODS IN THIS VERSION:
 *   loadFile
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
 * To use: call the loadFile method.
 */
var ViewerFileLoad_1_0_0 = function() {
};

JSUtils.extends(ViewerFileLoad_1_0_0, ViewerFileLoadSelector.ViewerFileLoader);

/**
 * Loads an entire viewer file, and returns the result. For
 * viewer file version 1.0.0, the result is just a Show object.
 *
 * @param {object} viewerFileObject The main object from a
 *   viewer file.
 * @return {Show} The show described by the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.loadFile = function (viewerFileObject) {
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
    if (typeof showToLoad === "undefined") {
        throw new InvalidFileTypeError("Please upload a proper viewer file.");
    }
    var show = new Show(showToLoad.title, showToLoad.year, showToLoad.description, showToLoad.labels);
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
    return new Sheet(
        sheetToBuild.label,
        sheetToBuild.field_type,
        sheetToBuild.dot_types,
        sheetToBuild.dot_labels,
        sheetToBuild.continuities,
        sheetToBuild.beats,
        this.buildDots(sheetToBuild.movements),
        Object.keys(sheetToBuild.movements)
    );
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
        case "close":
            return this.buildCloseMovement(movementToBuild);
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
 * Builds a MovementCommandClose from its representation in
 * a viewer file.
 *
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandClose} The MovementCommandClose represented
 *   in the viewer file.
 */
ViewerFileLoad_1_0_0.prototype.buildCloseMovement = function(movementToBuild) {
    return new MovementCommandClose(movementToBuild.x, movementToBuild.y, movementToBuild.facing, movementToBuild.beats);
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