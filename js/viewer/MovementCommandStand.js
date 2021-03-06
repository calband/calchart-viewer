/**
 * @fileOverview Defines the MovementCommandStand class.
 */

var JSUtils = require("./utils/JSUtils");
var MovementCommand = require("./MovementCommand");
var AnimationState = require("./AnimationState");
 
/**
 * A MovementCommand representing a period of standing.
 * @param {float} x The x coordinate to stand at.
 * @param {float} y The y coordinate to stand at.
 * @param {float} orientation The angle at which the marcher will
 *   face while standing. This is measured in degrees relative
 *   to Grapher standard position (@see MathUtils.js for a definition
 *   of "grapher standard position).
 * @param {int} beats The duration of the movement, in beats.
 */
var MovementCommandStand = function(x, y, orientation, beats) {
    this._orientation = orientation;
    MovementCommand.apply(this, [x, y, x, y, beats]);
};

JSUtils.extends(MovementCommandStand, MovementCommand);

MovementCommandStand.prototype.getAnimationState = function(beatNum) {
    return new AnimationState(this._startX, this._startY, this._orientation);
};

/**
 * Returns the continuity text for this movement
 * @return {String} the continuity text in the form of "Close 16E"
 */
MovementCommandStand.prototype.getContinuityText = function() {
    return "Close " + this._numBeats + this.getOrientation();
};

module.exports = MovementCommandStand;