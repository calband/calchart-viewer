/**
 * @fileOverview Defines the MovementViewport class.
 */

var SCALE = 5; // pixels per step
var MARGIN = 4; // number of steps between edge of viewport and any movements

/**
 * A MovementViewport holds and updates the bounds for a movement
 * diagram. The goal is, wherever the dot moves for a given stuntsheet,
 * to keep the movement within the bounds of the viewport and center it
 * within the viewport. Exposes the following properties:
 *
 *  - width: the width of the viewport (in steps)
 *  - height: the height of the viewport (in steps)
 *  - east: the number of steps from the east sideline to the edge of the viewport
 *  - west: the number of steps from the west sideline to the edge of the viewport
 *  - north: the number of steps from the north sideline to the edge of the viewport
 *  - south: the number of steps from the south sideline to the edge of the viewport
 *
 * @param {jQuery} container The HTML element containing the viewport
 * @param {Array<Object>} movements The list of movements, see
 *   MovementGrapher.prototype._getMovements
 */
var MovementViewport = function(container, movements) {
    this._minX = 0; // minX <= 0, maximum movement to the South sideline
    this._maxX = 0; // maxX >= 0, maximum movement to the North sideline
    this._minY = 0; // minY <= 0, maximum movement to the West sideline
    this._maxY = 0; // maxY >= 0, maximum movement to the East sideline

    this._deltaX = 0; // tracks cumulative change N/S
    this._deltaY = 0; // tracks cumulative change E/W

    movements.forEach(this._update);

    /** Width and Height **/

    var containerWidth = container.width();
    var minWidth = containerWidth / SCALE; // minimum width in steps
    var overallX = this._maxX - this._minX;
    this.width = Math.max(minWidth, overallX + MARGIN);

    var containerHeight = container.height();
    var minHeight = containerHeight / containerWidth * this.width; // minimum height in steps
    var overallY = this._maxY - this._minY;
    // explicit check to maintain aspect ratio
    if (overallY + MARGIN > minHeight) {
        this.height = overallY + MARGIN;
        this.width = containerWidth / containerHeight * this.height;
    } else {
        this.height = minHeight;
    }

    /** Edges **/

    var start = movements[0].startPosition;
    this.south = start.x + this._maxX - this.width/2 - overallX/2;
    this.north = this.south + this.width;
    this.west = start.y + this._maxY - this.height/2 - overallY/2;
    this.east = this.west + this.height;
};

MovementViewport.prototype._update = function(movement) {
    this._deltaX += movement.deltaX;
    this._deltaY += movement.deltaY;

    if (this._deltaX < this._minX) {
        this._minX = this._deltaX;
    } else if (this._deltaX > this._maxX) {
        this._maxX = this._deltaX;
    }

    if (this._deltaY < this._minY) {
        this._minY = this._deltaY;
    } else if (this._deltaY > this._maxY) {
        this._maxY = this._deltaY;
    }
};

module.exports = MovementViewport;
