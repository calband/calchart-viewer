/**
 * @fileOverview Defines the MovementCommandMarkTime class.
 */

var ClassUtils = require("./ClassUtils");
var MovementCommand = require("./MovementCommand");
var AnimationState = require("./AnimationState");

/**
 * A MovementCommand that represents a period of mark time.
 *
 * @param {float} x The x position where the mark time takes place.
 * @param {float} y The y position where the mark time takes place.
 * @param {float} orientation The direction toward which the marcher
 *   faces while marking time. This is measured in degrees,
 *   relative to Grapher standard position (@see MathUtils.js
 *   for a definition of "Grapher standard position").
 * @param {int} beats The duration of the movement, in beats.
 */
var MovementCommandMarkTime = function(x, y, orientation, beats) {
    this._orientation = orientation;
    MovementCommand.apply(this, [x, y, x, y, beats]);
};

ClassUtils.extends(MovementCommandMarkTime, MovementCommand);

MovementCommandMarkTime.prototype.getAnimationState = function(beatNum) {
    return new AnimationState(this._startX, this._startY, this._orientation);
};

/**
 * Returns the continuity text for this movement
 * @return {String} the continuity text in the form "MT 16E"
 */
MovementCommandMarkTime.prototype.getContinuityText = function() {
    var orientation = this._orientation;
    switch (orientation) {
        case 0:
            orientation = "E";
            break;
        case 90:
            orientation = "S";
            break;
        case 180:
            orientation = "W";
            break;
        case 270:
            orientation = "N";
            break;
        default:
            orientation = "";
    }
    return (this._numBeats == 0) ? "" : "MT " + this._numBeats + orientation;
};

module.exports = MovementCommandMarkTime;