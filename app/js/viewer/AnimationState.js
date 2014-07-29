/**
 * AnimationState struct
 * The AnimationState describes the state of a dot at a specific time
 * in the show. It contains all information required to properly draw
 * the dot in the grapher.
 * @param {Number} posX The x position of the dot.
 * @param {Number} posY The y position of the dot.
 * @param {Number} facingAngle The angle at which the dot is oriented.
 **/
var AnimationState = function(posX, posY, facingAngle) {
	this.x = posX;
	this.y = posY;
	this.angle = facingAngle;
}