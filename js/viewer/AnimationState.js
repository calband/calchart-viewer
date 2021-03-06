/**
 * @fileOverview Defines the AnimationState struct.
 */

/**
 * An AnimationState struct describes the state of a dot at a specific time
 * in the show. It contains all information required to properly draw
 * the dot in the grapher.
 *
 * @param {float} posX The x position of the dot. (0 = south endzone)
 * @param {float} posY The y position of the dot. (0 = west sideline)
 * @param {float} facingAngle The angle at which the dot is oriented.
 */
var AnimationState = function(posX, posY, facingAngle) {
    this.x = posX;
    this.y = posY;
    this.angle = facingAngle;
};

module.exports = AnimationState;