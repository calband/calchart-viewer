/**
 * @fileOverview Defines the widget for generating the surrounding dots widget
 */

var JSUtils = require("../viewer/utils/JSUtils");
var PDFUtils = require("./PDFUtils");
var PDFWidget = require("./PDFWidget");

// font size is smaller for dot labels
FONT_SIZE = 7;

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

    if (options["minimal"]) {
        box.y -= textHeight;
    }

    this._drawBox(box.x, box.y, box.width, box.height, this.westUp, options["minimal"]);

    var origin = {
        x: box.x + box.width/2,
        y: box.y + box.height/2
    };
    var sheet = options["sheet"];
    var start = options["dot"].getAnimationState(0);
    var orientationFactor = this.westUp ? 1 : -1;
    var scale = box.height / 19.5; // radius of 8 steps + 1.75 steps of padding

    // YARDLINES

    this.pdf.setDrawColor(150);
    this.pdf.setLineWidth(.1);
    // # of steps north of the yardline the dot is at
    var yardlineDelta = start.x % 8;
    if (yardlineDelta > 4) {
        yardlineDelta = 4 - yardlineDelta;
    }
    var yardlineX = origin.x - yardlineDelta * scale * orientationFactor;
    this.pdf.vLine(yardlineX, box.y, box.height);
    // the only time 2 yardlines will be drawn is if the dot is splitting
    if (Math.abs(yardlineDelta) === 4) {
        yardlineX = origin.x + yardlineDelta * scale * orientationFactor;
        this.pdf.vLine(yardlineX, box.y, box.height);
    }

    // DOTS

    var allDots = sheet.getDots();
    var surroundingDots = [];
    allDots.forEach(function(dot) {
        var position = dot.getAnimationState(0);
        var deltaX = orientationFactor * (position.x - start.x);
        var deltaY = orientationFactor * (position.y - start.y);
        if (Math.abs(deltaX) <= 14 && Math.abs(deltaY) <= 8) {
            var label = dot.getLabel();
            surroundingDots.push({
                deltaX: deltaX,
                deltaY: deltaY,
                label: label,
                type: sheet.getDotType(label)
            });
        }
    });

    var dotRadius = 1;
    this.pdf.setFontSize(FONT_SIZE);
    for (var i = 0; i < surroundingDots.length; i++) {
        var dot = surroundingDots[i];

        if (dot.deltaX === 0 && dot.deltaY === 0) {
            this.pdf.setFontStyle("bold");
        } else {
            this.pdf.setFontStyle("normal");
        }

        var x = dot.deltaX * scale + origin.x;
        var y = dot.deltaY * scale + origin.y;
        this.pdf.drawDot(dot.type, x, y, dotRadius);
        this.pdf.text(dot.label, x - dotRadius * 2, y - dotRadius * 1.5);
    }
    this.pdf.resetFormat();
};

module.exports = SurroundingDotsWidget;