/**
 * @fileOverview Defines the MovementCommand class.
 */

var Coordinate = require("./Coordinate.js");

/**
 * MovementCommand class
 * Represents an individual movement that a marcher executes during
 * a show.
 * This is an abstract class - do not make an instance of this
 * directly.
 * @param {Number} startX The x coordinate at which the movement starts.
 * @param {Number} startY The y coordinate at which the movement starts.
 * @param {Number} endX The x coordinate at which the movement starts.
 * @param {Number} endY The y coordinate at which the movement starts.
 * @param {Number} numBeats The duration of the movement, in beats. 
 * This should be an integer.
 **/
var MovementCommand = function(startX, startY, endX, endY, numBeats) {
//--- CLASS DEFINITION ---

//public:

	/**
	 * getStartPosition() method
	 * Returns the position at which this movement starts.
	 * @returns {Coordinate} The position where the movement begins.
	 */
	this.getStartPosition = function() {
		return new Coordinate(mStartX, mStartY);
	}
	
	/**
	 * getEndPosition() method
	 * Returns the position at which this movement ends.
	 * @returns {Coordinate} The position where the movement ends.
	 */
	this.getEndPosition = function() {
		return new Coordinate(mEndX, mEndY);
	}
	
	/**
	 * getBeatDuration() method
	 * Returns the number of beats required to complete this
	 * command.
	 * @returns {Number} The duration of this command, in beats.
	 */
	this.getBeatDuration = function() {
		return mNumBeats;
	}
	
	/**
	 * getAnimationState(beatNum) method
	 * Returns an AnimationState describing a marcher
	 * who is executing this movement.
	 * @param {Number} beatNum The beat of this movement that
	 * the marcher is currently executing (relative
	 * to the start of the movement).
	 * @returns {AnimationState} An AnimationState describing
	 * a marcher who is executing this movement.
	 */
	this.getAnimationState = function(beatNum) {
		console.log("getAnimationState called");
	}
	
//private:

	/**
	 * mStartX member variable
	 * The x component of the position where this movment
	 * begins.
	 */
	var mStartX;
	
	/**
	 * mStartY member variable
	 * The y component of the position where this movement
	 * begins.
	 */
	var mStartY;
	
	/**
	 * mEndX member variable
	 * The x component of the position where this movement
	 * ends.
	 */
	var mEndX;
	
	/**
	 * mEndY member variable
	 * The y component of the position where this movement
	 * ends.
	 */
	var mEndY;
	
	/**
	 * mNumBeats member variable
	 * An integer representing the duration of this command,
	 * in beats.
	 */
	var mNumBeats;
	
	
//--- CONSTRUCTOR ---
	mStartX = startX;
	mStartY = startY;
	mEndX = endX;
	mEndY = endY;
	mNumBeats = numBeats;	
}


module.exports = MovementCommand;