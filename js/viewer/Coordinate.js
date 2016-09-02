/**
 * @fileOverview Defines the Coordinate struct.
 */

/**
 * A Coordinate struct marks a two-dimensional position:
 * {x: __,y: __}.
 *
 * @param {float} x The x component of the coordinate.
 * @param {float} y The y component of the coordinate.
 */
var Coordinate = function(x, y) {
    this.x = x;
    this.y = y;
};

module.exports = Coordinate;