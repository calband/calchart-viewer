/**
 * @fileOverview Defines the MovementCommand class.
 */

var Coordinate = require("./Coordinate");

/**
 * MovementCommand class
 *
 * Represents an individual movement that a marcher executes during
 * a show.
 * 
 * This is an abstract class - do not make an instance of this
 * directly.
 *
 * @param {float} startX The x coordinate at which the movement starts.
 * @param {float} startY The y coordinate at which the movement starts.
 * @param {float} endX The x coordinate at which the movement starts.
 * @param {float} endY The y coordinate at which the movement starts.
 * @param {int} numBeats The duration of the movement, in beats. 
 **/
var MovementCommand = function(startX, startY, endX, endY, numBeats) {
    /**
     * The x component of the movement's start position, measured in
     * steps from the upper left corner of the field.
     * @type {float}
     */
    this._startX = startX;
    
    /**
     * The y component of the movement's start position, measured in
     * steps from the upper left corner of the field.
     * @type {float}
     */
    this._startY = startY;
    
    /**
     * The x component of the movement's end position, measured in
     * steps from the upper left corner of the field.
     * @type {float}
     */
    this._endX = endX;
    
    /**
     * The y component of the movement's end position, measured in
     * steps from the upper left corner of the field.
     * @type {float}
     */
    this._endY = endY;
    
    /**
     * The duration of the command, in beats.
     * @type {int}
     */
    this._numBeats = numBeats;
};

/**
 * Returns the position at which this movement starts.
 *
 * @return {Coordinate} The position where the movement begins.
 */
MovementCommand.prototype.getStartPosition = function() {
        return new Coordinate(this._startX, this._startY);
};

/**
 * Returns the position at which this movement ends.
 *
 * @return {Coordinate} The position where the movement ends.
 */
MovementCommand.prototype.getEndPosition = function() {
    return new Coordinate(this._endX, this._endY);
};

/**
 * Returns the number of beats required to complete this
 * command.
 *
 * @return {int} The duration of this command, in beats.
 */
MovementCommand.prototype.getBeatDuration = function() {
    return this._numBeats;
};

/**
 * Returns an AnimationState describing a marcher
 * who is executing this movement.
 *
 * @param {int} beatNum The beat of this movement that
 * the marcher is currently executing (relative
 * to the start of the movement).
 * @return {AnimationState} An AnimationState describing
 * a marcher who is executing this movement.
 */
MovementCommand.prototype.getAnimationState = function(beatNum) {
    console.log("getAnimationState called");
};

/**
 * Returns the orientation of this MovementCommand, however
 * this MovementCommand interprets "orientation" as, or null if
 * this MovementCommand doesn't interpret orientation
 */
MovementCommand.prototype.getOrientation = function() {
    if (typeof this._orientation !== "undefined") {
        return this._orientation;
    } else if (this._movementIsCW !== "undefined") {
        return this._movementIsCW ? "CW" : "CCW";
    } else {
        return null;
    }
};

module.exports = MovementCommand;