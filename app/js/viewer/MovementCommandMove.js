/**
 * @fileOverview Defines the MovementCommandMove class.
 */

var ClassUtils = require("./ClassUtils");
var MathUtils = require("./MathUtils");
var MovementCommand = require("./MovementCommand");
var AnimationState = require("./AnimationState");
 
/**
 * A MovementCommand which represents a constant movement in a
 * particular direction.
 *
 * @param {float} startX The x component of the movement's start position.
 * @param {float} startY The y component of the movement's start position.
 * @param {float} stepSize the size of each step, relative to standard
 *   stepsize (standard stepsize is 8 steps per 5 yards).
 * @param {float} movementDirection The direction toward which the marcher
 *   will move. This is measured in degrees relative to Grapher standard
 *   position (@see MathUtils.js for a definition of "Grapher standard
 *   position").
 * @param {float} faceOrientation the direction toward which the marcher
 *   will face while executing the movement. This is measured in degrees,
 *   relative to Grapher standard position.
 * @param {int} beats The duration of the movement, in beats.
 * @param {int} beatsPerStep the number of beats per each step of the movement.
 */ 
var MovementCommandMove = function(startX, startY, stepSize, movementDirection, faceOrientation, beats, beatsPerStep) {
    movementDirection = MathUtils.toRadians(movementDirection);
    this._deltaXPerStep = MathUtils.calcRotatedXPos(movementDirection) * stepSize;
    this._deltaYPerStep = MathUtils.calcRotatedYPos(movementDirection) * stepSize;
    this._orientation = faceOrientation;
    this._beatsPerStep = beatsPerStep;
    numSteps = Math.floor(beats / this._beatsPerStep);
    MovementCommand.apply(this, [startX, startY, startX + (this._deltaXPerStep * numSteps), startY + (this._deltaYPerStep * numSteps), beats]);
};

ClassUtils.extends(MovementCommandMove, MovementCommand);

MovementCommandMove.prototype.getAnimationState = function(beatNum) {
    numSteps = Math.floor(beatNum / this._beatsPerStep);
    return new AnimationState(this._startX + (this._deltaXPerStep * numSteps), this._startY + (this._deltaYPerStep * numSteps), this._orientation);
};

module.exports = MovementCommandMove;