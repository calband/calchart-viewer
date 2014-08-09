/**
 * @fileOverview Defines various functions and constants that are
 *   useful in mathematical calculations.
 *
 * NOTES ABOUT THE COORDINATE SYSTEM USED:
 * Unless otherwise specified, all coordinates are expected to be
 * measured according to the coordinate system used by the Grapher.
 * That is, the positive y-axis points downward, and the positive
 * x-axis points rightward.
 
 * NOTES ABOUT ANGLE MEASUREMENT:
 * Unless otherwise specified, angles are measured in the same way
 * as they are measured for the Grapher: clockwise from the positive
 * y-axis. Thoughout this file, this angle measurement scheme will be
 * referred to as being relative to "Grapher standard position."
 */

 
/**
 * The collection of all of the utility functions and constants defined in this
 * file.
 * @type {object}
 */
MathUtils = {};

 
//=============================================
//===============-- CONSTANTS
//=============================================
 
/**
 * PI/2
 * @type {float}
 */
MathUtils.PI_OVER_TWO = Math.PI / 2;

/**
 * 2*PI
 * @type {float}
 */
MathUtils.TWO_PI = Math.PI * 2;

/**
 * When multiplied by an angle measured in degrees,
 * this will produce an equivalent angle measured
 * in radians.
 * @type {float}
 */
MathUtils.DEGREES_TO_RADIANS_CONV_FACTOR = Math.PI/180;

/**
 * When multiplied by an angle measured in radians,
 * this will produce an equivalent angle measured
 * in degrees.
 * @type {float}
 */
MathUtils.RADIANS_TO_DEGREES_CONV_FACTOR = 1 / MathUtils.DEGREES_TO_RADIANS_CONV_FACTOR;

//=============================================
//===============-- FUNCTIONS
//=============================================

/**
 * Calculates the squared distance between two points.
 *
 * @param {float} fromX The x coordinate of the first point.
 * @param {float} fromY The y coordinate of the first point.
 * @param {float} toX The x coordinate of the second point.
 * @param {float} toY The y coordinate of the second point.
 * @return {float} The squared distance between points:
 *   {fromX, fromY} and  {toX, toY}.
 */
MathUtils.calcSquaredDistance = function(fromX, fromY, toX, toY) {
    var deltaX = toX - fromX;
    var deltaY = toY - fromY;
    return (deltaX * deltaX) + (deltaY * deltaY);
};

/**
 * Calculates the distance between two points.
 *
 * @param {float} fromX The x coordinate of the first point.
 * @param {float} fromY The y coordinate of the first point.
 * @param {float} toX The x coordinate of the second point.
 * @param {float} toY The y coordinate of the second point.
 * @return {float} The distance between points:
 *   {fromX, fromY} and  {toX, toY}.
 */
MathUtils.calcDistance = function(fromX, fromY, toX, toY) {
    return Math.sqrt(this.calcSquaredDistance(fromX, fromY, toX, toY));
};

/**
 * Calculates the angle toward which a vector is facing, in radians.
 * The angle is measured relative to Grapher standard position.
 *
 * @param {float} vectorX The x component of the vector.
 * @param {float} vectorY The y component of the vector.
 * @return {float} The angle toward which the vector is pointing, in
 * radians.
 */
MathUtils.calcAngle = function(vectorX, vectorY) {
    var angle = Math.atan(-vectorX / vectorY);
    if (vectorY < 0) {
        angle += Math.PI;
    }
    return angle;
};

/**
 * Returns the angle to which a point has been rotated
 * around a center.
 *
 * @param {float} pointX The x coordinate of the rotated point.
 * @param {float} pointY The y coordinate of the rotated point.
 * @param {float} centerX The x coordinate of the center.
 * @param {float} centerY The y coordinate of the center.
 * @return {float} The angle to which a point has been rotated
 *   around a center. The angle is measured in radians,
 *   relative to Grapher standard position.
 */
MathUtils.calcAngleAbout = function(pointX, pointY, centerX, centerY) {
    return this.calcAngle(pointX - centerX, pointY - centerY);
};

/**
 * Calculates the x position of a point rotated along the unit
 * circle by an angle measured relative to Grapher standard
 * position.
 *
 * @param {float} angle The angle by which to rotate the point,
 *   measured in radians relative to Grapher standard position.
 * @return {float} The final x position of the point, rotated along the
 *   unit circle.
 */
MathUtils.calcRotatedXPos = function(angle) {
    return -Math.sin(angle);
};

/**
 * Calculates the y position of a point rotated along the unit
 * circle by an angle measured relative to Grapher standard
 * position.
 *
 * @param {float} angle The angle by which to rotate the point,
 *   measured in radians relative to Grapher standard position.
 * @return {float} The final y position of the point, rotated along the
 *   unit circle.
 */
MathUtils.calcRotatedYPos = function(angle) {
    return Math.cos(angle);
};

/**
 * Rotates an angle by a quarter-turn in
 * a specified direction.
 *
 * @param {float} angle The angle to rotate, in radians.
 * @param {bool} isCW True if the angle should be
 *   rotated clockwise; false if the angle should 
 *   be rotated counter-clockwise.
 * @return The angle, rotated by a quarter turn.
 *   This angle is measured in radians.
 */
MathUtils.quarterTurn = function(angle, isCW) {
    return angle + ((isCW * 2 - 1) * this.PI_OVER_TWO);
};

/**
 * For an angle measured in degrees, will
 * find an equivalent angle between 0
 * and 360 degrees.
 *
 * @param {float} angle An angle measured in degrees.
 * @return {float} An equivalent angle between 0 and
 *   360 degrees.
 */
MathUtils.wrapAngleDegrees = function(angle) {
    while (angle >= 360) {
        angle -= 360;
    }
    while (angle < 0) {
        angle += 360;
    }
    return angle;
};

/**
 * For an angle measured in radians, will
 * find an equivalent angle between 0
 * and 2*PI radians.
 *
 * @param {float} angle An angle measured in radians.
 * @return {float} An equivalent angle between
 *   0 and 2*PI radians.
 */
MathUtils.wrapAngleRadians = function(angle) {
    while (angle >= TWO_PI) {
        angle -= this.TWO_PI;
    }
    while (angle < 0) {
        angle += this.TWO_PI;
    }
    return angle;
};

/**
 * Converts an angle measured in degrees to one
 * measured in radians.
 *
 * @param {float} angle An angle, measured in degrees.
 * @return {float} The angle, measured in radians.
 */
MathUtils.toRadians = function(angle) {
    return angle * this.DEGREES_TO_RADIANS_CONV_FACTOR;
};

/**
 * Converts an angle measured in radians to one
 * measured in degrees.
 *
 * @param {float} angle An angle, measured in radians.
 * @return {float} The angle, measured in degrees.
 */
MathUtils.toDegrees = function(angle) {
    return angle * this.RADIANS_TO_DEGREES_CONV_FACTOR;
};

module.exports = MathUtils;
