/**
 * @fileOverview Defines the MovementCommandEven class.
 */

var ClassUtils = require("./ClassUtils");
var MovementCommand = require("./MovementCommand");
var AnimationState = require("./AnimationState");
 
 
/**
 * A MovementCommand that defines an even-step transition between
 * two points.
 *
 * @param {float} startX The x component of the movement's start position.
 * @param {float} startY The y component of the movement's start position.
 * @param {float} endX The x component of the movement's end position.
 * @param {float} endY The y component of the movement's end position.
 * @param {float} orientation The angle toward which the marcher is facing while
 *   executing the movement. The angle is measured in degrees relative to
 *   Grapher standard position. (@see MathUtils.js for definition of
 *   "Grapher standard position")
 * @param {int} beats The duration of the movement, in beats.
 * @param {int} beatsPerStep The number of beats per each step.
 */
var MovementCommandEven = function(startX, startY, endX, endY, orientation, beats, beatsPerStep) {
    this._orientation = orientation;
    this._beatsPerStep = beatsPerStep;
    var numSteps = Math.floor(beats / this._beatsPerStep);
    this._deltaXPerStep = (endX - startX) / numSteps;
    this._deltaYPerStep = (endY - startY) / numSteps;

    MovementCommand.apply(this, [startX, startY, endX, endY, beats]);
};

ClassUtils.extends(MovementCommandEven, MovementCommand);

MovementCommandEven.prototype.getAnimationState = function(beatNum) {
    var stepNum = Math.floor(beatNum / this._beatsPerStep);
    return new AnimationState(this._startX + (this._deltaXPerStep * stepNum), this._startY + (this._deltaYPerStep * stepNum), this._orientation);
};

/**
 * Returns the number of beats in this movement
 * @return {int}
 */
MovementCommandEven.prototype.getBeatsPerStep = function() {
    return this._beatsPerStep;
}

/**
 * Returns the continuity text for this movement
 * @return {String} the continuity text in the form "Even 8E, 4S" or "Move 8E" if
 * in one direction
 */
MovementCommandEven.prototype.getContinuityText = function() {
    var deltaX = this._endX - this._startX;
    var deltaY = this._endY - this._startY;
    var dirX = (deltaX < 0) ? "S" : "N";
    var dirY = (deltaY < 0) ? "W" : "E";
    var steps = this._numBeats / this._beatsPerStep;

    // Check if movement only in one direction and same number of steps as change in position
    if (deltaX == 0 && deltaY == steps) {
        return "Move " + Math.abs(deltaY) + dirY;
    } else if (deltaY == 0 && deltaX == steps) {
        return "Move " + Math.abs(deltaX) + dirX;
    }

    var text = "Even ";
    // If movement is a fraction of steps, simply say "NE" or "S"
    if (deltaX % 1 != 0 || deltaY % 1 != 0) {
        text += (deltaX != 0) ? dirX : "";
        text += (deltaY != 0) ? dirY : "";
    } else {
        // End result will be concat. of directions, e.g. "Even 8E, 4S"
        var moveTexts = [];
        if (deltaY != 0) {
            moveTexts.push(Math.abs(deltaY) + dirY);
        }
        if (deltaX != 0) {
            moveTexts.push(Math.abs(deltaX) + dirX);
        }
        text += moveTexts.join(", ");
    }
    // Error checking for an even move without movement in any direction
    if (text === "Even ") {
        text += "0";
    }
    return text + " (" + steps + " steps)";
};

module.exports = MovementCommandEven;