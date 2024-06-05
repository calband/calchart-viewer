/**
 * @fileOverview Defines the MovementCommandClose class.
 */

var JSUtils = require("./utils/JSUtils");
var MovementCommand = require("./MovementCommand");
var AnimationState = require("./AnimationState");
 
/**
 * A MovementCommand representing being closed.
 * @param {float} x The x coordinate to stand at.
 * @param {float} y The y coordinate to stand at.
 * @param {float} orientation The angle at which the marcher will
 *   face while standing. This is measured in degrees relative
 *   to Grapher standard position (@see MathUtils.js for a definition
 *   of "grapher standard position).
 * @param {int} beats The duration of the movement, in beats.
 */
var MovementCommandClose = function(x, y, orientation, beats) {
    this._orientation = orientation;
    MovementCommand.apply(this, [x, y, x, y, beats]);
};

JSUtils.extends(MovementCommandClose, MovementCommand);

MovementCommandClose.prototype.getAnimationState = function(beatNum) {
    return new AnimationState(this._startX, this._startY, this._orientation);
};

/**
 * Returns the continuity text for this movement
 * @return {String} the continuity text in the form of "Close E"
 */
MovementCommandClose.prototype.getContinuityText = function() {
    return "Close " + this.getOrientation();
};

module.exports = MovementCommandClose;