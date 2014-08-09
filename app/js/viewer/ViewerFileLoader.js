/**
 * @fileOverview Defines the ViewerFileLoader object, which can load a
 *   viewer file of any version.
 */

var Version = require("./Version");
var VersionManager = require("./VersionManager");
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
 * Used to load all versions of viewer files. It tracks changes
 * to the file format and can choose the appropriate loading
 * functions for any given file version.
 * @type {VersionManager}
 */
var ViewerFileLoader = new VersionManager();

//=============================================
//===============-- VIEWER FILE 1.0.0
//=============================================

var version = new Version(1, 0, 0);

/**
 * Loads an entire viewer file, and returns the result. For
 * viewer file version 1.0.0, the result is just a Show object.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file.
 * @param {object} viewerFileObject The main object from a
 *   viewer file.
 * @return {Show} The show described by the viewer file.
 */
ViewerFileLoader.record("loadViewerFile", version, function(fileLoader, viewerFileObject) {
    return fileLoader.loadShow(fileLoader, viewerFileObject.show);
});

/**
 * Loads a show from a viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file.
 * @param {object} showToLoad The show object in the viewer file.
 * @return {Show} The show represented in the viewer file.
 */
ViewerFileLoader.record("loadShow", version, function(fileLoader, showToLoad) {
    var show = new Show(showToLoad.title, showToLoad.year, showToLoad.description, showToLoad.dot_labels);
    fileLoader.loadSheets(fileLoader, show, showToLoad.sheets);
    return show;
});

/**
 * Builds the stuntsheets represented in the viewer file, and appends them
 * to the show.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file.
 * @param {Show} show The show to append the sheets to.
 * @param {object} sheetsToLoad The show.sheets array in the viewer
 *   file.
 */
ViewerFileLoader.record("loadSheets", version, function(fileLoader, show, sheetsToLoad) {
    for (var index = 0; index < sheetsToLoad.length; index++) {
        show.appendSheet(fileLoader.buildIndividualSheet(fileLoader, sheetsToLoad[index]));
    }
});

/**
 * Builds a stuntsheet that is represented in the viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file.
 * @param {object} sheetToBuild The object representing the stuntsheet
 *   in the viewer file.
 * @return {Sheet} The Sheet object represented in the viewer file.
 */
ViewerFileLoader.record("buildIndividualSheet", version, function(fileLoader, sheetToBuild) {
    return new Sheet(sheetToBuild.label, sheetToBuild.field_type, sheetToBuild.dot_types, sheetToBuild.dot_labels, sheetToBuild.continuities, sheetToBuild.beats, fileLoader.buildDots(fileLoader, sheetToBuild.movements));
});

/**
 * Builds the dots for a particular stuntsheet from their
 * representations in the viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file.
 * @param {object} dotsToBuild An array with all of the dots for the sheet,
 *   as represented in the viewer file.
 * @return {array} An array of all dots on the sheet.
 */
ViewerFileLoader.record("buildDots", version, function(fileLoader, dotsToBuild) {
    var allDots = [];
    for (var dotLabel in dotsToBuild) {
        allDots.push(new Dot(dotLabel, fileLoader.buildDotMovements(fileLoader, dotsToBuild[dotLabel])));
    }
    return allDots;
});

/**
 * Builds an array of movements for a particular dot from their
 * representations in the viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file.
 * @param {object} movementsToBuild An array of all of the movements
 *   executed by the dot, as represented in the viewer file.
 * @return {array} An array of all MovementCommands that the
 *   dot will execute.
 */
ViewerFileLoader.record("buildDotMovements", version, function(fileLoader, movementsToBuild) {
    var allMovements = [];
    for (var index = 0; index < movementsToBuild.length; index++) {
        allMovements.push(fileLoader.buildIndividualMovement(fileLoader, movementsToBuild[index]));
    }
    return allMovements;
});

/**
 * Builds a MovementCommand from its representation
 * in the viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file.
 * @param {object} movementToBuild The movement to build, as
 *   represented in the viewer file.
 * @return {MovementCommand} The MovementCommand that was
 *   represented in the viewer file.
 */
ViewerFileLoader.record("buildIndividualMovement", version, function(fileLoader, movementToBuild) {
    switch (movementToBuild.type) {
        case "stand":
            return fileLoader.buildStandMovement(fileLoader, movementToBuild);
        case "mark":
            return fileLoader.buildMarkMovement(fileLoader, movementToBuild);
        case "move":
            return fileLoader.buildMoveMovement(fileLoader, movementToBuild);
        case "goto":
            return fileLoader.buildGotoMovement(fileLoader, movementToBuild);
        case "arc":
            return fileLoader.buildArcMovement(fileLoader, movementToBuild);
        case "even":
            return fileLoader.buildEvenMovement(fileLoader, movementToBuild);
    }
});

/**
 * Builds a MovementCommandStand from its representation in
 * a viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file. Though unused here,
 *   this is provided as a parameter just in case it is needed for
 *   the loading of future viewer file versions.
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandStand} The MovementCommandStand represented
 *   in the viewer file.
 */
ViewerFileLoader.record("buildStandMovement", version, function(fileLoader, movementToBuild) {
    return new MovementCommandStand(movementToBuild.x, movementToBuild.y, movementToBuild.facing, movementToBuild.beats);
});

/**
 * Builds a MovementCommandMarkTime from its representation in
 * a viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file. Though unused here,
 *   this is provided as a parameter just in case it is needed for
 *   the loading of future viewer file versions.
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandMarkTime} The MovementCommandMarkTime represented
 *   in the viewer file.
 */
ViewerFileLoader.record("buildMarkMovement", version, function(fileLoader, movementToBuild) {
    return new MovementCommandMarkTime(movementToBuild.x, movementToBuild.y, movementToBuild.facing, movementToBuild.beats);
});

/**
 * Builds a MovementCommandMove from its representation in
 * a viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file. Though unused here,
 *   this is provided as a parameter just in case it is needed for
 *   the loading of future viewer file versions.
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandMove} The MovementCommandMove represented
 *   in the viewer file.
 */
ViewerFileLoader.record("buildMoveMovement", version, function(fileLoader, movementToBuild) {
    return new MovementCommandMove(movementToBuild.start_x, movementToBuild.start_y, movementToBuild.step_size, movementToBuild.direction, movementToBuild.facing, movementToBuild.beats, movementToBuild.beats_per_step);
});

/**
 * Builds a MovementCommandGoto from its representation in
 * a viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file. Though unused here,
 *   this is provided as a parameter just in case it is needed for
 *   the loading of future viewer file versions.
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandGoto} The MovementCommandGoto represented
 *   in the viewer file.
 */
ViewerFileLoader.record("buildGotoMovement", version, function(fileLoader, movementToBuild) {
    return new MovementCommandGoto(movementToBuild.from_x, movementToBuild.from_y, movementToBuild.to_x, movementToBuild.to_y, movementToBuild.facing, movementToBuild.beats);
});

/**
 * Builds a MovementCommandArc from its representation in
 * a viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file. Though unused here,
 *   this is provided as a parameter just in case it is needed for
 *   the loading of future viewer file versions.
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandArc} The MovementCommandArc represented
 *   in the viewer file.
 */
ViewerFileLoader.record("buildArcMovement", version, function(fileLoader, movementToBuild) {
    return new MovementCommandArc(movementToBuild.start_x, movementToBuild.start_y, movementToBuild.center_x, movementToBuild.center_y, movementToBuild.angle, movementToBuild.facing_offset, movementToBuild.beats, movementToBuild.beats_per_step);
});

/**
 * Builds a MovementCommandEven from its representation in
 * a viewer file.
 *
 * @param {object} fileLoader An object containing all of the
 *   functions necessary for loading a viewer file. Though unused here,
 *   this is provided as a parameter just in case it is needed for
 *   the loading of future viewer file versions.
 * @param {object} movementToBuild The MovementCommand's representation
 *   in the viewer file.
 * @return {MovementCommandEven} The MovementCommandEven represented
 *   in the viewer file.
 */
ViewerFileLoader.record("buildEvenMovement", version, function(fileLoader, movementToBuild) {
    return new MovementCommandEven(movementToBuild.x1, movementToBuild.y1, movementToBuild.x2, movementToBuild.y2, movementToBuild.facing, movementToBuild.beats, movementToBuild.beats_per_step);
});

module.exports = ViewerFileLoader;