/**
 * @fileOverview Defines the Coordinate struct.
 */

/**
 * Coordinate struct
 * A two-dimensional coordinate: {x: __,y: __}.
 * @param {Number} x The x component of the coordinate.
 * @param {Number} y The y component of the coordinate.
 */
var Coordinate = function(x, y) {
	this.x = x;
	this.y = y;
}

module.exports = Coordinate;