/**
 * @fileOverview Defines the widget for generating a dot's individual continuity
 */

var ClassUtils = require("../ClassUtils");
var PDFUtils = require("./PDFUtils");
var PDFWidget = require("./PDFWidget");

/**
 * Represents the widget for a given dot's individual continuity
 *
 * This widget will include each movement for the dot and the duration of the stuntsheet
 *
 * @param {jsPDF} pdf, the jsPDF object to be written to
 */
var IndividualContinuityWidget = function(pdf) {
    PDFWidget.apply(this, [pdf]);
};

ClassUtils.extends(IndividualContinuityWidget, PDFWidget);

IndividualContinuityWidget.prototype.draw = function(x, y, width, height, options) {
    var continuities = options['continuities'];

    var box = {
        paddingX: 2,
        paddingY: 1,
        size: 10
    };
    var textHeight = PDFUtils.getTextHeight(box.size);
    var textY = y + box.paddingY;
    var textX = x + box.paddingX;
    var maxWidth = 0; // keeps track of longest continuity length
    var deltaY = 0; // keeps track of total height of all continuities

    this.pdf.rect(x, y, width, height);
    this.pdf.setFontSize(box.size);
    for (var i = 0; i < continuities.length; i++) {
        var continuity = continuities[i];
        var length = PDFUtils.getTextWidth(continuity, box.size);
        if (length > maxWidth) {
            maxWidth = length;
        }
        deltaY += PDFUtils.getTextHeight(box.size) + .7;
        if (deltaY > height - textHeight - box.paddingY) {
            if (maxWidth < width/2) {
                textX += width/2;
                deltaY = PDFUtils.getTextHeight(box.size) + .7;
            } else {
                this.pdf.text("...", textX, textY);
                break;
            }
        }

        this.pdf.text(
            continuity,
            textX,
            textY + deltaY
        );
    }

    var totalLabel = options["duration"] + " beats total";
    this.pdf.text(
        totalLabel,
        x + width/2 - PDFUtils.getTextWidth(totalLabel, box.size)/2 - 3,
        y + height - box.paddingY
    );
};

module.exports = IndividualContinuityWidget;