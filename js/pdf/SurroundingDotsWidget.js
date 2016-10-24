/**
 * @fileOverview Defines the widget for generating the surrounding dots widget
 */

var JSUtils = require("../viewer/utils/JSUtils");
var PDFUtils = require("./PDFUtils");
var PDFWidget = require("./PDFWidget");

// font size is smaller for dot labels
FONT_SIZE = 7;
DOT_RADIUS = 1;

/**
 * Represents the widget for the surrounding dots
 *
 * This widget will include a close up of the surrounding area of a 4-step radius,
 * with dots and dot labels marking any dots nearby the selected dot, which is
 * in the middle of the widget.
 *
 * @param {jsPDF} pdf, the jsPDF object to be written to
 * @param {String} orientation, the direction on the top of the box
 */
var SurroundingDotsWidget = function(pdf, orientation) {
    this.westUp = orientation === "west";
    PDFWidget.apply(this, [pdf]);
};

JSUtils.extends(SurroundingDotsWidget, PDFWidget);

/**
 * Draws the Surrounding Dots Widget with the given options:
 *      - {Sheet} sheet, the current sheet
 *      - {Dot} dot, the selected dot
 *      - {boolean} minimal, true if drawing as little of the widget as possible, false otherwise
 */
SurroundingDotsWidget.prototype.draw = function(x, y, width, height, options) {
    var _this = this;

    var textWidth = PDFUtils.getTextWidth("S", FONT_SIZE);
    var textHeight = PDFUtils.getTextHeight(FONT_SIZE);

    var box = {
        x: x,
        y: y,
        width: width - 2 * (textWidth + 2),
        height: height - 2 * (textHeight + 2),
    };

    // center box
    box.x += width/2 - box.width/2;
    box.y += height/2 - box.height/2;

    if (options.minimal) {
        box.y -= textHeight;
    }

    this._drawBox(box.x, box.y, box.width, box.height, this.westUp, options.minimal);

    var origin = {
        x: box.x + box.width/2,
        y: box.y + box.height/2
    };
    var sheet = options.sheet;
    var start = options.dot.getAnimationState(0);
    var orientationFactor = this.westUp ? 1 : -1;
    var scale = box.height / 19.5; // radius of 8 steps + 1.75 steps of padding

    // YARDLINES
    var radiusX = 14;
    var radiusY = 8;
    var left = this.westUp ? start.x - radiusX : start.x + radiusX;
    var viewport = {
        east: start.y + box.height/2 / scale,
        west: start.y - box.height/2 / scale,
        north: start.x + box.width/2 / scale,
        south: start.x - box.width/2 / scale,
        westUp: this.westUp,
    };
    this._drawYardlines(box, viewport, scale);

    // DOTS
    this.pdf.setFontSize(FONT_SIZE);
    sheet.getDots().forEach(function(dot) {
        var position = dot.getAnimationState(0);
        var deltaX = orientationFactor * (position.x - start.x);
        var deltaY = orientationFactor * (position.y - start.y);
        if (Math.abs(deltaX) > radiusX || Math.abs(deltaY) > radiusY) {
            return;
        }

        var label = dot.getLabel();
        if (deltaX === 0 && deltaY === 0) {
            _this.pdf.setFontStyle("bold");
        } else {
            _this.pdf.setFontStyle("normal");
        }

        var x = deltaX * scale + origin.x;
        var y = deltaY * scale + origin.y;
        _this.pdf.drawDot(sheet.getDotType(label), x, y, DOT_RADIUS);
        _this.pdf.text(label, x - DOT_RADIUS * 2, y - DOT_RADIUS * 1.5);
    });

    this.pdf.resetFormat();
};

module.exports = SurroundingDotsWidget;