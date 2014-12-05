/**
 * @fileOverview Defines the widget for generating a dot type's continuity
 */

var JSUtils = require("../viewer/utils/JSUtils");
var PDFUtils = require("./PDFUtils");
var PDFWidget = require("./PDFWidget");

/**
 * Represents the widget for a given dot type's continuity
 *
 * This widget will include an image of the dot type and the overall dot type continuity
 *
 * @param {jsPDF} pdf, the jsPDF object to be written to
 */
var DotContinuityWidget = function(pdf) {
    PDFWidget.apply(this, [pdf]);
};

JSUtils.extends(DotContinuityWidget, PDFWidget);

/**
 * Draws the Dot Continuity Widget with the given options:
 *      - {Sheet} sheet, the current sheet
 *      - {String} dotType, the type of dot to draw
 */
DotContinuityWidget.prototype.draw = function(x, y, width, height, options) {
    var _this = this;

    var box = {
        paddingX: 2,
        paddingY: 1
    };
    var text = {
        x: x + box.paddingX,
        y: y + box.paddingY,
        size: 10
    };
    var dotType = options["dotType"];
    var maxWidth = width - box.paddingX * 2 - 6;
    var maxHeight = height - box.paddingY * 2 - 3;
    var continuities = options["sheet"].getContinuityTexts(dotType);

    this.pdf.rect(x, y, width, height - 1.5);

    // fail-safe for sheets without Continuity Texts
    if (typeof continuities === "undefined") {
        return;
    }

    continuities = continuities.map(function(continuity) {
        while (PDFUtils.getTextWidth(continuity, text.size) > maxWidth) {
            text.size--;
        }
        return continuity;
    });

    while (continuities.length * PDFUtils.getTextHeight(text.size) > maxHeight) {
        text.size--;
    }

    this.pdf.drawDot(
        dotType,
        text.x + 1.5,
        text.y + 2
    );
    text.x += 4;
    this.pdf.setFontSize(10);
    this.pdf.text(
        ":",
        text.x,
        text.y + PDFUtils.getTextHeight(10)
    );
    this.pdf.setFontSize(text.size);
    text.x += 2;
    text.y += PDFUtils.getTextHeight(text.size);
    this.pdf.text(
        continuities,
        text.x,
        text.y
    );
    this.pdf.resetFormat();
};

module.exports = DotContinuityWidget;