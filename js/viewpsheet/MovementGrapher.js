/**
 * @fileOverview Defines the MovementGrapher class.
 */

var JSUtils = require("../viewer/utils/JSUtils");
var Grapher = require("../viewer/Grapher");
var MovementViewport = require("./MovementViewport");

/**
 * A MovementGrapher is a Grapher for the movement diagram widget in the
 * viewpsheet.
 *
 * @param {jQuery} stuntsheet The HTML element for the current stuntsheet
 */
var MovementGrapher = function(stuntsheet) {
    var drawTarget = stuntsheet.find(".movement-diagram .graph");
    Grapher.apply(this, ["college", drawTarget]);
};

JSUtils.extends(MovementGrapher, Grapher);

/**
 * Draws the movement diagram for the given stuntsheet and dot.
 */
MovementGrapher.prototype.draw = function(sheet, dot) {
    var movements = this._getMovements(sheet, dot);
    this.viewport = new MovementViewport(this._drawTarget, movements);
    Grapher.prototype.draw.apply(this, []);
};

/**
 * Returns a list of movements for the given stuntsheet and dot, which are changes
 * in position with respect to the previous position
 *
 * @return {Array<Object>} where each element is an object containing:
 *      - {Coordinate} startPosition
 *      - {int} deltaX
 *      - {int} deltaY
 */
MovementGrapher.prototype._getMovements = function(sheet, dot) {
    var lines = [];
    var movements = sheet.getDotByLabel(dot).getMovementCommands();
    var startPosition = movements[0].getStartPosition();

    movements.forEach(function(movement) {
        var endPosition = movement.getEndPosition();
        if (typeof movement === "MovementCommandArc") {
            // treat arc as series of lines, each line corresponding to a step
            movement.getMiddlePoints().forEach(function(move) {
                lines.push({
                    startPosition: startPosition,
                    deltaX: move[0],
                    deltaY: move[1]
                });
            });
        } else {
            lines.push({
                startPosition: startPosition,
                deltaX: endPosition.x - startPosition.x,
                deltaY: endPosition.y - startPosition.y
            });
        }
        startPosition = endPosition;
    });

    return lines;
};

module.exports = MovementGrapher;
