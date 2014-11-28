/**
 * @fileOverview Defines the MovementCommandGoto class.
 */

var JSUtils = require("./JSUtils");
var MovementCommand = require("./MovementCommand");
var AnimationState = require("./AnimationState");
 
/**
 * A MovementCommand that represents a "Goto" movement:
 * dots executing this movement simply jump to the movement's final
 * position and orientation at every beat of the movement.
 *
 * @param {float} startX The x component of the movement's start position.
 * @param {float} startY The y component of the movement's start position.
 * @param {float} endX The x component of the movement's end position.
 * @param {float} endY The y component of the movement's end position.
 * @param {float} orientation The direction in which the marcher will face
 *   while executing the movement. The direction is measured in degrees relative
 *   to Grapher standard position (@see MathUtils.js for the definition of
 *   "Grapher standard position").
 * @param {int} beats The duration of the movement, in beats.
 */
var MovementCommandGoto = function(startX, startY, endX, endY, orientation, beats) {
    this._orientation = orientation;
    MovementCommand.apply(this, [startX, startY, endX, endY, beats]);
};

JSUtils.extends(MovementCommandGoto, MovementCommand);

MovementCommandGoto.prototype.getAnimationState = function(beatNum) {
    return new AnimationState(this._endX, this._endY, this._orientation);
};

/**
 * Returns the continuity text for this movement
 * @return {String} the continuity text in the form of "See Continuity (16 beats)"
 */
MovementCommandGoto.prototype.getContinuityText = function() {
    return "See Continuity (" + this._numBeats + " beats)";
};

module.exports = MovementCommandGoto;