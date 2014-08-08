/**
 * @fileOverview Defines the MovementCommandEven class.
 */

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
 *   grapher standard position. (@see MathUtils.js for definition of
 *   grapher standard position)
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
}

MovementCommandEven.prototype = new MovementCommand();

MovementCommandEven.prototype.getAnimationState = function(beatNum) {
    var stepNum = Math.floor(beatNum / this._beatsPerStep);
    return new AnimationState(this._startX + (this._deltaXPerStep * stepNum), this._startY + (this._deltaYPerStep * stepNum), this._orientation);
}

module.exports = MovementCommandEven;