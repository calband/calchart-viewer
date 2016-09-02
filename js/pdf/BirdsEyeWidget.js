/**
 * @fileOverview Defines the widget for generating the bird's eye view widget
 */

var JSUtils = require("../viewer/utils/JSUtils");
var PDFUtils = require("./PDFUtils");
var PDFWidget = require("./PDFWidget");

/**
 * Represents the widget for the bird's eye view
 *
 * This widget will include the overall formation with grayed out dots, with
 * the selected dot being darkened, and coordinates for the selected dot. (See
 * the PDFUtils file for the format of the coordinates)
 *
 * @param {jsPDF} pdf, the jsPDF object to be written to
 * @param {String} orientation, the direction on the top of the box
 */
var BirdsEyeWidget = function(pdf, orientation) {
    this.westUp = (orientation === "west") ? true : false;
    PDFWidget.apply(this, [pdf]);
};

JSUtils.extends(BirdsEyeWidget, PDFWidget);

/**
 * Draws the Bird's Eye Widget with the given options:
 *      - {Sheet} sheet, the current sheet
 *      - {Dot} dot, the selected dot
 *      - {boolean} minimal, true if drawing as little of the widget as possible, false otherwise
 */
BirdsEyeWidget.prototype.draw = function(x, y, width, height, options) {
    var _this = this;

    var textWidth = PDFUtils.getTextWidth("S", PDFUtils.DEFAULT_FONT_SIZE);
    var textHeight = PDFUtils.getTextHeight(PDFUtils.DEFAULT_FONT_SIZE);
    var boxWidth = width - 2 * (textWidth + 1.5);

    var box = {
        x: x,
        y: y,
        width: boxWidth,
        height: boxWidth * 84/160 // maintain aspect ratio of field
    };

    // center box
    box.x += width/2 - box.width/2;
    box.y += height/2 - box.height/2;

    this._drawBox(box.x, box.y, box.width, box.height, this.westUp, options["minimal"]);

    var dots = options["sheet"].getDots();
    var selectedDot = options["dot"];
    var scale = box.width / 160; // units per step

    // drawing hashes
    this.pdf.setLineWidth(.2);
    var numDashes = 21;
    var dashLength = box.width / numDashes;
    var topHash = box.y + 32 * scale;
    var bottomHash = box.y + 52 * scale;
    this.pdf.setDrawColor(150);
    for (var i = 0; i < numDashes; i += 2) {
        var x = box.x + i * dashLength;
        this.pdf.line(
            x, topHash,
            x + dashLength, topHash
        );
        this.pdf.line(
            x, bottomHash,
            x + dashLength, bottomHash
        );
    }

    // drawing all the dots
    this.pdf.setFillColor(210);
    dots.forEach(function(dot) {
        if (dot === selectedDot) {
            return;
        }
        var position = dot.getAnimationState(0);
        if (!_this.westUp) {
            position.x = 160 - position.x;
            position.y = 84 - position.y;
        }
        _this.pdf.circle(
            box.x + position.x * scale,
            box.y + position.y * scale,
            .5,
            "F"
        );
    });

    // drawing selected dot
    var position = selectedDot.getAnimationState(0);
    var coordinates = {
        textSize: 8,
        textX: PDFUtils.getXCoordinateText(position.x),
        textY: PDFUtils.getYCoordinateText(position.y)
    };

    if (!this.westUp) {
        position.x = 160 - position.x;
        position.y = 84 - position.y;
    }
    var x = position.x * scale;
    var y = position.y * scale;

    coordinates.x = box.x + x - PDFUtils.getTextWidth(coordinates.textX, coordinates.textSize)/2;
    coordinates.y = box.y + y + PDFUtils.getTextHeight(coordinates.textSize)/4;

    this.pdf.setFillColor(0);
    this.pdf.setDrawColor(180);
    this.pdf.setFontSize(coordinates.textSize);

    this.pdf.line(
        box.x + x, box.y,
        box.x + x, box.y + box.height
    );
    this.pdf.line(
        box.x, box.y + y,
        box.x + box.width, box.y + y
    );

    // Put vertical coordinate text on opposite side of the field
    if (position.x > 80) {
        this.pdf.text(
            coordinates.textY,
            box.x + 1,
            coordinates.y
        );
    } else {
        this.pdf.text(
            coordinates.textY,
            box.x + box.width - PDFUtils.getTextWidth(coordinates.textY, coordinates.textSize) - 1,
            coordinates.y
        );
    }

    // Put horizontal coordinate text on opposite side of the field
    if (position.y > 42) {
        this.pdf.text(
            coordinates.textX,
            coordinates.x,
            box.y + PDFUtils.getTextHeight(coordinates.textSize)
        );
    } else {
        this.pdf.text(
            coordinates.textX,
            coordinates.x,
            box.y + box.height - 1
        );
    }
    this.pdf.circle(box.x + x, box.y + y, .5, "F");
    this.pdf.resetFormat();
};

module.exports = BirdsEyeWidget;