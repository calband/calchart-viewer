/**
 * @fileOverview Defines the widget for generating a dot's movement diagram
 */

var JSUtils = require("../viewer/utils/JSUtils");
var PDFUtils = require("./PDFUtils");
var PDFWidget = require("./PDFWidget");

/**
 * Represents the widget for a given dot's movement diagram
 *
 * This widget will include lines that show the movement of the dot, with
 * a circle at the start and a cross at the end.
 *
 * @param {jsPDF} pdf, the jsPDF object to be written to
 * @param {String} orientation, the direction on the top of the box
 */
var MovementDiagramWidget = function(pdf, orientation) {
    this.westUp = orientation == "west";
    PDFWidget.apply(this, [pdf]);
};

JSUtils.extends(MovementDiagramWidget, PDFWidget);

/**
 * Draws the Movement Diagram Widget with the given options:
 *      - {Array<Object>} movements, a list of every movement as an object containing:
 *          + startPosition
 *          + deltaX
 *          + deltaY
 *      - {boolean} minimal, true if drawing as little of the widget as possible, false otherwise
 */
MovementDiagramWidget.prototype.draw = function(x, y, width, height, options) {
    var _this = this;
    var movements = options["movements"];

    var textWidth = PDFUtils.getTextWidth("S", PDFUtils.DEFAULT_FONT_SIZE);
    var textHeight = PDFUtils.getTextHeight(PDFUtils.DEFAULT_FONT_SIZE);

    var box = {
        x: x,
        y: options.minimal ? y + textHeight : y,
        width: width - 2 * (textWidth + 2),
        height: height - 2 * textHeight,
    };

    box.x += width/2 - box.width/2;
    box.y += height/2 - box.height/2;

    if (options["minimal"]) {
        box.y -= textHeight;
    }

    this._drawBox(
        box.x,
        box.y,
        box.width,
        box.height,
        this.westUp,
        options["minimal"]
    );

    var start = movements[0].startPosition;

    // calculates scale of viewport
    var viewport = {
        startX: start.x,
        startY: start.y,
        minX: 0, // minX <= 0, maximum movement South
        minY: 0, // minY <= 0, maximum movement West
        maxX: 0, // maxX >= 0, maximum movement North
        maxY: 0, // maxY >= 0, maximum movement East
        deltaX: 0, // overall change in NS
        deltaY: 0, // overall change in EW
        width: 20, // in steps
        height: box.height/box.width * 20, // in steps, keeping height/width ratio
        update: function(x, y) {
            this.deltaX += x;
            this.deltaY += y;
            if (this.deltaX < this.minX) {
                this.minX = this.deltaX;
            } else if (this.deltaX > this.maxX) {
                this.maxX = this.deltaX;
            }

            if (this.deltaY < this.minY) {
                this.minY = this.deltaY;
            } else if (this.deltaY > this.maxY) {
                this.maxY = this.deltaY;
            }
        },
        getOverallX: function() {
            return this.maxX - this.minX;
        },
        getOverallY: function() {
            return this.maxY - this.minY;
        },
        scale: function() {
            var deltaX = this.getOverallX();
            var deltaY = this.getOverallY();
            if (deltaX > this.width - 4) {
                this.width = deltaX + 4;
                this.height = box.height/box.width * this.width;
            }
            if (deltaY > this.height - 4) {
                this.height = deltaY + 4;
                this.width = box.width/box.height * this.height;
            }
        }
    };

    movements.forEach(function(move) {
        viewport.update(move.deltaX, move.deltaY);
    });
    viewport.scale();

    var scale = box.width / viewport.width;

    // steps from sideline until start of viewport
    var south = viewport.startX + viewport.maxX - viewport.getOverallX()/2 - viewport.width/2;
    var west = viewport.startY + viewport.maxY - viewport.getOverallY()/2 - viewport.height/2;
    var north = south + viewport.width;
    var east = west + viewport.height;

    // renaming variables in terms of box for ease of abstraction
    var top, bottom, left, right;
    // first yardline in viewport
    var yardline;
    if (this.westUp) {
        top = west;
        bottom = east;
        left = south;
        right = north;
        yardline = Math.ceil(left/8) * 5;
    } else {
        top = east;
        bottom = west;
        left = north;
        right = south;
        yardline = Math.floor(left/8) * 5;
    }
    var yardlineViewport = {
        east: east,
        west: west,
        south: south,
        north: north,
        westUp: this.westUp,
    };

    this._drawYardlines(box, yardlineViewport, scale);

    var currX = box.x + Math.abs(left - viewport.startX) * scale;
    var currY = box.y + Math.abs(top - viewport.startY) * scale;
    var spotRadius = box.height / 15;
    var orientationFactor = (this.westUp) ? 1 : -1;

    this.pdf.setLineWidth(0.5);
    this.pdf.circle(currX, currY, spotRadius);
    this._drawPosition(
        box,
        viewport.startY,
        currY - box.y,
        Math.abs(left - viewport.startX) < Math.abs(left - right) / 2
    );

    this.pdf.setLineWidth(0.75);
    movements.forEach(function(movement) {
        var deltaX = orientationFactor * movement.deltaX * scale;
        var deltaY = orientationFactor * movement.deltaY * scale;
        _this.pdf.line(currX, currY, currX + deltaX, currY + deltaY);
        currX += deltaX;
        currY += deltaY;
    });

    this.pdf.setLineWidth(0.5);
    this.pdf.line(
        currX - spotRadius, currY - spotRadius,
        currX + spotRadius, currY + spotRadius
    );
    this.pdf.line(
        currX + spotRadius, currY - spotRadius,
        currX - spotRadius, currY + spotRadius
    );
    if (viewport.deltaY != 0) {
        this._drawPosition(
            box,
            viewport.startY + viewport.deltaY,
            currY - box.y,
            Math.abs(left - viewport.startX - viewport.deltaX) < Math.abs(left - right) / 2
        );
    }
    this.pdf.resetFormat();
};

/**
 * Draws the lines for the y-coordinate of the given position
 *
 * @param {object} box, holds the various properties of the enclosing box
 * @param {int} y, the y-coordinate of the dot's position in steps from west sideline
 * @param {float} offset, distance from top of box to dot position
 * @param {boolean} closeToLeft, true if dot is close to the left side of the box, false otherwise
 */
MovementDiagramWidget.prototype._drawPosition = function(box, y, offset, closeToLeft) {
    var lineY = box.y + offset;
    var text = PDFUtils.getYCoordinateText(y);
    this.pdf.setFontSize(8);
    if (closeToLeft) {
        this.pdf.text(
            text,
            box.x + box.width - PDFUtils.getTextWidth(text, 8) - .5,
            lineY
        );
    } else {
        this.pdf.text(
            text,
            box.x + .5,
            lineY
        );
    }
    this.pdf.resetFormat();
};

module.exports = MovementDiagramWidget;
