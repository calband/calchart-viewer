/**
 * @fileOverview Defines a base class for the PDFGenerator Widget classes
 */

/**
 * PDFWidget class
 *
 * Represents one of the widgets available on the PDFGenerator. Each widget draws
 * a different component of the PDF, which shows detailed information about a
 * given marcher on a given stuntsheet. This is an abstract class; do not make
 * an instance of this class directly.
 *
 * @param {jsPDF} pdf, the jsPDF object to be written to
 */
var PDFWidget = function(pdf) {
    this.pdf = pdf;
};

/**
 * Draws this widget onto the pdf, with whatever options passed into it as key-value
 * pairs. For example, the options passed into the individual continuity widget might be:
 *     {
 *          continuities: [<String>, <String>],
 *          duration: 32,
 *          ...
 *     }
 *
 * @param {float} x, the x-coordinate of the position of this widget
 * @param {float} y, the y-coordinate of the position of this widget
 * @param {float} width, the width of this widget
 * @param {float} height, the height of this widget
 * @param {Object} options, the options necessary to draw a given widget as key-value pairs
 */
PDFWidget.prototype.draw = function(x, y, width, height, options) {
    console.log("draw called");
};

/**
 * A helper method for widgets that utilize a box that draws field-related
 * information such as movements, formations, or nearby dots. Draws the confining
 * box and the EWNS directions.
 *
 * @param {float} x, the x-coordinate of the top-left corner of the box
 * @param {float} y, the y-coordinate of the top-left corner of the box
 * @param {float} width, the width of the box
 * @param {float} height, the height of the box
 * @param {boolean} westUp, true if West on top of the box, false otherwise
 * @param {boolean} minimal, true to draw as little of the box as possible, false otherwise
 */
PDFWidget.prototype._drawBox = function(x, y, width, height, westUp, minimal) {
    var textSize = 12;
    var textHeight = PDFUtils.getTextHeight(textSize);
    var textWidth = PDFUtils.getTextWidth("S", textSize);

    // labels for sides of box
    var top, bottom, left, right;
    if (westUp) {
        top = "W";
        bottom = "E";
        left = "S";
        right = "N";
    } else {
        top = "E";
        bottom = "W";
        left = "N";
        right = "S";
    }

    this.pdf.setFontSize(textSize);
    if (!minimal) {
        this.pdf.text(
            top,
            x + width/2 - textWidth/2 - .5,
            y - 2
        );
        this.pdf.text(
            bottom,
            x + width/2 - textWidth/2 - .5,
            y + height + textHeight
        );
    }
    this.pdf.text(
        left,
        x - textWidth - 1,
        y + height/2 + textHeight/2
    );
    this.pdf.text(
        right,
        x + width + 1,
        y + height/2 + textHeight/2
    );
    this.pdf.rect(x, y, width, height);
};

/**
 * Resets all pdf options to default values. Should be called at the end of functions that
 * change the default values.
 */
PDFWidget.prototype._resetFormat = function() {
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(0);
    this.pdf.setDrawColor(0);
    this.pdf.setFillColor(0);
    this.pdf.setLineWidth(.3);
};

module.exports = PDFWidget;