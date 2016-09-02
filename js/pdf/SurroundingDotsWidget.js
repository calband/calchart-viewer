/**
 * @fileOverview Defines the widget for generating the surrounding dots widget
 */

var JSUtils = require("../viewer/utils/JSUtils");
var PDFUtils = require("./PDFUtils");
var PDFWidget = require("./PDFWidget");

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
    this.westUp = (orientation === "west") ? true : false;
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

    var textWidth = PDFUtils.getTextWidth("S", PDFUtils.DEFAULT_FONT_SIZE);
    var textHeight = PDFUtils.getTextHeight(PDFUtils.DEFAULT_FONT_SIZE);
    var boxSize = height - 2 * (textHeight + 2);

    var box = {
        x: x,
        y: y,
        width: boxSize,
        height: boxSize
    };

    // center box
    box.x += width/2 - box.width/2;
    box.y += height/2 - box.height/2;

    if (options["minimal"]) {
        box.y -= textHeight;
    }

    this._drawBox(box.x, box.y, box.width, box.height, this.westUp, options["minimal"]);

    var origin = {
        x: box.x + box.width/2,
        y: box.y + box.height/2
    };

    this.pdf.setDrawColor(150);
    this.pdf.setLineWidth(.1);
    // cross hairs for selected dot
    this.pdf.line(
        origin.x, box.y,
        origin.x, box.y + box.height
    );
    this.pdf.line(
        box.x, origin.y,
        box.x + box.width, origin.y
    );

    var sheet = options["sheet"];
    var start = options["dot"].getAnimationState(0);
    var orientationFactor = this.westUp ? 1 : -1;

    var allDots = sheet.getDots();
    var surroundingDots = [];
    allDots.forEach(function(dot) {
        var position = dot.getAnimationState(0);
        var deltaX = orientationFactor * (position.x - start.x);
        var deltaY = orientationFactor * (position.y - start.y);
        if (Math.abs(deltaX) <= 4 && Math.abs(deltaY) <= 4) {
            var label = dot.getLabel();
            surroundingDots.push({
                deltaX: deltaX,
                deltaY: deltaY,
                label: label,
                type: sheet.getDotType(label)
            });
        }
    });

    var scale = box.height / 11.5; // radius of 4 steps + 1.75 steps of padding
    var labelSize = box.height * 7/29;
    var dotRadius = box.height * .04;
    this.pdf.setFontSize(labelSize);
    for (var i = 0; i < surroundingDots.length; i++) {
        var dot = surroundingDots[i];
        var x = dot.deltaX * scale + origin.x;
        var y = dot.deltaY * scale + origin.y;
        this.pdf.drawDot(dot.type, x, y, dotRadius);
        this.pdf.text(dot.label, x - dotRadius * 2, y - dotRadius * 1.5);
    }
    this.pdf.resetFormat();
};

module.exports = SurroundingDotsWidget;